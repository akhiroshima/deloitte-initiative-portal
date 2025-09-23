import React from 'react';
import { Card } from './ui/Card';
import { typography } from '../tokens/typography';

const DocsPage: React.FC = () => {
    
    const PlaceholderImage: React.FC<{text: string}> = ({ text }) => {
        const url = `https://placehold.co/800x450/e2e8f0/64748b?text=${encodeURIComponent(text)}`;
        return (
            <div className="my-6">
                <img 
                    src={url} 
                    alt={text} 
                    className="rounded-lg shadow-md border border-border w-full object-contain"
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <p className={`${typography.pageDescription}`}>Your guide to discovering, managing, and succeeding with internal projects.</p>
            </div>

            <Card className="p-6">
<h2 className={`${typography.h2} text-foreground mb-3`}>1. Getting Started</h2>
                <p className="mb-4 text-muted-foreground">Welcome to the Initiative Portal! This platform is designed to help you connect with projects, contribute your skills, and see the impact of your work. Here’s a quick overview of what you can do:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>Discover</strong> initiatives on the Bulletin Board.</li>
                    <li><strong>Join</strong> projects that need your expertise.</li>
                    <li><strong>Create</strong> your own initiatives and recruit a team.</li>
                    <li><strong>Manage</strong> project tasks on a Kanban board.</li>
                    <li><strong>Track</strong> your contributions on your personal "My Initiatives" page.</li>
                    <li><strong>Analyze</strong> overall project health on the Dashboard (for Leads & Managers).</li>
                </ul>
            </Card>

            <Card className="p-6">
<h2 className={`${typography.h2} text-foreground mb-3`}>2. The Bulletin Board</h2>
                <p className="mb-4 text-muted-foreground">The Bulletin is your central hub for finding opportunities. It's designed to be powerful yet simple to use.</p>
                
<h3 className={`${typography.h3} text-foreground mt-5 mb-2`}>AI-Powered Search</h3>
                <p className="mb-4 text-muted-foreground">The most powerful feature of the Bulletin is the AI search bar. Simply type what you're thinking in natural language, and the system will understand your intent.</p>
                
                <PlaceholderImage text="Screenshot: AI Search Bar & Results" />

                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>If you want to join a project:</strong> Try searching for something like, <strong className="text-foreground">"I want to help on a project using Python and Data Science."</strong> The AI will find relevant "Help Wanted" posts and initiatives looking for those skills.</li>
                    <li><strong>If you want to build a new project:</strong> Describe your idea, like <strong className="text-foreground">"I have an idea for a mobile app that helps new hires onboard."</strong> The AI will first find similar existing projects to prevent duplication. If none exist, it will offer to pre-fill a new initiative form for you based on your idea!</li>
                </ul>

<h3 className={`${typography.h3} text-foreground mt-5 mb-2`}>Browsing & Filtering</h3>
                 <p className="text-muted-foreground">Below the search, you can browse all initiatives, which are organized into tabs by their status (e.g., 'Searching Talent', 'In Progress'). You can use the filter buttons to narrow down the list by location, skills, or tags.</p>
            </Card>

            <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">3. Initiative & User Pages</h2>
                <h3 className="text-base font-semibold text-foreground mt-5 mb-2">Initiative Detail Page</h3>
                 <p className="mb-4 text-muted-foreground">Clicking on any initiative card takes you to its detail page. Here you'll find:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>Overview:</strong> The full description, team members, skills needed, and other key details.</li>
                    <li><strong>Tasks Tab:</strong> A full Kanban board ("To Do", "In Progress", "Done") for managing the project's work. All team members can create tasks, and the owner can assign them. This tab is only visible to team members.</li>
                    <li><strong>Requests Tab:</strong> A list of all requests to join the initiative. The owner can approve or reject requests from here.</li>
                </ul>
                <PlaceholderImage text="Screenshot: Initiative Tasks Kanban Board" />

                <h3 className="text-base font-semibold text-foreground mt-5 mb-2">User Profile Page</h3>
                 <p className="mb-4 text-muted-foreground">Clicking on any user's name or avatar takes you to their profile. You can see their skills, capacity, and active projects. If you're viewing your own profile, an "Edit Profile" button will appear, allowing you to update your skills and location.</p>
                 <p className="text-muted-foreground">Profiles also feature an **Achievements** section, which automatically lists all the projects you've successfully completed.</p>
            </Card>

            <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">4. Personalization & Tracking</h2>
                <h3 className="text-base font-semibold text-foreground mt-5 mb-2">My Initiatives Page</h3>
                <p className="mb-4 text-muted-foreground">This page gives you a personalized view of your involvement. It has two sections:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>Your Active Initiatives:</strong> A list of all projects you are currently a member of.</li>
                    <li><strong>Your Applications:</strong> A list of all your pending, approved, or rejected requests to join other initiatives.</li>
                </ul>
                
                <h3 className="text-base font-semibold text-foreground mt-5 mb-2">Notifications</h3>
                <p className="text-muted-foreground">The bell icon in the header provides real-time alerts. You'll be notified for important events like when your join request is approved, when you're assigned a task, or when a new initiative matching your skills is created.</p>
            </Card>

             <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">5. For Leads & Managers</h2>
                <h3 className="text-base font-semibold text-foreground mt-5 mb-2">The Dashboard</h3>
                <p className="mb-4 text-muted-foreground">The Dashboard provides a high-level overview of all initiatives. It features:</p>
                <PlaceholderImage text="Screenshot: Manager Dashboard with KPIs" />
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>AI-Powered Summary:</strong> An intelligent, natural language summary of the key data points, highlighting successes and potential risks.</li>
                    <li><strong>KPI Cards:</strong> Key metrics like the number of active projects and average completion time.</li>
                    <li><strong>Utilization Chart:</strong> A bar chart showing team capacity versus assigned work hours for each location, making it easy to spot over- or under-utilized teams.</li>
                </ul>
            </Card>
            
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">6. Other Features</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                     <li><strong>Dark Mode:</strong> Use the sun/moon icon in the header to toggle between light and dark themes for comfortable viewing.</li>
                     <li><strong>Collapsible Sidebar:</strong> The sidebar can be "pinned" open for easy access or "unpinned" to collapse into an icon-only bar that expands on hover, maximizing your screen space.</li>
                </ul>
            </Card>
        </div>
    );
};

export default DocsPage;