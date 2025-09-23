# Design System and UI Architecture

This project implements a comprehensive design system built on **shadcn/ui** with **dark-first theming** and **Storybook documentation**.

## Core Philosophy

**shadcn/ui First**: All UI components are built using shadcn/ui primitives, providing:
- **Consistent API**: Unified component interfaces with variant-based styling
- **Accessibility**: Built on Radix UI primitives with WCAG 2.1 AA compliance
- **Customization**: CSS variables and CVA (Class Variance Authority) for flexible theming
- **Type Safety**: Full TypeScript support with proper prop interfaces

**Dark-First Design**: The application defaults to a sophisticated dark theme:
- **Primary Theme**: shadcn/ui default dark color scheme as the base
- **Light Mode**: Available as an alternative, but dark mode is the primary experience
- **Semantic Colors**: CSS variables for consistent color roles across components

## Architecture Layers

### 1. Foundation Layer (`index.css`)
```css
:root {
  /* Light mode variables */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}

.dark {
  /* Dark mode variables (primary) */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### 2. Primitive Components (`components/ui/`)
**shadcn/ui Components:**
- `button.tsx` - CVA-based button with multiple variants
- `card.tsx` - Flexible card with header/content/footer composition
- `dialog.tsx` - Modal dialogs built on Radix UI
- `badge.tsx` - Status and tag indicators
- `sonner.tsx` - Toast notifications
- `skeleton.tsx` - Loading states
- `dropdown-menu.tsx` - Context menus and dropdowns
- `select.tsx` - Form select components

**Custom Wrappers:**
- `Tag.tsx` - Badge wrapper with sensible defaults
- `Modal.tsx` - Dialog wrapper maintaining API compatibility
- `ToastProvider.tsx` - Sonner integration with custom theme

### 3. Typography System (`tokens/typography.ts`)
Maintained for consistency across complex components:
```typescript
export const typography = {
  h1: 'text-2xl font-bold',
  h2: 'text-lg font-semibold',
  h3: 'text-base font-semibold',
  body: 'text-sm',
  caption: 'text-xs',
} as const;
```

## Component Development Guidelines

### Creating New Components
1. **Start with shadcn/ui**: Use `npx shadcn@latest add [component]` when available
2. **Compose Primitives**: Build complex components by composing UI primitives
3. **Maintain Consistency**: Follow established patterns for props and styling
4. **Document in Storybook**: Create comprehensive stories for all components

### Example Component Structure
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const InitiativeCard = ({ initiative }) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle>{initiative.title}</CardTitle>
      <Badge variant="secondary">{initiative.status}</Badge>
    </CardHeader>
    <CardContent>
      <p>{initiative.description}</p>
      <Button>View Details</Button>
    </CardContent>
  </Card>
);
```

## Storybook Documentation

### Accessing Storybook
- **Development**: `npm run storybook` → http://localhost:6006
- **Stories Location**: `stories/*.stories.tsx`

### Story Structure
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from '../components/ui/component';

const meta = {
  title: 'UI/Component',
  component: Component,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Component description',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Example',
  },
};
```

### Theme Testing
- **Theme Toggle**: Available in Storybook toolbar
- **Dark/Light Preview**: All stories support theme switching
- **Background Control**: Automatic background adjustment

## Development Workflow

### Adding New UI Components
1. **Install shadcn component**: `npx shadcn@latest add [component-name]`
2. **Create wrapper** (if needed): Maintain existing API compatibility
3. **Update imports**: Convert existing components to use new primitives
4. **Create Storybook story**: Document all variants and use cases
5. **Test both themes**: Ensure proper appearance in light and dark modes

### Customizing Existing Components
1. **Modify CVA variants**: Add new variants to existing components
2. **Update CSS variables**: Adjust theme colors in `index.css`
3. **Document changes**: Update Storybook stories with new variants
4. **Maintain backwards compatibility**: Preserve existing component APIs

## Quality Assurance

### Visual Testing
- **Storybook**: Primary tool for component development and testing
- **Theme Consistency**: All components tested in both light and dark modes
- **Responsive Design**: Stories include responsive breakpoint testing

### Accessibility
- **Radix UI Foundation**: Built-in accessibility features
- **Focus Management**: Proper focus states and keyboard navigation
- **Screen Reader Support**: Semantic HTML and ARIA attributes
- **Color Contrast**: WCAG 2.1 AA compliant color schemes

## Migration Notes

This design system represents a migration from:
- **Custom CSS variables** → **shadcn/ui CSS variables**
- **Basic CVA implementation** → **Full shadcn/ui CVA patterns**
- **Manual theming** → **Automated dark/light theme system**
- **Ad-hoc documentation** → **Comprehensive Storybook documentation**

All existing functionality has been preserved while gaining:
- **Better accessibility**
- **Improved consistency**
- **Enhanced developer experience**
- **Comprehensive documentation**
