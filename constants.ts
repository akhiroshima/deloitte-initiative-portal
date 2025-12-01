import { User, Initiative, HelpWanted, JoinRequest, JoinRequestStatus, Task, TaskStatus } from './types';

export const CURRENT_USER_ID = 'user-1';

// Dev mode detection
export const IS_DEV_MODE = process.env.NODE_ENV === 'development' || 
  process.env.NETLIFY_DEV === 'true' || 
  window.location.hostname.includes('deloitte-portal-dev');

export const AVAILABLE_LOCATIONS = [
  'Bangalore',
  'Chennai',
  'Delhi',
  'Hyderabad',
  'Kolkata',
  'Mumbai',
  'Pune',
  'Remote',
].sort();


export const USERS: User[] = [
  {
    id: 'user-1',
    name: 'Ananth Iyer',
    email: 'ananth.iyer@deloitte.com',
    role: 'Developer',
    skills: ['React', 'TypeScript', 'Node.js', 'UI/UX Design'],
    location: 'Chennai',
    weeklyCapacityHrs: 20,
    avatarUrl: 'https://i.pravatar.cc/100?u=user-1',
  },
  {
    id: 'user-2',
    name: 'Bhavana Rao',
    email: 'bhavana.rao@deloitte.com',
    role: 'Lead',
    skills: ['Project Management', 'Agile', 'Python', 'Data Science'],
    location: 'Bangalore',
    weeklyCapacityHrs: 40,
    avatarUrl: 'https://i.pravatar.cc/100?u=user-2',
  },
  {
    id: 'user-3',
    name: 'Chetan Kumar',
    email: 'chetan.kumar@deloitte.com',
    role: 'Designer',
    skills: ['Figma', 'User Research', 'Prototyping'],
    location: 'Hyderabad',
    weeklyCapacityHrs: 30,
    avatarUrl: 'https://i.pravatar.cc/100?u=user-3',
  },
    {
    id: 'user-4',
    name: 'Divya Menon',
    email: 'divya.menon@deloitte.com',
    role: 'Manager',
    skills: ['Leadership', 'Strategy'],
    location: 'Pune',
    weeklyCapacityHrs: 40,
    avatarUrl: 'https://i.pravatar.cc/100?u=user-4',
  },
  {
    id: 'user-5',
    name: 'Eshwar Pillai',
    email: 'eshwar.pillai@deloitte.com',
    role: 'Developer',
    skills: ['Java', 'Spring Boot', 'AWS'],
    location: 'Chennai',
    weeklyCapacityHrs: 40,
    avatarUrl: 'https://i.pravatar.cc/100?u=user-5',
  },
  {
    id: 'user-6',
    name: 'Gayathri Nair',
    email: 'gayathri.nair@deloitte.com',
    role: 'Designer',
    skills: ['Illustration', 'Animation', 'Adobe CC'],
    location: 'Bangalore',
    weeklyCapacityHrs: 25,
    avatarUrl: 'https://i.pravatar.cc/100?u=user-6',
  },
  {
    id: 'user-7',
    name: 'Hari Prasad',
    email: 'hari.prasad@deloitte.com',
    role: 'Developer',
    skills: ['Angular', 'NgRx', 'Firebase'],
    location: 'Hyderabad',
    weeklyCapacityHrs: 40,
    avatarUrl: 'https://i.pravatar.cc/100?u=user-7',
  },
  {
    id: 'user-8',
    name: 'Indira Varma',
    email: 'indira.varma@deloitte.com',
    role: 'Lead',
    skills: ['Scrum Master', 'CI/CD', 'DevOps'],
    location: 'Pune',
    weeklyCapacityHrs: 40,
    avatarUrl: 'https://i.pravatar.cc/100?u=user-8',
  },
  {
    id: 'user-9',
    name: 'Jayesh Krishnan',
    email: 'jayesh.krishnan@deloitte.com',
    role: 'Designer',
    skills: ['UX Writing', 'Interaction Design', 'Webflow'],
    location: 'Remote',
    weeklyCapacityHrs: 20,
    avatarUrl: 'https://i.pravatar.cc/100?u=user-9',
  },
  {
    id: 'user-10',
    name: 'Kavya Reddy',
    email: 'kavya.reddy@deloitte.com',
    role: 'Developer',
    skills: ['Vue.js', 'GraphQL', 'Testing'],
    location: 'Hyderabad',
    weeklyCapacityHrs: 35,
    avatarUrl: 'https://i.pravatar.cc/100?u=user-10',
  },
  {
    id: 'user-11',
    name: 'Lakshman Murthy',
    email: 'lakshman.murthy@deloitte.com',
    role: 'Manager',
    skills: ['Client Relations', 'Budgeting', 'Risk Management'],
    location: 'Mumbai',
    weeklyCapacityHrs: 40,
    avatarUrl: 'https://i.pravatar.cc/100?u=user-11',
  },
  {
    id: 'user-12',
    name: 'Meera Sundaram',
    email: 'meera.sundaram@deloitte.com',
    role: 'Designer',
    skills: ['Design Systems', 'Accessibility', 'Figma'],
    location: 'Bangalore',
    weeklyCapacityHrs: 30,
    avatarUrl: 'https://i.pravatar.cc/100?u=user-12',
  },
  {
    id: 'user-13',
    name: 'Naveen Gopal',
    email: 'naveen.gopal@deloitte.com',
    role: 'Developer',
    skills: ['Python', 'Django', 'PostgreSQL'],
    location: 'Chennai',
    weeklyCapacityHrs: 40,
    avatarUrl: 'https://i.pravatar.cc/100?u=user-13',
  },
  {
    id: 'user-14',
    name: 'Priya Desai',
    email: 'priya.desai@deloitte.com',
    role: 'Lead',
    skills: ['Product Ownership', 'User Story Mapping', 'Jira'],
    location: 'Pune',
    weeklyCapacityHrs: 40,
    avatarUrl: 'https://i.pravatar.cc/100?u=user-14',
  },
];

