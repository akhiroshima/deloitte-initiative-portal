import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/Card';
import { typography } from '../tokens/typography';
import { Sparkles } from "lucide-react"
import { Initiative, User, Task, TaskStatus } from '../types';
import * as llmService from '../services/llmService';
import { AVAILABLE_LOCATIONS } from '../constants';
import { Button } from './ui/Button';
import UserCardSkeleton from './UserCardSkeleton';

interface DashboardProps {
    initiatives: Initiative[];
    users: User[];
    tasks: Task[];
    onSelectInitiative: (id: string) => void;
    onSelectUser: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ initiatives, users, tasks, onSelectInitiative, onSelectUser }) => {
  const [aiInsight, setAiInsight] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(true);

  const dashboardData = useMemo(() => {
    if (initiatives.length === 0 || users.length === 0) return null;

    const active = initiatives.filter(i => i.status === 'In Progress').length;
    
    const now = new Date();
    const q2Start = new Date(now.getFullYear(), 3, 1);
    const q2End = new Date(now.getFullYear(), 5, 30);
    const completedQ2 = initiatives.filter(i => {
        if (i.status !== 'Completed' || !i.endDate) return false;
        const endDate = new Date(i.endDate);
        return endDate >= q2Start && endDate <= q2End;
    }).length;

    const completedWithDates = initiatives.filter(i => i.status === 'Completed' && i.startDate && i.endDate);
    const totalCycleTime = completedWithDates.reduce((sum, i) => {
        const start = new Date(i.startDate!).getTime();
        const end = new Date(i.endDate!).getTime();
        const diffDays = (end - start) / (1000 * 3600 * 24);
        return sum + diffDays;
    }, 0);
    const avgCycleTimeDays = completedWithDates.length > 0 ? Math.round(totalCycleTime / completedWithDates.length) : 0;
    
    // New, more accurate utilization calculation
    const utilizationByUser: { [userId: string]: number } = {};
    initiatives.forEach(initiative => {
        if (initiative.status === 'In Progress' || initiative.status === 'Under Review') {
            initiative.teamMembers.forEach(member => {
                if (!utilizationByUser[member.userId]) {
                    utilizationByUser[member.userId] = 0;
                }
                utilizationByUser[member.userId] += member.committedHours;
            });
        }
    });

    const utilizationByLocation: { [key: string]: { capacity: number, assigned: number } } = {};
    users.forEach(user => {
        if (!utilizationByLocation[user.location]) {
            utilizationByLocation[user.location] = { capacity: 0, assigned: 0 };
        }
        utilizationByLocation[user.location].capacity += user.weeklyCapacityHrs;
        utilizationByLocation[user.location].assigned += utilizationByUser[user.id] || 0;
    });

    return {
        kpis: { active, completedQ2, avgCycleTime: `${avgCycleTimeDays} days` },
        utilization: Object.entries(utilizationByLocation).map(([location, data]) => ({
            location,
            ...data,
            percentage: data.capacity > 0 ? Math.round((data.assigned / data.capacity) * 100) : 0
        })).sort((a,b) => b.capacity - a.capacity),
    };
  }, [initiatives, users]);
  
  const usersByLocation = useMemo(() => {
    const grouped: { [key: string]: User[] } = {};
    const sortedLocations = [...AVAILABLE_LOCATIONS];
    for (const location of sortedLocations) {
        const locationUsers = users.filter(u => u.location === location);
        if (locationUsers.length > 0) {
            grouped[location] = locationUsers.sort((a, b) => a.name.localeCompare(b.name));
        }
    }
    return grouped;
  }, [users]);
  
  const userComputedData = useMemo(() => {
    const data = new Map<string, { assignedHrs: number; capacityHrs: number; utilizationPercentage: number; activeInitiatives: Initiative[] }>();
    users.forEach(user => {
      const assignedHrs = initiatives
        .filter(i => i.status === 'In Progress' || i.status === 'Under Review')
        .flatMap(i => i.teamMembers)
        .filter(m => m.userId === user.id)
        .reduce((sum, m) => sum + m.committedHours, 0);
      
      const capacityHrs = user.weeklyCapacityHrs;
      const utilizationPercentage = capacityHrs > 0 ? Math.round((assignedHrs / capacityHrs) * 100) : 0;
      
      const activeInitiatives = initiatives.filter(i => 
        i.teamMembers.some(m => m.userId === user.id) && (i.status === 'In Progress' || i.status === 'Under Review')
      );
      
      data.set(user.id, { assignedHrs, capacityHrs, utilizationPercentage, activeInitiatives });
    });
    return data;
  }, [users, initiatives]);


  useEffect(() => {
    const fetchAiInsight = async () => {
        if (dashboardData) {
            setAiLoading(true);
            try {
                const insight = await llmService.getDashboardInsights(dashboardData.kpis, dashboardData.utilization);
                setAiInsight(insight);
            } catch (e) {
                console.error("Failed to get AI insight", e);
                setAiInsight("Could not load AI insights at this time.");
            } finally {
                setAiLoading(false);
            }
        }
    }
    fetchAiInsight();
  }, [dashboardData]);
  
  const isLoading = !dashboardData;

  return (
    <div className="space-y-8">
      <div>
        <p className={`${typography.pageDescription}`}>Real-time health and capacity analytics.</p>
      </div>

      <Card className="bg-primary/10 border-primary/20">
          <div className="flex items-start gap-4 p-4">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
<h3 className={`${typography.h3} text-foreground`}>AI-Powered Summary</h3>
                  {aiLoading || isLoading ? (
                     <div className="mt-2 space-y-2 animate-pulse">
                        <div className="h-4 w-96 rounded bg-muted"></div>
                        <div className="h-4 w-80 rounded bg-muted"></div>
                     </div>
                  ) : (
                     <p className="text-sm text-foreground/80 leading-relaxed mt-2">{aiInsight}</p>
                  )}
              </div>
          </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
            <>
                <Card className="p-6 h-28 bg-muted animate-pulse"></Card>
                <Card className="p-6 h-28 bg-muted animate-pulse"></Card>
                <Card className="p-6 h-28 bg-muted animate-pulse"></Card>
            </>
        ) : (
            <>
                <KpiCard title="Active Initiatives" value={dashboardData.kpis.active.toString()} />
                <KpiCard title="Completed (Q2)" value={dashboardData.kpis.completedQ2.toString()} />
                <KpiCard title="Avg. Cycle Time" value={dashboardData.kpis.avgCycleTime} />
            </>
        )}
      </div>
      
