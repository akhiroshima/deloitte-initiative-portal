import type { Meta, StoryObj } from '@storybook/react';
import { LoadingTransition, Skeleton } from '../components/ui/LoadingTransition';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

const meta = {
  title: 'UI/LoadingTransition',
  component: LoadingTransition,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['fade', 'slide', 'scale'],
    },
    delay: {
      control: { type: 'number', min: 0, max: 1000, step: 50 },
    },
  },
} satisfies Meta<typeof LoadingTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    delay: 300,
    variant: 'fade',
    children: (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Sample Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card appears with a loading transition.</p>
          <Button className="mt-4">Click me</Button>
        </CardContent>
      </Card>
    ),
  },
};

export const SlideVariant: Story = {
  args: {
    delay: 300,
    variant: 'slide',
    children: (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Slide Transition</h3>
        <p className="mt-2">Content slides in from the left.</p>
      </div>
    ),
  },
};

export const ScaleVariant: Story = {
  args: {
    delay: 300,
    variant: 'scale',
    children: (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Scale Transition</h3>
        <p className="mt-2">Content scales up from smaller size.</p>
      </div>
    ),
  },
};

// Skeleton Stories
const SkeletonMeta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export const SkeletonText: StoryObj<typeof Skeleton> = {
  args: {
    variant: 'text',
    className: 'w-48',
  },
};

export const SkeletonCard: StoryObj<typeof Skeleton> = {
  args: {
    variant: 'card',
    className: 'w-80',
  },
};

export const SkeletonButton: StoryObj<typeof Skeleton> = {
  args: {
    variant: 'button',
    className: 'w-24',
  },
};

export const SkeletonAvatar: StoryObj<typeof Skeleton> = {
  args: {
    variant: 'avatar',
  },
};
