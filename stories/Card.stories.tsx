import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible card component with header, content, and footer sections.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content of the card.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const Simple: Story = {
  render: () => (
    <Card className="w-[350px] p-6">
      <p>A simple card with just content.</p>
    </Card>
  ),
};

export const WithoutFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Project Update</CardTitle>
        <CardDescription>Latest changes to the project.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>The project has been updated with new features including dark mode support and improved accessibility.</p>
      </CardContent>
    </Card>
  ),
};

export const InitiativeCard: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>AI-Powered Analytics Dashboard</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
            In Progress
          </span>
          <span className="text-muted-foreground">Started July 15, 2024</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Developing a new dashboard to provide real-time business intelligence using AI.</p>
        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">Python</span>
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">Data Science</span>
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">React</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">3 team members</div>
        <Button size="sm">View Details</Button>
      </CardFooter>
    </Card>
  ),
};
