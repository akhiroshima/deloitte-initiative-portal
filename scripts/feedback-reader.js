#!/usr/bin/env node

/**
 * Feedback Reader Script
 * 
 * This script helps Cursor read and process feedback data from the development server.
 * It can generate markdown reports and provide structured data for todo list creation.
 */

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

async function readFeedbackData(): Promise<FeedbackStorage | null> {
  try {
    const data = await fs.readFile(FEEDBACK_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading feedback data:', error);
    return null;
  }
}

function generateMarkdownReport(storage: FeedbackStorage): string {
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
}

function generateTodoSuggestions(feedbacks: FeedbackData[]): string[] {
  const todos: string[] = [];
  
  feedbacks.forEach((feedback, index) => {
    const feedbackNumber = feedbacks.length - index;
    const date = new Date(feedback.timestamp).toLocaleDateString();
    
    // Extract potential issues from the message
    const message = feedback.message.toLowerCase();
    
    if (message.includes('error') || message.includes('bug') || message.includes('issue')) {
      todos.push(`Fix issue reported in feedback #${feedbackNumber} (${date}): ${feedback.message.substring(0, 100)}...`);
    }
    
    if (message.includes('feature') || message.includes('request') || message.includes('suggestion')) {
      todos.push(`Consider feature request from feedback #${feedbackNumber} (${date}): ${feedback.message.substring(0, 100)}...`);
    }
    
    if (message.includes('ui') || message.includes('design') || message.includes('layout')) {
      todos.push(`Review UI/design feedback #${feedbackNumber} (${date}): ${feedback.message.substring(0, 100)}...`);
    }
    
    if (message.includes('performance') || message.includes('slow') || message.includes('loading')) {
      todos.push(`Investigate performance issue from feedback #${feedbackNumber} (${date}): ${feedback.message.substring(0, 100)}...`);
    }
  });
  
  return todos;
}

async function main() {
  const command = process.argv[2] || 'report';
  
  const storage = await readFeedbackData();
  
  if (!storage) {
    console.log('No feedback data found.');
    return;
  }
  
  switch (command) {
    case 'report':
      console.log(generateMarkdownReport(storage));
      break;
      
    case 'json':
      console.log(JSON.stringify(storage, null, 2));
      break;
      
    case 'todos':
      const todos = generateTodoSuggestions(storage.feedbacks);
      if (todos.length === 0) {
        console.log('No actionable todos found in feedback.');
      } else {
        console.log('# Suggested TODOs from Feedback\n');
        todos.forEach((todo, index) => {
          console.log(`${index + 1}. ${todo}`);
        });
      }
      break;
      
    case 'count':
      console.log(`Total feedbacks: ${storage.feedbacks.length}`);
      break;
      
    default:
      console.log('Usage: node feedback-reader.js [report|json|todos|count]');
      console.log('  report - Generate markdown report (default)');
      console.log('  json   - Output raw JSON data');
      console.log('  todos  - Generate suggested TODOs');
      console.log('  count  - Show feedback count');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { readFeedbackData, generateMarkdownReport, generateTodoSuggestions };
