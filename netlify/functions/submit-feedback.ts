import { Handler } from '@netlify/functions';
import { promises as fs } from 'fs';
import path from 'path';

interface FeedbackData {
  id: string;
  timestamp: string;
  message: string;
  screenshot: string | null;
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

// Ensure feedback file exists
const ensureFeedbackFile = async (): Promise<void> => {
  try {
    await fs.access(FEEDBACK_FILE_PATH);
  } catch {
    // File doesn't exist, create it
    const initialData: FeedbackStorage = {
      feedbacks: [],
      lastUpdated: new Date().toISOString(),
    };
    await fs.writeFile(FEEDBACK_FILE_PATH, JSON.stringify(initialData, null, 2));
  }
};

// Read existing feedback data
const readFeedbackData = async (): Promise<FeedbackStorage> => {
  await ensureFeedbackFile();
  const data = await fs.readFile(FEEDBACK_FILE_PATH, 'utf-8');
  return JSON.parse(data);
};

// Write feedback data
const writeFeedbackData = async (data: FeedbackStorage): Promise<void> => {
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(FEEDBACK_FILE_PATH, JSON.stringify(data, null, 2));
};

// Save screenshot to file system
const saveScreenshot = async (screenshotData: string, feedbackId: string): Promise<string> => {
  const screenshotsDir = path.join(process.cwd(), 'feedback-screenshots');
  
  // Create screenshots directory if it doesn't exist
  try {
    await fs.mkdir(screenshotsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  const screenshotPath = path.join(screenshotsDir, `${feedbackId}.png`);
  
  // Remove data URL prefix and save as binary
  const base64Data = screenshotData.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  await fs.writeFile(screenshotPath, buffer);
  
  return screenshotPath;
};

export const handler: Handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    // Parse request body
    const feedbackData: FeedbackData = JSON.parse(event.body || '{}');
    
    // Validate required fields
    if (!feedbackData.id || !feedbackData.message || !feedbackData.timestamp) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Read existing feedback data
    const storage = await readFeedbackData();
    
    // Handle screenshot if present
    let screenshotPath: string | null = null;
    if (feedbackData.screenshot) {
      try {
        screenshotPath = await saveScreenshot(feedbackData.screenshot, feedbackData.id);
        console.log(`Screenshot saved to: ${screenshotPath}`);
      } catch (error) {
        console.error('Failed to save screenshot:', error);
        // Continue without screenshot rather than failing the entire request
      }
    }

    // Add screenshot path to feedback data
    const feedbackWithScreenshot = {
      ...feedbackData,
      screenshotPath,
    };

    // Add new feedback to storage
    storage.feedbacks.push(feedbackWithScreenshot);
    
    // Write updated data
    await writeFeedbackData(storage);

    console.log(`Feedback submitted: ${feedbackData.id}`);
    console.log(`Total feedbacks: ${storage.feedbacks.length}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Feedback submitted successfully',
        feedbackId: feedbackData.id,
        totalFeedbacks: storage.feedbacks.length,
      }),
    };

  } catch (error) {
    console.error('Error processing feedback:', error);
    
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
