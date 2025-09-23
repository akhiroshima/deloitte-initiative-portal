import { CreateInitiativeData } from './api';
import { extractInitiativeDetailsFromQuery } from './llmService';

/**
 * Document Parser Service - Extracts text from various document types
 * and uses AI to parse initiative data from the content
 */

// Supported file types
export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];

// File type extensions for display
export const FILE_TYPE_EXTENSIONS = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt',
  'text/csv': '.csv'
};

/**
 * Validates if a file type is supported
 */
export const isFileTypeSupported = (fileType: string): boolean => {
  return SUPPORTED_FILE_TYPES.includes(fileType);
};

/**
 * Gets file extension from MIME type
 */
export const getFileExtension = (fileType: string): string => {
  return FILE_TYPE_EXTENSIONS[fileType as keyof typeof FILE_TYPE_EXTENSIONS] || '';
};

/**
 * Extracts text content from a file
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        let extractedText = '';
        
        switch (file.type) {
          case 'text/plain':
          case 'text/csv':
            extractedText = content;
            break;
            
          case 'application/pdf':
            // For PDF, we'll use a simple approach - in a real app, you'd use a PDF parser library
            extractedText = await extractTextFromPDF(content);
            break;
            
          case 'application/msword':
          case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            // For Word documents, we'll use a simple approach
            extractedText = await extractTextFromWord(content);
            break;
            
          case 'application/vnd.ms-powerpoint':
          case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            // For PowerPoint, we'll use a simple approach
            extractedText = await extractTextFromPowerPoint(content);
            break;
            
          case 'application/vnd.ms-excel':
          case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            // For Excel, we'll use a simple approach
            extractedText = await extractTextFromExcel(content);
            break;
            
          default:
            throw new Error(`Unsupported file type: ${file.type}`);
        }
        
        resolve(extractedText);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    // Read as ArrayBuffer for binary files, as text for text files
    if (file.type.startsWith('text/')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

/**
 * Simple PDF text extraction (basic implementation)
 * In a production app, you'd use a library like pdf-parse or pdfjs-dist
 */
