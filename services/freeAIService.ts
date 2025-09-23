import { User, Initiative, HelpWanted, RecommendedInitiative, RecommendedHelpWanted } from '../types';
import { CreateInitiativeData } from './api';

/**
 * Free AI Service - Provides intelligent recommendations without requiring API keys
 * This service uses rule-based logic and pattern matching to provide smart recommendations
 */

// Helper function to calculate skill similarity
const calculateSkillSimilarity = (userSkills: string[], neededSkills: string[]): number => {
    if (!userSkills.length || !neededSkills.length) return 0;
    
    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const neededSkillsLower = neededSkills.map(s => s.toLowerCase());
    
    const matches = neededSkillsLower.filter(skill => 
        userSkillsLower.some(userSkill => 
            userSkill.includes(skill) || skill.includes(userSkill)
        )
    );
    
    return matches.length / neededSkills.length;
};

// Helper function to extract keywords from text
const extractKeywords = (text: string): string[] => {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now'];
    
    return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !commonWords.includes(word))
        .slice(0, 10); // Limit to 10 keywords
};

// Helper function to generate reasoning
const generateReasoning = (userSkills: string[], neededSkills: string[], type: 'initiative' | 'helpWanted'): string => {
    const similarity = calculateSkillSimilarity(userSkills, neededSkills);
    const matchingSkills = neededSkills.filter(skill => 
        userSkills.some(userSkill => 
            userSkill.toLowerCase().includes(skill.toLowerCase()) || 
            skill.toLowerCase().includes(userSkill.toLowerCase())
        )
    );
    
    if (similarity >= 0.8) {
        return `Perfect match! Your expertise in ${matchingSkills.join(', ')} makes you an ideal candidate for this ${type}.`;
    } else if (similarity >= 0.5) {
        return `Great potential! Your skills in ${matchingSkills.join(', ')} align well with this ${type}'s requirements.`;
    } else if (similarity >= 0.3) {
        return `Interesting opportunity! While not a perfect match, your background in ${matchingSkills.join(', ')} could bring valuable perspective.`;
    } else {
        return `This ${type} could be a learning opportunity to expand your skills beyond your current expertise.`;
    }
};

/**
 * Recommends initiatives for a user based on their skills.
 */
export const getRecommendedInitiatives = async (user: User, initiatives: Initiative[]): Promise<RecommendedInitiative[]> => {
    if (!user.skills || user.skills.length === 0) return [];

    const activeInitiatives = initiatives.filter(i => i.status === 'Searching Talent');
    if (activeInitiatives.length === 0) return [];

    const recommendations = activeInitiatives
        .map(initiative => ({
            initiative,
            similarity: calculateSkillSimilarity(user.skills, initiative.skillsNeeded)
        }))
        .filter(item => item.similarity > 0.2) // Only include initiatives with at least 20% skill match
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3) // Top 3 recommendations
        .map(item => ({
            initiativeId: item.initiative.id,
            reasoning: generateReasoning(user.skills, item.initiative.skillsNeeded, 'initiative')
        }));

    return recommendations;
};

/**
 * Recommends Help Wanted posts for a user based on their skills.
 */
export const getRecommendedHelpWantedPosts = async (user: User, helpWantedPosts: HelpWanted[], initiatives: Initiative[]): Promise<RecommendedHelpWanted[]> => {
    if (!user.skills || user.skills.length === 0) return [];

    const openPosts = helpWantedPosts.filter(p => p.status === 'Open');
    if (openPosts.length === 0) return [];

    const initiativeMap = new Map(initiatives.map(i => [i.id, i]));

    const recommendations = openPosts
        .map(post => {
            const initiative = initiativeMap.get(post.initiativeId);
            const neededSkills = initiative ? initiative.skillsNeeded : [post.skill];
            return {
                post,
                similarity: calculateSkillSimilarity(user.skills, neededSkills)
            };
        })
        .filter(item => item.similarity > 0.2)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
        .map(item => ({
            helpWantedId: item.post.id,
            reasoning: generateReasoning(user.skills, [item.post.skill], 'helpWanted')
        }));

    return recommendations;
};

/**
 * Analyzes the user's search query to determine intent and extract keywords.
 */
