import { User, Initiative, HelpWanted, RecommendedInitiative, RecommendedHelpWanted } from '../types';
import { CreateInitiativeData } from './api';
import * as freeAIService from './freeAIService';

/**
 * Free LLM Service - Supports multiple free LLM providers
 * Currently supports: Groq API (LLaMA models) and Hugging Face Inference API
 */

// Configuration for different LLM providers
const LLM_CONFIG = {
  groq: {
    baseUrl: (typeof window !== 'undefined' && (window as any).__DEV_PROXY__) ? '/api/groq' : 'https://api.groq.com/openai/v1',
    models: {
      llama3: 'llama-3-8b-8192',
      llama2: 'llama2-70b-4096',
      mixtral: 'mixtral-8x7b-32768'
    },
    requiresApiKey: true,
    free: true
  },
  huggingface: {
    baseUrl: 'https://api-inference.huggingface.co/models',
    models: {
      llama2: 'meta-llama/Llama-2-7b-chat-hf',
      mistral: 'mistralai/Mistral-7B-Instruct-v0.1',
      bloom: 'bigscience/bloom-560m'
    },
    requiresApiKey: true,
    free: true
  },
  local: {
    baseUrl: 'http://localhost:11434', // Ollama default
    models: {
      llama3: 'llama3',
      llama2: 'llama2',
      mistral: 'mistral'
    },
    requiresApiKey: false,
    free: true
  }
};

// Get API key from environment or use demo key
const getApiKey = (provider: keyof typeof LLM_CONFIG): string => {
  if (typeof process !== 'undefined') {
    switch (provider) {
      case 'groq':
        return process.env.GROQ_API_KEY || 'demo-key';
      case 'huggingface':
        return process.env.HUGGINGFACE_API_KEY || 'demo-key';
      default:
        return '';
    }
  }
  return 'demo-key';
};

// Current provider (can be changed via environment variable)
const CURRENT_PROVIDER: keyof typeof LLM_CONFIG = 
  (typeof process !== 'undefined' && process.env.LLM_PROVIDER as keyof typeof LLM_CONFIG) || 'groq';

/**
 * Make API call to LLM service
 */
const callLLM = async (prompt: string, systemPrompt?: string): Promise<string> => {
  const config = LLM_CONFIG[CURRENT_PROVIDER];
  const apiKey = getApiKey(CURRENT_PROVIDER);
  
  // For demo purposes, if no real API key, use fallback logic
  if (apiKey === 'demo-key' && CURRENT_PROVIDER !== 'local') {
    return await fallbackLLMResponse(prompt, systemPrompt);
  }

  try {
    const isProxied = config.baseUrl.startsWith('/api/');
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(isProxied ? {} : (config.requiresApiKey && apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}))
      },
      body: JSON.stringify({
        model: config.models.llama3 || config.models.llama2,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.warn(`LLM API call failed, using fallback:`, error);
    return await fallbackLLMResponse(prompt, systemPrompt);
  }
};

// --- Robust JSON parsing helpers ---
const extractCodeFenceJson = (text: string): string | null => {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenceMatch ? fenceMatch[1] : null;
};

const extractFirstJsonBlock = (text: string): string | null => {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    return text.substring(first, last + 1);
  }
  return null;
};

const parseJsonFromText = <T = any>(text: string): T | null => {
  try {
    return JSON.parse(text) as T;
  } catch (_) {
    const fenced = extractCodeFenceJson(text);
    if (fenced) {
      try { return JSON.parse(fenced) as T; } catch (_) { /* noop */ }
    }
    const block = extractFirstJsonBlock(text);
    if (block) {
      try { return JSON.parse(block) as T; } catch (_) { /* noop */ }
    }
    return null;
  }
};

/**
 * Fallback LLM response using enhanced rule-based logic
 * This provides better responses than the basic freeAIService
 */
const fallbackLLMResponse = async (prompt: string, systemPrompt?: string): Promise<string> => {
  // Enhanced pattern matching and response generation
  const lowerPrompt = prompt.toLowerCase();
  
  if (systemPrompt?.includes('recommendation')) {
    return generateRecommendationResponse(prompt);
  } else if (systemPrompt?.includes('analysis')) {
    return generateAnalysisResponse(prompt);
  } else if (systemPrompt?.includes('extraction')) {
    return generateExtractionResponse(prompt);
  } else {
    return generateGeneralResponse(prompt);
  }
};

