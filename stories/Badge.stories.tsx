import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../components/ui/badge';
import Tag from '../components/ui/Tag';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A badge component for displaying status, tags, or labels.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const TagWrapper: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Tag>React</Tag>
      <Tag>TypeScript</Tag>
      <Tag>Node.js</Tag>
      <Tag variant="destructive">Urgent</Tag>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Our Tag component is a wrapper around Badge with sensible defaults.',
      },
    },
  },
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">In Progress</Badge>
      <Badge variant="secondary">Searching Talent</Badge>
      <Badge variant="outline">Under Review</Badge>
      <Badge variant="destructive">Blocked</Badge>
    </div>
  ),
};