export const analyzeSearchQuery = async (query: string): Promise<{ intent: 'build' | 'join' | 'general', keywords: string[] }> => {
    const keywords = extractKeywords(query);
    
    // Simple intent detection based on keywords
    const buildKeywords = ['build', 'create', 'make', 'develop', 'design', 'start', 'new', 'idea', 'project'];
    const joinKeywords = ['join', 'help', 'contribute', 'participate', 'collaborate', 'work on', 'looking for', 'find'];
    
    const queryLower = query.toLowerCase();
    const buildScore = buildKeywords.filter(keyword => queryLower.includes(keyword)).length;
    const joinScore = joinKeywords.filter(keyword => queryLower.includes(keyword)).length;
    
    let intent: 'build' | 'join' | 'general' = 'general';
    if (buildScore > joinScore && buildScore > 0) {
        intent = 'build';
    } else if (joinScore > buildScore && joinScore > 0) {
        intent = 'join';
    }
    
    return { intent, keywords };
};

/**
 * Finds existing initiatives that are semantically similar to a user's idea.
 */
export const findSimilarInitiatives = async (query: string, initiatives: Initiative[]): Promise<RecommendedInitiative[]> => {
    const queryKeywords = extractKeywords(query);
    
    const similarInitiatives = initiatives
        .map(initiative => {
            const initiativeText = `${initiative.title} ${initiative.description} ${initiative.tags.join(' ')}`.toLowerCase();
            const initiativeKeywords = extractKeywords(initiativeText);
            
            // Calculate similarity based on keyword overlap
            const commonKeywords = queryKeywords.filter(keyword => 
                initiativeKeywords.some(initKeyword => 
                    initKeyword.includes(keyword) || keyword.includes(initKeyword)
                )
            );
            
            return {
                initiative,
                similarity: commonKeywords.length / Math.max(queryKeywords.length, 1)
            };
        })
        .filter(item => item.similarity > 0.1)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
        .map(item => ({
            initiativeId: item.initiative.id,
            reasoning: `This initiative shares similar themes: ${extractKeywords(item.initiative.title).slice(0, 3).join(', ')}`
        }));

    return similarInitiatives;
};

/**
 * Finds relevant Help Wanted posts and open Initiatives for a user looking to join a project.
 */
export const findMatchingOpportunities = async (keywords: string[], initiatives: Initiative[], helpWantedPosts: HelpWanted[]): Promise<{ initiatives: RecommendedInitiative[], helpWanted: RecommendedHelpWanted[] }> => {
    if (keywords.length === 0) return { initiatives: [], helpWanted: [] };

    const openHelpWanted = helpWantedPosts.filter(p => p.status === 'Open');
    const searchingInitiatives = initiatives.filter(i => i.status === 'Searching Talent');

    // Find matching initiatives
    const matchingInitiatives = searchingInitiatives
        .map(initiative => {
            const initiativeText = `${initiative.title} ${initiative.description} ${initiative.skillsNeeded.join(' ')}`.toLowerCase();
            const initiativeKeywords = extractKeywords(initiativeText);
            
            const commonKeywords = keywords.filter(keyword => 
                initiativeKeywords.some(initKeyword => 
                    initKeyword.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(initKeyword)
                )
            );
            
            return {
                initiative,
                similarity: commonKeywords.length / Math.max(keywords.length, 1)
            };
        })
        .filter(item => item.similarity > 0.1)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 2)
        .map(item => ({
            initiativeId: item.initiative.id,
            reasoning: `This initiative matches your interests in: ${keywords.slice(0, 3).join(', ')}`
        }));

    // Find matching help wanted posts
    const matchingHelpWanted = openHelpWanted
        .map(post => {
            const skillMatch = keywords.some(keyword => 
                post.skill.toLowerCase().includes(keyword.toLowerCase()) || 
                keyword.toLowerCase().includes(post.skill.toLowerCase())
            );
            
            return {
                post,
                similarity: skillMatch ? 1 : 0
            };
        })
        .filter(item => item.similarity > 0)
        .slice(0, 2)
        .map(item => ({
            helpWantedId: item.post.id,
            reasoning: `This role requires ${item.post.skill}, which matches your interests`
        }));

    return { 
        initiatives: matchingInitiatives, 
        helpWanted: matchingHelpWanted 
    };
};