const generateRecommendationResponse = (prompt: string): string => {
  // Extract user skills and initiatives from prompt
  const skillsMatch = prompt.match(/skills?[:\s]*([^.\n]+)/i);
  const initiativesMatch = prompt.match(/initiatives?[:\s]*([^.\n]+)/i);
  
  if (skillsMatch && initiativesMatch) {
    const skills = skillsMatch[1].split(',').map(s => s.trim());
    const initiatives = initiativesMatch[1].split('\n').filter(i => i.trim());
    
    // Generate recommendations based on skill matching
    const recommendations = initiatives.slice(0, 3).map((initiative, index) => ({
      initiativeId: `init-${index + 1}`,
      reasoning: `Your expertise in ${skills[0] || 'relevant skills'} makes you a great fit for this initiative.`
    }));
    
    return JSON.stringify({ recommendations });
  }
  
  return JSON.stringify({ recommendations: [] });
};

const generateAnalysisResponse = (prompt: string): string => {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('build') || lowerPrompt.includes('create')) {
    return JSON.stringify({ intent: 'build', keywords: extractKeywords(prompt) });
  } else if (lowerPrompt.includes('join') || lowerPrompt.includes('help')) {
    return JSON.stringify({ intent: 'join', keywords: extractKeywords(prompt) });
  } else {
    return JSON.stringify({ intent: 'general', keywords: extractKeywords(prompt) });
  }
};

const generateExtractionResponse = (prompt: string): string => {
  const title = extractTitle(prompt);
  const description = extractDescription(prompt);
  const skills = extractSkills(prompt);
  const tags = extractTags(prompt);
  
  return JSON.stringify({
    title: title || 'Document-based Initiative',
    description: description || prompt.substring(0, 200) + '...',
    skillsNeeded: skills,
    tags: tags
  });
};

const generateGeneralResponse = (prompt: string): string => {
  return `Based on the provided information: ${prompt.substring(0, 100)}...`;
};

// Helper functions
const extractKeywords = (text: string): string[] => {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 10);
};

const extractTitle = (text: string): string => {
  const titlePatterns = [
    /(?:title|project|initiative)[\s:]*([^\n\r]{5,100})/i,
    /^([^\n\r]{10,100})$/m
  ];
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
};

const extractDescription = (text: string): string => {
  const descPatterns = [
    /(?:description|overview|summary)[\s:]*([^\n\r]{20,500})/i,
    /(?:objective|goal|purpose)[\s:]*([^\n\r]{20,500})/i
  ];
  
  for (const pattern of descPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, 3).join('. ').trim();
};

const extractSkills = (text: string): string[] => {
  const commonSkills = [
    'React', 'JavaScript', 'TypeScript', 'Python', 'Java', 'Node.js', 'Vue', 'Angular',
    'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'AI', 'ML', 'Data Science',
    'Figma', 'Design', 'UI', 'UX', 'Mobile', 'iOS', 'Android', 'Web', 'Backend',
    'Frontend', 'Fullstack', 'DevOps', 'Security', 'Testing', 'Documentation'
  ];
  
  return commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  ).slice(0, 10);
};

const extractTags = (text: string): string[] => {
  const commonTags = [
    'AI/ML', 'Frontend', 'Backend', 'Mobile', 'Data', 'Analytics', 'Design',
    'DevOps', 'Security', 'Testing', 'Documentation', 'Research', 'Innovation'
  ];
  
  return commonTags.filter(tag => 
    text.toLowerCase().includes(tag.toLowerCase())
  ).slice(0, 8);
};

/**
 * Recommends initiatives for a user based on their skills.
 */
export const getRecommendedInitiatives = async (user: User, initiatives: Initiative[]): Promise<RecommendedInitiative[]> => {
  if (!user.skills || user.skills.length === 0) return [];

  const activeInitiatives = initiatives.filter(i => i.status === 'Searching Talent');
  if (activeInitiatives.length === 0) return [];

  const systemPrompt = `You are an AI recommendation engine. Analyze user skills and available initiatives to provide personalized recommendations. Respond with ONLY a JSON object of the form { "recommendations": [{"initiativeId": string, "reasoning": string}, ...] }`;
  
  const prompt = `
    User Profile:
    - Name: ${user.name}
    - Role: ${user.role}
    - Skills: ${user.skills.join(', ')}

    Available Initiatives:
    ${activeInitiatives.map(i => `- ID: ${i.id}\n  Title: ${i.title}\n  Description: ${i.description}\n  Skills Needed: ${i.skillsNeeded.join(', ')}\n`).join('')}

    Provide up to 3 recommendations with encouraging reasoning.
  `;

  try {
    const response = await callLLM(prompt, systemPrompt);
    const parsed = parseJsonFromText<{ recommendations?: RecommendedInitiative[] }>(response);
    if (parsed && Array.isArray(parsed.recommendations)) {
      return parsed.recommendations;
    }
    // Fallback to rule-based if parsing failed
    return await freeAIService.getRecommendedInitiatives(user, initiatives);
  } catch (error) {
    console.error('Error getting recommended initiatives:', error);
    return await freeAIService.getRecommendedInitiatives(user, initiatives);
  }
};

