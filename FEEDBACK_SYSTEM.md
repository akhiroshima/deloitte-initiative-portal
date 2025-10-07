# Development Feedback System

This system provides a way for developers to report issues and provide feedback during development. It includes screenshot capture and stores data in a format that Cursor can easily read and process.

## Features

- **Floating Feedback Button**: Only visible in development environment
- **Screenshot Capture**: Automatically captures screenshots when submitting feedback
- **Structured Storage**: Stores feedback in JSON format with metadata
- **Cursor Integration**: Provides tools for Cursor to read and process feedback

## Components

### Frontend Components

- `FeedbackButton.tsx`: Floating button that appears in bottom-right corner
- `FeedbackModal.tsx`: Modal dialog for entering feedback and capturing screenshots

### Backend Functions

- `submit-feedback.ts`: Netlify function that handles feedback submission
- `get-feedback.ts`: Netlify function that retrieves feedback data

### Utilities

- `feedback-reader.js`: Script to read and process feedback data for Cursor

## Usage

### For Developers

1. The feedback button automatically appears in development mode
2. Click the button to open the feedback modal
3. Enter your feedback message
4. Optionally capture a screenshot manually (screenshot is automatically captured on submit)
5. Click "Submit Feedback" to save

### For Cursor

Use the feedback reader script to process feedback:

```bash
# Generate markdown report
node scripts/feedback-reader.js report

# Get raw JSON data
node scripts/feedback-reader.js json

# Generate suggested TODOs
node scripts/feedback-reader.js todos

# Get feedback count
node scripts/feedback-reader.js count
```

## Data Storage

Feedback is stored in:
- `feedback-data.json`: Main feedback data file
- `feedback-screenshots/`: Directory containing screenshot images

## Data Format

Each feedback entry includes:
- Unique ID
- Timestamp
- User message
- Screenshot (base64 encoded)
- URL where feedback was submitted
- User agent string
- Viewport dimensions

## Environment Detection

The feedback system only appears when:
- `NODE_ENV === 'development'` OR
- Hostname contains 'localhost'

This ensures the feedback system doesn't appear in production.

## Integration with Cursor

The system is designed to work seamlessly with Cursor:

1. Feedback is stored in structured JSON format
2. Screenshots are saved as separate files
3. The feedback reader script can generate markdown reports
4. Suggested TODOs can be automatically generated from feedback content

## Security Considerations

- Feedback is only stored locally in the development environment
- Screenshots may contain sensitive information - use responsibly
- The system is disabled in production builds