export const INITIATIVES: Initiative[] = [
  {
    id: 'init-1',
    title: 'Project Phoenix: Design System Overhaul',
    description: 'Revamping the core design system for enhanced scalability and accessibility.',
    ownerId: 'user-2',
    teamMembers: [
      { userId: 'user-2', committedHours: 10 }, 
      { userId: 'user-3', committedHours: 15 },
      { userId: 'user-12', committedHours: 20 }
    ],
    status: 'In Progress',
    startDate: '2024-06-01',
    skillsNeeded: ['React', 'UI/UX Design', 'Figma', 'Accessibility'],
    locations: ['Pune', 'Remote'],
    tags: ['Design System', 'Frontend'],
    coverImageUrl: 'https://picsum.photos/seed/init-1/1600/900',
  },
  {
    id: 'init-2',
    title: 'AI-Powered Analytics Dashboard',
    description: 'Developing a new dashboard to provide real-time business intelligence using AI.',
    ownerId: 'user-2',
    teamMembers: [
      { userId: 'user-2', committedHours: 8 },
      { userId: 'user-1', committedHours: 10 },
      { userId: 'user-13', committedHours: 15 }
    ],
    status: 'In Progress',
    startDate: '2024-07-15',
    skillsNeeded: ['Python', 'Data Science', 'React', 'D3.js'],
    locations: ['Hyderabad', 'Bangalore'],
    tags: ['AI/ML', 'Data Viz'],
    coverImageUrl: 'https://picsum.photos/seed/init-2/1600/900',
  },
  {
    id: 'init-3',
    title: 'Internal Hackathon 2024 Platform',
    description: 'Building the submission and judging portal for the upcoming global hackathon.',
    ownerId: 'user-8',
    teamMembers: [
      { userId: 'user-8', committedHours: 10 }, 
    ],
    status: 'Searching Talent',
    startDate: '2024-08-01',
    skillsNeeded: ['Node.js', 'React', 'GraphQL', 'Project Management'],
    locations: ['Remote'],
    tags: ['Community', 'Innovation'],
    coverImageUrl: 'https://picsum.photos/seed/init-3/1600/900',
  },
  {
    id: 'init-4',
    title: 'Mobile App for Field Agents',
    description: 'A new cross-platform mobile app for agents to manage cases on the go.',
    ownerId: 'user-14',
    teamMembers: [
      { userId: 'user-14', committedHours: 10 },
      { userId: 'user-5', committedHours: 20 }
    ],
    status: 'Under Review',
    startDate: '2024-05-10',
    skillsNeeded: ['React Native', 'TypeScript', 'User Research'],
    locations: ['Mumbai'],
    tags: ['Mobile', 'Client-Facing'],
    coverImageUrl: 'https://picsum.photos/seed/init-4/1600/900',
  },
  {
    id: 'init-5',
    title: 'Client Onboarding Automation',
    description: 'Streamlining the new client onboarding process through automated workflows.',
    ownerId: 'user-4',
    teamMembers: [
      { userId: 'user-4', committedHours: 5 },
      { userId: 'user-11', committedHours: 5 }
    ],
    status: 'Completed',
    startDate: '2024-01-01',
    endDate: '2024-05-30',
    skillsNeeded: ['Salesforce', 'Python', 'Process Automation'],
    locations: ['Delhi'],
    tags: ['Operations', 'Efficiency'],
    coverImageUrl: 'https://picsum.photos/seed/init-5/1600/900',
  },
  {
    id: 'init-6',
    title: 'Green Horizons: Sustainability Reporting Tool',
    description: 'A tool to help clients track and report on their sustainability initiatives and carbon footprint.',
    ownerId: 'user-8',
    teamMembers: [
      { userId: 'user-8', committedHours: 15 },
      { userId: 'user-9', committedHours: 10 }
    ],
    status: 'Searching Talent',
    startDate: '2024-09-01',
    skillsNeeded: ['Django', 'Vue.js', 'Data Viz', 'Sustainability'],
    locations: ['Remote', 'Pune'],
    tags: ['Sustainability', 'Reporting', 'Green Tech'],
    coverImageUrl: 'https://picsum.photos/seed/init-6/1600/900',
  },
  {
    id: 'init-7',
    title: 'Project Fusion: API Gateway Migration',
    description: 'Migrating legacy APIs to a modern, scalable API gateway solution for improved performance and security.',
    ownerId: 'user-2',
    teamMembers: [
      { userId: 'user-2', committedHours: 5 }, 
      { userId: 'user-5', committedHours: 10 },
      { userId: 'user-7', committedHours: 10 }
    ],
    status: 'In Progress',
    startDate: '2024-07-20',
    skillsNeeded: ['AWS', 'Node.js', 'DevOps', 'API Design'],
    locations: ['Chennai', 'Bangalore'],
    tags: ['Infrastructure', 'API', 'Backend'],
    coverImageUrl: 'https://picsum.photos/seed/init-7/1600/900',
  },
];