/**
 * Recommends Help Wanted posts for a user based on their skills.
 */
export const getRecommendedHelpWantedPosts = async (user: User, helpWantedPosts: HelpWanted[], initiatives: Initiative[]): Promise<RecommendedHelpWanted[]> => {
  if (!user.skills || user.skills.length === 0) return [];

  const openPosts = helpWantedPosts.filter(p => p.status === 'Open');
  if (openPosts.length === 0) return [];

  const initiativeMap = new Map(initiatives.map(i => [i.id, i]));

  const systemPrompt = `You are an AI recommendation engine. Analyze user skills and available help wanted posts to provide personalized role recommendations. Respond with ONLY a JSON object of the form { "recommendations": [{"helpWantedId": string, "reasoning": string}, ...] }`;
  
  const prompt = `
    User Profile:
    - Name: ${user.name}
    - Role: ${user.role}
    - Skills: ${user.skills.join(', ')}

    Available Help Wanted Posts:
    ${openPosts.map(p => `- ID: ${p.id}\n  Initiative: ${initiativeMap.get(p.initiativeId)?.title || 'N/A'}\n  Skill Required: ${p.skill}\n`).join('')}

    Provide up to 3 recommendations with encouraging reasoning.
  `;

  try {
    const response = await callLLM(prompt, systemPrompt);
    const parsed = parseJsonFromText<{ recommendations?: RecommendedHelpWanted[] }>(response);
    if (parsed && Array.isArray(parsed.recommendations)) {
      return parsed.recommendations;
    }
    return await freeAIService.getRecommendedHelpWantedPosts(user, helpWantedPosts, initiatives);
  } catch (error) {
    console.error('Error getting recommended help wanted posts:', error);
    return await freeAIService.getRecommendedHelpWantedPosts(user, helpWantedPosts, initiatives);
  }
};

/**
 * Analyzes the user's search query to determine intent and extract keywords.
 */
export const analyzeSearchQuery = async (query: string): Promise<{ intent: 'build' | 'join' | 'general', keywords: string[] }> => {
  const systemPrompt = `You are an AI search analyzer. Determine user intent and extract keywords from search queries. Respond with ONLY a JSON object of the form { "intent": "build"|"join"|"general", "keywords": string[] }`;
  
  const prompt = `Analyze this search query: "${query}"`;

  try {
    const response = await callLLM(prompt, systemPrompt);
    const parsed = parseJsonFromText<{ intent?: 'build'|'join'|'general', keywords?: string[] }>(response);
    const fallbackKeywords = extractKeywords(query);
    const intent = parsed?.intent || (fallbackKeywords.some(k => ['build','create','design','new'].includes(k.toLowerCase())) ? 'build' : 'general');
    return { 
      intent, 
      keywords: parsed?.keywords && parsed.keywords.length ? parsed.keywords : fallbackKeywords 
    };
  } catch (error) {
    console.error('Error analyzing search query:', error);
    return { intent: 'general', keywords: extractKeywords(query) };
  }
};

/**
 * Finds existing initiatives that are semantically similar to a user's idea.
 */
export const findSimilarInitiatives = async (query: string, initiatives: Initiative[]): Promise<RecommendedInitiative[]> => {
  const systemPrompt = `You are an AI search assistant. Find initiatives similar to the user's idea. Respond with ONLY a JSON object of the form { "recommendations": [{"initiativeId": string, "reasoning": string}, ...] }`;
  
  const prompt = `
    User's Idea: "${query}"

    Available Initiatives:
    ${initiatives.map(i => `- ID: ${i.id}\n  Title: ${i.title}\n  Description: ${i.description}\n  Tags: ${i.tags.join(', ')}\n`).join('')}

    Find the most similar initiatives and provide reasoning.
  `;

  try {
    const response = await callLLM(prompt, systemPrompt);
    const parsed = parseJsonFromText<{ recommendations?: RecommendedInitiative[] }>(response);
    if (parsed && Array.isArray(parsed.recommendations)) {
      return parsed.recommendations;
    }
    // Fallback to rule-based similar search
    return await freeAIService.findSimilarInitiatives(query, initiatives);
  } catch (error) {
    console.error('Error finding similar initiatives:', error);
    return await freeAIService.findSimilarInitiatives(query, initiatives);
  }
};

/**
 * Finds relevant Help Wanted posts and open Initiatives for a user looking to join a project.
 */