<h2 className={`${typography.h2} text-foreground`}>Studio Overview</h2>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-1 p-5">
<h3 className={`${typography.h3} text-foreground`}>Utilisation by Location</h3>
            <p className="text-sm text-muted-foreground mb-5">Team capacity vs. committed work (weekly hours).</p>
            {isLoading ? (
                <div className="space-y-5 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                         <div key={i}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="h-5 w-24 bg-muted rounded"></span>
                                <span className="h-4 w-16 bg-muted rounded"></span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-4"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-5">
                    {dashboardData.utilization.map(item => (
                        <div key={item.location}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-foreground">{item.location}</span>
                                <span className="text-sm text-muted-foreground">{item.assigned.toFixed(1)} / {item.capacity} hrs</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-4">
                                <div 
                                    className={`rounded-full h-4 ${item.percentage > 100 ? 'bg-destructive' : (item.percentage > 80 ? 'bg-secondary' : 'bg-primary')}`}
                                    style={{ width: `${Math.min(item.percentage, 100)}%`}}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>

        <div className="xl:col-span-2 space-y-8">
            {isLoading ? (
                <div className="space-y-8">
                    <div>
                        <div className="h-8 w-1/3 bg-muted animate-pulse rounded-md mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <UserCardSkeleton />
                            <UserCardSkeleton />
                        </div>
                    </div>
                     <div>
                        <div className="h-8 w-1/3 bg-muted animate-pulse rounded-md mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <UserCardSkeleton />
                            <UserCardSkeleton />
                        </div>
                    </div>
                </div>
            ) : (
              Object.entries(usersByLocation).map(([location, locationUsers]) => (
                  <div key={location}>
                      <h4 className="text-lg font-semibold text-foreground pb-1.5 mb-3">{location} Studio <span className="text-sm font-medium text-muted-foreground">({locationUsers.length})</span></h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {locationUsers.map(user => (
                              <UserCard 
                                  key={user.id} 
                                  user={user} 
                                  computedData={userComputedData.get(user.id)}
                                  onSelectInitiative={onSelectInitiative}
                                  onSelectUser={onSelectUser}
                              />
                          ))}
                      </div>
                  </div>
              ))
            )}
        </div>
      </div>

    </div>
  );
};

interface KpiCardProps {
    title: string;
    value: string;
}
const KpiCard: React.FC<KpiCardProps> = ({ title, value }) => (
    <Card className="p-6">
        <h3 className="text-base font-medium text-muted-foreground">{title}</h3>
        <p className="text-4xl font-bold text-foreground mt-1">{value}</p>
    </Card>
);

interface UserCardProps {
    user: User;
    computedData?: { assignedHrs: number; capacityHrs: number; utilizationPercentage: number; activeInitiatives: Initiative[] };
    onSelectUser: (userId: string) => void;
    onSelectInitiative: (initiativeId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, computedData, onSelectUser, onSelectInitiative }) => {
    if (!computedData) return null;
    const { assignedHrs, capacityHrs, utilizationPercentage, activeInitiatives } = computedData;

    const barColor = utilizationPercentage > 100 ? 'bg-destructive' : utilizationPercentage > 80 ? 'bg-secondary' : 'bg-primary';

    return (
        <Card className="p-4 space-y-4">
            <button onClick={() => onSelectUser(user.id)} className="flex items-center gap-4 text-left w-full group">
                <img src={user.avatarUrl} alt={user.name} className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-grow">
                    <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.role}</p>
                </div>
            </button>
            
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-foreground">Weekly Utilisation ({utilizationPercentage}%)</span>
                    <span className="text-xs text-muted-foreground">{assignedHrs.toFixed(1)} / {capacityHrs} hrs</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                        className={`rounded-full h-2.5 ${barColor}`}
                        style={{ width: `${Math.min(utilizationPercentage, 100)}%`}}
                    ></div>
                </div>
            </div>

            <div>
                <h5 className="text-sm font-medium text-foreground mb-2">Active Initiatives</h5>
                 <div className="flex flex-col gap-2">
                    {activeInitiatives.length > 0 ? activeInitiatives.map(init => (
                        <Button 
                            key={init.id}
                            variant="secondary"
                            size="sm"
                            onClick={() => onSelectInitiative(init.id)}
                            className="w-full justify-start text-left truncate"
                        >
                            {init.title}
                        </Button>
                    )) : (
                        <span className="text-sm text-muted-foreground px-2">No active projects</span>
                    )}
                </div>
            </div>
        </Card>
    );
};


export default Dashboard;