import { Handler } from '@netlify/functions';
import { promises as fs } from 'fs';
import path from 'path';

interface FeedbackData {
  id: string;
  timestamp: string;
  message: string;
  screenshot: string | null;
  screenshotPath?: string | null;
  url: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
}

interface FeedbackStorage {
  feedbacks: FeedbackData[];
  lastUpdated: string;
}

const FEEDBACK_FILE_PATH = path.join(process.cwd(), 'feedback-data.json');

// Read existing feedback data
const readFeedbackData = async (): Promise<FeedbackStorage | null> => {
  try {
    const data = await fs.readFile(FEEDBACK_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading feedback data:', error);
    return null;
  }
};

// Generate markdown report for Cursor
const generateMarkdownReport = (storage: FeedbackStorage): string => {
  const { feedbacks, lastUpdated } = storage;
  
  let markdown = `# Development Feedback Report\n\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n`;
  markdown += `**Last Updated:** ${lastUpdated}\n`;
  markdown += `**Total Feedbacks:** ${feedbacks.length}\n\n`;
  
  if (feedbacks.length === 0) {
    markdown += `No feedback has been submitted yet.\n`;
    return markdown;
  }
  
  // Group feedbacks by date
  const feedbacksByDate = feedbacks.reduce((acc, feedback) => {
    const date = new Date(feedback.timestamp).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(feedback);
    return acc;
  }, {} as Record<string, FeedbackData[]>);
  
  // Sort dates (most recent first)
  const sortedDates = Object.keys(feedbacksByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  sortedDates.forEach(date => {
    markdown += `## ${date}\n\n`;
    
    feedbacksByDate[date].forEach((feedback, index) => {
      markdown += `### Feedback #${feedbacks.length - feedbacks.indexOf(feedback)}\n\n`;
      markdown += `**Time:** ${new Date(feedback.timestamp).toLocaleTimeString()}\n`;
      markdown += `**URL:** ${feedback.url}\n`;
      markdown += `**Viewport:** ${feedback.viewport.width} × ${feedback.viewport.height}\n`;
      markdown += `**User Agent:** ${feedback.userAgent}\n\n`;
      
      markdown += `**Message:**\n`;
      markdown += `\`\`\`\n${feedback.message}\n\`\`\`\n\n`;
      
      if (feedback.screenshotPath) {
        markdown += `**Screenshot:** Available at \`${feedback.screenshotPath}\`\n\n`;
      }
      
      markdown += `---\n\n`;
    });
  });
  
  return markdown;
};

export const handler: Handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  try {
    // Read feedback data
    const storage = await readFeedbackData();
    
    if (!storage) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No feedback data found' }),
      };
    }

    // Check if markdown format is requested
    const format = event.queryStringParameters?.format || 'json';
    
    if (format === 'markdown') {
      const markdown = generateMarkdownReport(storage);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/markdown',
          'Access-Control-Allow-Origin': '*',
        },
        body: markdown,
      };
    }

    // Return JSON format by default
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(storage, null, 2),
    };

  } catch (error) {
    console.error('Error retrieving feedback:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