export const findMatchingOpportunities = async (keywords: string[], initiatives: Initiative[], helpWantedPosts: HelpWanted[]): Promise<{ initiatives: RecommendedInitiative[], helpWanted: RecommendedHelpWanted[] }> => {
  if (keywords.length === 0) return { initiatives: [], helpWanted: [] };

  const openHelpWanted = helpWantedPosts.filter(p => p.status === 'Open');
  const searchingInitiatives = initiatives.filter(i => i.status === 'Searching Talent');

  const systemPrompt = `You are an AI opportunity finder. Match user interests with available opportunities. Respond with ONLY a JSON object of the form { "initiatives": [{"initiativeId": string, "reasoning": string}], "helpWanted": [{"helpWantedId": string, "reasoning": string}] }`;
  
  const prompt = `
    User Interests: ${keywords.join(', ')}

    Available Help Wanted Posts:
    ${openHelpWanted.map(p => `- ID: ${p.id}, Skill Required: ${p.skill}\n`).join('')}

    Available Initiatives:
    ${searchingInitiatives.map(i => `- ID: ${i.id}, Title: ${i.title}, Skills Needed: ${i.skillsNeeded.join(', ')}\n`).join('')}

    Find matching opportunities for both categories.
  `;

  try {
    const response = await callLLM(prompt, systemPrompt);
    const parsed = parseJsonFromText<{ initiatives?: RecommendedInitiative[], helpWanted?: RecommendedHelpWanted[] }>(response);
    if (parsed) {
      return {
        initiatives: parsed.initiatives || [],
        helpWanted: parsed.helpWanted || []
      };
    }
    // Fallback to rule-based matcher
    return await freeAIService.findMatchingOpportunities(keywords, initiatives, helpWantedPosts);
  } catch (error) {
    console.error('Error finding matching opportunities:', error);
    return await freeAIService.findMatchingOpportunities(keywords, initiatives, helpWantedPosts);
  }
};

/**
 * Extracts key details from a user's query to pre-fill a new initiative form.
 */
export const extractInitiativeDetailsFromQuery = async (query: string): Promise<Partial<CreateInitiativeData>> => {
  const systemPrompt = `You are an AI assistant that extracts initiative details from user queries. Respond with ONLY a JSON object of the form { "title": string, "description": string, "skillsNeeded": string[], "tags": string[] }`;
  
  const prompt = `Extract initiative details from: "${query}"`;

  try {
    const response = await callLLM(prompt, systemPrompt);
    const result = parseJsonFromText<Partial<CreateInitiativeData>>(response) || {};
    return {
      title: result.title || 'New Initiative',
      description: result.description || query,
      skillsNeeded: result.skillsNeeded || [],
      tags: result.tags || []
    };
  } catch (error) {
    console.error('Error extracting initiative details:', error);
    return {};
  }
};

/**
 * Generates a summary of search results based on the user's intent.
 */
export const summarizeSearchResults = async (query: string, results: Initiative[], intent: 'build' | 'join' | 'general'): Promise<string> => {
  if (results.length === 0) return "No matching initiatives found for your search.";

  const systemPrompt = `You are an AI assistant that summarizes search results. Provide a friendly, analytical summary explaining why the results match the user's query.`;
  
  const prompt = `
    User Query: "${query}"
    Intent: ${intent}
    Results: ${results.map(r => `- ${r.title}: ${r.description}`).join('\n')}

    Provide a 2-3 sentence summary.
  `;

  try {
    const response = await callLLM(prompt, systemPrompt);
    return response || "Here are some results we found that seem related to your search.";
  } catch (error) {
    console.error('Error summarizing search results:', error);
    return "Here are some results we found that seem related to your search.";
  }
};

/**
 * Generates high-level insights for the manager dashboard.
 */
export const getDashboardInsights = async (kpiData: any, utilizationData: any[]): Promise<string> => {
  const systemPrompt = `You are an AI analyst providing management insights. Analyze the data and provide professional, actionable insights.`;
  
  const prompt = `
    KPIs:
    - Active Initiatives: ${kpiData.active}
    - Completed this Quarter: ${kpiData.completedQ2}
    - Average Cycle Time: ${kpiData.avgCycleTime}

    Team Utilization:
    ${utilizationData.map(u => `- ${u.location}: ${u.percentage}% utilized`).join('\n')}

    Provide 2-3 sentence insights highlighting key successes, risks, and recommendations.
  `;

  try {
    const response = await callLLM(prompt, systemPrompt);
    return response || "AI insights are currently unavailable.";
  } catch (error) {
    console.error('Error generating dashboard insights:', error);
    return "AI insights are currently unavailable.";
  }
};

