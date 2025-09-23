import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { typography } from '../tokens/typography';
import { ChevronDown, ChevronRight, Sparkles, Users, UserCircle, BarChart3, FileText, Search, Filter, Plus, Bell, Sun, Moon, ArrowLeft } from 'lucide-react';

const DocsPage: React.FC = () => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started', 'bulletin', 'navigation']));

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const FAQSection: React.FC<{id: string, title: string, children: React.ReactNode}> = ({ id, title, children }) => {
        const isExpanded = expandedSections.has(id);
        return (
            <Card className="p-6">
                <button
                    onClick={() => toggleSection(id)}
                    className="flex w-full items-center justify-between text-left"
                >
                    <h2 className={`${typography.h2} text-foreground`}>{title}</h2>
                    {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                </button>
                {isExpanded && (
                    <div className="mt-4 space-y-4">
                        {children}
            </div>
                )}
            </Card>
        );
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
                <h1 className={`${typography.h1} text-foreground`}>Documentation</h1>
                <p className={`${typography.pageDescription}`}>Quick reference guide for the Deloitte Initiative Portal</p>
            </div>

            <FAQSection id="getting-started" title="🚀 Getting Started">
                <div className="space-y-4">
                    <p className={`${typography.sectionDescription}`}>Welcome to the Deloitte Initiative Portal! This platform helps you discover, join, and manage internal projects.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h3 className={`${typography.h3} text-foreground`}>For Contributors</h3>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                <li>• Find projects matching your skills</li>
                                <li>• Join initiatives as a team member</li>
                                <li>• Track your contributions and achievements</li>
                                <li>• Manage your profile and availability</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h3 className={`${typography.h3} text-foreground`}>For Project Leads</h3>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                <li>• Create and manage initiatives</li>
                                <li>• Recruit team members</li>
                                <li>• Track project progress and health</li>
                                <li>• Analyze team utilization</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </FAQSection>

            <FAQSection id="navigation" title="🧭 Navigation & Interface">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Main Navigation</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-medium text-foreground">Bulletin</p>
                                    <p className="text-xs text-muted-foreground">Discover initiatives</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Users className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-medium text-foreground">Opportunities</p>
                                    <p className="text-xs text-muted-foreground">Find open roles</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <UserCircle className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-medium text-foreground">My Workspace</p>
                                    <p className="text-xs text-muted-foreground">Manage your profile</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-medium text-foreground">Dashboard</p>
                                    <p className="text-xs text-muted-foreground">Analytics & insights</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Header Features</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• <strong>Breadcrumbs:</strong> Shows your current location and allows quick navigation back</li>
                            <li>• <strong>Back Button:</strong> Appears when viewing specific initiatives or user profiles</li>
                            <li>• <strong>Notifications:</strong> <Bell className="inline h-4 w-4" /> Real-time alerts for important events</li>
                            <li>• <strong>Theme Toggle:</strong> <Sun className="inline h-4 w-4" /> <Moon className="inline h-4 w-4" /> Switch between light and dark modes</li>
                        </ul>
                    </div>
                </div>
            </FAQSection>

            <FAQSection id="bulletin" title="📋 Bulletin - Finding Initiatives">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>AI-Powered Search</h3>
                        <p className={`${typography.sectionDescription}`}>The most powerful feature - describe what you want to do in natural language.</p>
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-foreground mb-2">Example searches:</p>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                <li>• "I want to help with a Python data science project"</li>
                                <li>• "I have an idea for a mobile app for new hires"</li>
                                <li>• "Show me initiatives in New York using React"</li>
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Three Ways to Browse</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3 border border-border rounded-lg">
                                <h4 className="font-medium text-foreground mb-1">For You</h4>
                                <p className="text-xs text-muted-foreground">AI recommendations based on your profile and skills</p>
                            </div>
                            <div className="p-3 border border-border rounded-lg">
                                <h4 className="font-medium text-foreground mb-1">Browse All</h4>
                                <p className="text-xs text-muted-foreground">All initiatives with advanced filtering options</p>
                            </div>
                            <div className="p-3 border border-border rounded-lg">
                                <h4 className="font-medium text-foreground mb-1">My Initiatives</h4>
                                <p className="text-xs text-muted-foreground">Initiatives you own or are part of</p>
                            </div>
                        </div>
                    </div>
                </div>
            </FAQSection>

            <FAQSection id="opportunities" title="💼 Opportunities - Open Roles">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>AI Recommendations</h3>
                        <p className={`${typography.sectionDescription}`}>Get personalized role recommendations based on your skills and interests.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Help Wanted Posts</h3>
                        <p className={`${typography.sectionDescription}`}>Browse all open roles posted by initiative owners looking for specific skills.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>How to Apply</h3>
                        <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                            <li>Click on a role that interests you</li>
                            <li>Review the requirements and initiative details</li>
                            <li>Click "Request to Join" and write a message</li>
                            <li>Wait for the initiative owner to review your application</li>
                        </ol>
                    </div>
                </div>
            </FAQSection>

            <FAQSection id="workspace" title="👤 My Workspace - Your Personal Hub">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Profile Management</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• <strong>Edit Profile:</strong> Update your skills, location, and availability</li>
                            <li>• <strong>Skills:</strong> Add/remove skills to get better recommendations</li>
                            <li>• <strong>Capacity:</strong> Set your weekly availability in hours</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>My Tasks</h3>
                        <p className={`${typography.sectionDescription}`}>View and manage all tasks assigned to you across different initiatives.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Active Initiatives</h3>
                        <p className={`${typography.sectionDescription}`}>Initiatives you're currently part of, with quick access to tasks and team info.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Pending Items</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• <strong>Invitations:</strong> Project invitations waiting for your response</li>
                            <li>• <strong>Applications:</strong> Your requests to join initiatives</li>
                </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Achievements</h3>
                        <p className={`${typography.sectionDescription}`}>Track all completed initiatives and your contributions to the organization.</p>
                    </div>
                </div>
            </FAQSection>

            <FAQSection id="initiative-details" title="📄 Initiative Details - Deep Dive">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Overview Tab</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• <strong>Description:</strong> Full project details and objectives</li>
                            <li>• <strong>Team Members:</strong> Current team and their roles</li>
                            <li>• <strong>Open Roles:</strong> Available positions and requirements</li>
                            <li>• <strong>Skills Needed:</strong> Required and preferred skills</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Tasks Tab (Team Members Only)</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• <strong>Kanban Board:</strong> To Do, In Progress, Done columns</li>
                            <li>• <strong>Create Tasks:</strong> Add new tasks and assign them</li>
                            <li>• <strong>Track Progress:</strong> Move tasks between columns</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Requests Tab (Owners Only)</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• <strong>Review Applications:</strong> See who wants to join</li>
                            <li>• <strong>Approve/Reject:</strong> Make decisions on applications</li>
                            <li>• <strong>Send Invitations:</strong> Invite specific people directly</li>
                </ul>
                    </div>
                </div>
            </FAQSection>

            <FAQSection id="dashboard" title="📊 Dashboard - Analytics & Management">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>AI-Powered Summary</h3>
                        <p className={`${typography.sectionDescription}`}>Intelligent analysis of project health, team utilization, and key insights.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Key Metrics</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• <strong>Active Initiatives:</strong> Number of ongoing projects</li>
                            <li>• <strong>Completed Projects:</strong> Successfully finished initiatives</li>
                            <li>• <strong>Average Cycle Time:</strong> How long projects typically take</li>
                </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Team Utilization</h3>
                        <p className={`${typography.sectionDescription}`}>Visual charts showing capacity vs. workload across different locations and teams.</p>
                    </div>
                </div>
            </FAQSection>

            <FAQSection id="notifications" title="🔔 Notifications & Alerts">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>What You'll Be Notified About</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• <strong>Join Requests:</strong> When someone wants to join your initiative</li>
                            <li>• <strong>Task Assignments:</strong> When you're assigned a new task</li>
                            <li>• <strong>Application Updates:</strong> When your join requests are approved/rejected</li>
                            <li>• <strong>New Opportunities:</strong> When initiatives matching your skills are created</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Managing Notifications</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• <strong>View All:</strong> Click the bell icon in the header</li>
                            <li>• <strong>Mark as Read:</strong> Click individual notifications</li>
                            <li>• <strong>Mark All Read:</strong> Clear all notifications at once</li>
                </ul>
                    </div>
                </div>
            </FAQSection>

            <FAQSection id="tips-tricks" title="💡 Tips & Best Practices">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>For Better Recommendations</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• Keep your profile skills up to date</li>
                            <li>• Set your correct location and availability</li>
                            <li>• Use specific, descriptive search terms</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>For Project Success</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• Write clear, detailed initiative descriptions</li>
                            <li>• Be specific about required skills and time commitment</li>
                            <li>• Regularly update task status and communicate with team</li>
                </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`${typography.h3} text-foreground`}>Navigation Tips</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• Use breadcrumbs to navigate back to previous pages</li>
                            <li>• Pin the sidebar for quick access to all sections</li>
                            <li>• Use the search bar for quick project discovery</li>
                </ul>
                    </div>
                </div>
            </FAQSection>
        </div>
    );
};

export default DocsPage;