const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  // This is a simplified implementation
  // In reality, you'd need a proper PDF parser
  const uint8Array = new Uint8Array(arrayBuffer);
  const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(uint8Array);
  
  // Basic PDF text extraction - look for text between BT and ET markers
  const textMatches = text.match(/BT\s+([\s\S]*?)\s+ET/g);
  if (textMatches) {
    return textMatches
      .map(match => match.replace(/BT\s+/, '').replace(/\s+ET$/, ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Fallback: return raw text with some cleaning
  return text
    .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-printable characters
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Simple Word document text extraction
 * In a production app, you'd use a library like mammoth
 */
const extractTextFromWord = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  // This is a simplified implementation
  // In reality, you'd need a proper Word parser like mammoth
  const uint8Array = new Uint8Array(arrayBuffer);
  const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(uint8Array);
  
  // Basic Word document text extraction
  return text
    .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-printable characters
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Simple PowerPoint text extraction
 * In a production app, you'd use a library like pptx-parser
 */
const extractTextFromPowerPoint = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  // This is a simplified implementation
  // In reality, you'd need a proper PowerPoint parser
  const uint8Array = new Uint8Array(arrayBuffer);
  const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(uint8Array);
  
  // Basic PowerPoint text extraction
  return text
    .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-printable characters
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Simple Excel text extraction
 * In a production app, you'd use a library like xlsx
 */
const extractTextFromExcel = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  // This is a simplified implementation
  // In reality, you'd need a proper Excel parser
  const uint8Array = new Uint8Array(arrayBuffer);
  const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(uint8Array);
  
  // Basic Excel text extraction
  return text
    .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-printable characters
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * AI-powered document analysis to extract initiative data using LLM
 */
export const analyzeDocumentForInitiative = async (text: string): Promise<Partial<CreateInitiativeData>> => {
  if (!text.trim()) {
    return {};
  }

  try {
    // Use the LLM service for better extraction
    const initiativeData = await extractInitiativeDetailsFromQuery(text);
    return initiativeData;
  } catch (error) {
    console.error('Error using LLM for document analysis, falling back to pattern matching:', error);
    
    // Fallback to pattern matching if LLM fails
    return fallbackDocumentAnalysis(text);
  }
};

/**
 * Fallback document analysis using pattern matching
 */
const fallbackDocumentAnalysis = (text: string): Partial<CreateInitiativeData> => {
  // Extract title (look for common title patterns)
  const titlePatterns = [
    /(?:title|project|initiative|proposal)[\s:]*([^\n\r]{5,100})/i,
    /^([^\n\r]{10,100})$/m, // First line if it looks like a title
    /(?:#\s*)([^\n\r]{5,100})/i, // Markdown-style title
  ];
  
  let title = '';
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      title = match[1].trim();
      break;
    }
  }

  // Extract description (look for common description patterns)
  const descriptionPatterns = [
    /(?:description|overview|summary|abstract)[\s:]*([^\n\r]{20,500})/i,
    /(?:objective|goal|purpose)[\s:]*([^\n\r]{20,500})/i,
    /(?:background|context)[\s:]*([^\n\r]{20,500})/i,
  ];
  
  let description = '';
  for (const pattern of descriptionPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      description = match[1].trim();
      break;
    }
  }

  // If no specific description found, use first few sentences
  if (!description) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    description = sentences.slice(0, 3).join('. ').trim();
  }

  // Extract skills (look for common skill patterns)
  const skillPatterns = [
    /(?:skills?|technologies?|tools?|requirements?)[\s:]*([^\n\r]{10,200})/i,
    /(?:required|needed|looking for)[\s:]*([^\n\r]{10,200})/i,
  ];
  
  let skillsText = '';
  for (const pattern of skillPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      skillsText = match[1].trim();
      break;
    }
  }

  // Common tech skills to look for
  const commonSkills = [
    'React', 'JavaScript', 'TypeScript', 'Python', 'Java', 'Node.js', 'Vue', 'Angular',
    'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'AI', 'ML', 'Data Science',
    'Figma', 'Design', 'UI', 'UX', 'Mobile', 'iOS', 'Android', 'Web', 'Backend',
    'Frontend', 'Fullstack', 'DevOps', 'Security', 'Testing', 'Documentation'
  ];

  const foundSkills = commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );

  // Extract tags (look for common tag patterns)
  const tagPatterns = [
    /(?:tags?|categories?|topics?)[\s:]*([^\n\r]{10,200})/i,
    /(?:keywords?|labels?)[\s:]*([^\n\r]{10,200})/i,
  ];
  
  let tagsText = '';
  for (const pattern of tagPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      tagsText = match[1].trim();
      break;
    }
  }

  // Common tags to look for
  const commonTags = [
    'AI/ML', 'Frontend', 'Backend', 'Mobile', 'Data', 'Analytics', 'Design',
    'DevOps', 'Security', 'Testing', 'Documentation', 'Research', 'Innovation'
  ];

  const foundTags = commonTags.filter(tag => 
    text.toLowerCase().includes(tag.toLowerCase())
  );

  // Process skills and tags from text
  const skillsFromText = skillsText ? 
    skillsText.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0) : [];
  
  const tagsFromText = tagsText ? 
    tagsText.split(/[,;|]/).map(t => t.trim()).filter(t => t.length > 0) : [];

  return {
    title: title || 'Document-based Initiative',
    description: description || text.substring(0, 300) + '...',
    skillsNeeded: [...foundSkills, ...skillsFromText].slice(0, 10),
    tags: [...foundTags, ...tagsFromText].slice(0, 8)
  };
};

/**
 * Main function to process uploaded document and extract initiative data
 */
export const processDocumentForInitiative = async (file: File): Promise<Partial<CreateInitiativeData>> => {
  try {
    // Validate file type
    if (!isFileTypeSupported(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    // Extract text from document
    const text = await extractTextFromFile(file);
    
    if (!text.trim()) {
      throw new Error('No text content found in document');
    }

    // Analyze text for initiative data
    const initiativeData = await analyzeDocumentForInitiative(text);
    
    return initiativeData;
  } catch (error) {
    console.error('Error processing document:', error);
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
