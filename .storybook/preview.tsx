import type { Preview } from '@storybook/react-vite'
import React from 'react'
import '../index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'light',
          value: 'hsl(0 0% 100%)',
        },
        {
          name: 'dark',
          value: 'hsl(222.2 84% 4.9%)',
        },
      ],
    },
    a11y: {
      test: 'todo'
    }
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'light' },
          { value: 'dark', icon: 'circle', title: 'dark' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme;
      return (
        <div className={theme} data-theme={theme}>
          <div className="bg-background text-foreground min-h-screen p-4">
            <Story />
          </div>
        </div>
      );
    },
  ],
};

export default preview;