export const TASKS: Task[] = [
    {
        id: 'task-1',
        initiativeId: 'init-1',
        title: 'Create component library in Figma',
        description: 'Design all base components, variants, and states according to the new brand guidelines.',
        status: TaskStatus.Done,
        assigneeId: 'user-3'
    },
    {
        id: 'task-2',
        initiativeId: 'init-1',
        title: 'Develop Button component in React',
        description: 'Build the React component for buttons, including all variants and states from Figma.',
        status: TaskStatus.InProgress,
        assigneeId: 'user-12'
    },
    {
        id: 'task-3',
        initiativeId: 'init-1',
        title: 'Setup Storybook for component documentation',
        description: 'Install and configure Storybook to host interactive component documentation.',
        status: TaskStatus.Todo,
        assigneeId: 'user-2'
    },
    {
        id: 'task-4',
        initiativeId: 'init-2',
        title: 'Data ingestion pipeline for BI tool',
        description: 'Connect to the primary data warehouse and create a pipeline to feed data into the new dashboard.',
        status: TaskStatus.InProgress,
        assigneeId: 'user-13'
    },
    {
        id: 'task-5',
        initiativeId: 'init-2',
        title: 'Initial wireframes for dashboard layout',
        description: 'Create low-fidelity wireframes for the main dashboard views.',
        status: TaskStatus.Todo
    },
     {
        id: 'task-6',
        initiativeId: 'init-1',
        title: 'Conduct accessibility audit on new components',
        description: 'Test all new components against WCAG 2.1 AA standards and document findings.',
        status: TaskStatus.Todo,
        assigneeId: 'user-12'
    },
    {
        id: 'task-7',
        initiativeId: 'init-7',
        title: 'Document existing legacy API endpoints',
        description: 'Go through the old service and document all public endpoints, their parameters, and expected responses.',
        status: TaskStatus.Done,
        assigneeId: 'user-5'
    },
    {
        id: 'task-8',
        initiativeId: 'init-7',
        title: 'Configure new API Gateway instance',
        description: 'Set up the basic configuration for the new API gateway in the staging AWS environment.',
        status: TaskStatus.InProgress,
        assigneeId: 'user-7'
    }
];


export const HELP_WANTED_POSTS: HelpWanted[] = [
    {
        id: 'hw-1',
        initiativeId: 'init-2',
        skill: 'D3.js',
        hoursPerWeek: 8,
        status: 'Open',
    },
    {
        id: 'hw-2',
        initiativeId: 'init-4',
        skill: 'React Native',
        hoursPerWeek: 10,
        status: 'Open',
    },
    {
        id: 'hw-3',
        initiativeId: 'init-3',
        skill: 'GraphQL',
        hoursPerWeek: 12,
        status: 'Open',
    },
    {
        id: 'hw-4',
        initiativeId: 'init-6',
        skill: 'Sustainability',
        hoursPerWeek: 6,
        status: 'Open',
    }
];

export const JOIN_REQUESTS: JoinRequest[] = [
  {
    id: 'req-1',
    initiativeId: 'init-1',
    userId: 'user-1',
    message: "I'm not on the team yet but I have extensive experience with Design Systems and Figma. I think I could be a great asset to Project Phoenix.",
    status: JoinRequestStatus.Pending,
    createdAt: '2024-07-28T10:00:00Z',
    committedHours: 10,
  },
  {
    id: 'req-2',
    initiativeId: 'init-3',
    userId: 'user-10',
    message: "I'm a React developer with some experience in GraphQL. I'd love to contribute to the Hackathon platform and sharpen my skills.",
    status: JoinRequestStatus.Approved,
    createdAt: '2024-07-27T14:00:00Z',
    committedHours: 8,
  },
  {
    id: 'req-3',
    initiativeId: 'init-3',
    userId: 'user-9',
    message: "I'm not a developer, but I can help with the UX writing and content strategy for the platform to make it super clear and easy to use.",
    status: JoinRequestStatus.Rejected,
    createdAt: '2024-07-26T11:00:00Z',
    committedHours: 5,
  },
  {
    id: 'req-4',
    initiativeId: 'init-7',
    userId: 'user-1',
    message: "Invited by project owner.",
    status: JoinRequestStatus.Invited,
    createdAt: '2024-07-29T09:00:00Z',
  },
];