/**
 * Extracts key details from a user's query to pre-fill a new initiative form.
 */
export const extractInitiativeDetailsFromQuery = async (query: string): Promise<Partial<CreateInitiativeData>> => {
    const keywords = extractKeywords(query);
    
    // Common tech skills and tags
    const techSkills = ['react', 'javascript', 'typescript', 'python', 'java', 'node', 'vue', 'angular', 'sql', 'mongodb', 'aws', 'docker', 'kubernetes', 'ai', 'ml', 'data', 'analytics', 'design', 'ui', 'ux', 'mobile', 'ios', 'android', 'web', 'backend', 'frontend', 'fullstack'];
    const commonTags = ['AI/ML', 'Frontend', 'Backend', 'Mobile', 'Data', 'Analytics', 'Design', 'DevOps', 'Security', 'Testing', 'Documentation', 'Research'];
    
    const foundSkills = keywords.filter(keyword => 
        techSkills.some(skill => skill.includes(keyword) || keyword.includes(skill))
    );
    
    const foundTags = keywords.filter(keyword => 
        commonTags.some(tag => tag.toLowerCase().includes(keyword) || keyword.includes(tag.toLowerCase()))
    );
    
    // Generate title (first few words of query, cleaned up)
    const title = query.split(' ').slice(0, 6).join(' ').replace(/[^\w\s]/g, '').trim();
    
    return {
        title: title || 'New Initiative',
        description: query.length > 100 ? query.substring(0, 200) + '...' : query,
        skillsNeeded: foundSkills.length > 0 ? foundSkills : ['General Skills'],
        tags: foundTags.length > 0 ? foundTags : ['General']
    };
};

/**
 * Generates a summary of search results based on the user's intent.
 */
export const summarizeSearchResults = async (query: string, results: Initiative[], intent: 'build' | 'join' | 'general'): Promise<string> => {
    if (results.length === 0) return "No matching initiatives found for your search.";
    
    const intentMessages = {
        build: `We found ${results.length} existing initiatives that are similar to your idea. These could serve as inspiration or you might want to collaborate with their teams.`,
        join: `Here are ${results.length} initiatives that match your interests and are looking for contributors like you.`,
        general: `We found ${results.length} initiatives related to your search. These cover various aspects of your topic.`
    };
    
    const commonThemes = results
        .flatMap(r => [...r.tags, ...r.skillsNeeded])
        .filter((value, index, self) => self.indexOf(value) === index)
        .slice(0, 3);
    
    const themeText = commonThemes.length > 0 ? ` Common themes include: ${commonThemes.join(', ')}.` : '';
    
    return intentMessages[intent] + themeText;
};

/**
 * Generates high-level insights for the manager dashboard.
 */
export const getDashboardInsights = async (kpiData: any, utilizationData: any[]): Promise<string> => {
    const totalUtilization = utilizationData.reduce((sum, u) => sum + u.percentage, 0) / utilizationData.length;
    const overUtilized = utilizationData.filter(u => u.percentage > 90).length;
    const underUtilized = utilizationData.filter(u => u.percentage < 50).length;
    
    let insight = `The team has ${kpiData.active} active initiatives with ${kpiData.completedQ2} completed this quarter. `;
    
    if (totalUtilization > 85) {
        insight += `Overall utilization is high at ${Math.round(totalUtilization)}%, which may indicate capacity constraints. `;
    } else if (totalUtilization < 60) {
        insight += `Overall utilization is moderate at ${Math.round(totalUtilization)}%, suggesting room for additional initiatives. `;
    } else {
        insight += `Team utilization is well-balanced at ${Math.round(totalUtilization)}%. `;
    }
    
    if (overUtilized > 0) {
        insight += `Consider redistributing workload as ${overUtilized} team member(s) are over-utilized.`;
    } else if (underUtilized > 0) {
        insight += `There are opportunities to engage ${underUtilized} under-utilized team member(s) in new initiatives.`;
    }
    
    return insight;
};

