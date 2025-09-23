import React, { useState, useEffect, useMemo } from 'react';
import { Initiative, User, HelpWanted, RecommendedHelpWanted } from '../types';
import * as llmService from '../services/llmService';
import { AVAILABLE_LOCATIONS } from '../constants';
import HelpWantedCard from './HelpWantedCard';
import FilterDropdown from './ui/FilterDropdown';
import { Card } from './ui/card';
import { typography } from '../tokens/typography';
import { Sparkles } from "lucide-react"
import { FolderOpen } from "lucide-react"
import HelpWantedCardSkeleton from './HelpWantedCardSkeleton';

interface OpportunitiesPageProps {
  initiatives: Initiative[];
  helpWanted: HelpWanted[];
  currentUser: User | null;
  onDataChange: () => void;
  onSelectInitiative: (id: string) => void;
}

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ initiatives, helpWanted, currentUser, onDataChange, onSelectInitiative }) => {
  const [recommendations, setRecommendations] = useState<RecommendedHelpWanted[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  const openHelpWanted = useMemo(() => helpWanted.filter(p => p.status === 'Open'), [helpWanted]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (currentUser && openHelpWanted.length > 0) {
        setAiLoading(true);
        try {
          const recs = await llmService.getRecommendedHelpWantedPosts(currentUser, openHelpWanted, initiatives);
          setRecommendations(recs);
        } catch (error) {
          console.error("Failed to fetch opportunities recommendations:", error);
        } finally {
          setAiLoading(false);
        }
      } else {
        setAiLoading(false);
      }
    };
    fetchRecommendations();
  }, [currentUser, openHelpWanted, initiatives]);
  
  useEffect(() => {
    const skills = [...new Set(helpWanted.map(p => p.skill))].sort();
    setAllSkills(skills);
  }, [helpWanted]);
  
  const handleClearFilters = () => {
    setSelectedLocations([]);
    setSelectedSkills([]);
  };

  const filteredHelpWanted = useMemo(() => {
    return openHelpWanted.filter(post => {
        const initiative = initiatives.find(i => i.id === post.initiativeId);
        if (!initiative) return false;
        
        const locationMatch = selectedLocations.length === 0 || initiative.locations.some(loc => selectedLocations.includes(loc));
        const skillMatch = selectedSkills.length === 0 || selectedSkills.includes(post.skill);
        return locationMatch && skillMatch;
    });
  }, [openHelpWanted, initiatives, selectedLocations, selectedSkills]);
  
  const areFiltersActive = selectedLocations.length > 0 || selectedSkills.length > 0;

  const recommendedPosts = recommendations.map(rec => {
    const post = openHelpWanted.find(p => p.id === rec.helpWantedId);
    return post ? { ...post, reasoning: rec.reasoning } : null;
  }).filter((p): p is HelpWanted & { reasoning: string } => !!p);

  return (
    <div className="space-y-8">
      <div>
<h1 className={`${typography.h1} text-foreground`}>Opportunities</h1>
        <p className="mt-1 text-sm text-muted-foreground">Find open roles on internal initiatives that match your skills.</p>
      </div>
      
      {/* Recommended for you */}
      <section>
<h2 className={`flex items-center gap-2 ${typography.h2} text-foreground`}><Sparkles className="h-5 w-5 text-accent-foreground" /> Recommended for You</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-3">AI-powered role recommendations based on your profile.</p>
        {aiLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <HelpWantedCardSkeleton />
                <HelpWantedCardSkeleton />
            </div>
        ) : recommendedPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recommendedPosts.map(post => (
                    <HelpWantedCard 
                        key={`rec-${post.id}`} 
                        post={post} 
                        currentUser={currentUser} 
                        onDataChange={onDataChange} 
                        recommendationReason={post.reasoning}
                    />
                ))}
            </div>
        ) : (
            <Card className="text-center p-8">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-foreground">No specific recommendations right now</h3>
                <p className="mt-1 text-sm text-muted-foreground">Browse all opportunities below or update your profile skills for better recommendations.</p>
            </Card>
        )}
      </section>

      {/* All opportunities */}
      <section>
<h2 className={`${typography.h2} text-foreground mb-3`}>All Open Roles ({filteredHelpWanted.length})</h2>
        <Card className="p-0">
<div className="p-5">
<div className="mb-6 flex flex-wrap items-center gap-4 rounded-md border bg-muted p-3">
                    <FilterDropdown label="Location" options={AVAILABLE_LOCATIONS} selectedOptions={selectedLocations} onChange={setSelectedLocations} />
                    <FilterDropdown label="Skill" options={allSkills} selectedOptions={selectedSkills} onChange={setSelectedSkills} />
                    {areFiltersActive && <button onClick={handleClearFilters} className="ml-auto text-sm font-medium text-primary hover:underline">Clear all</button>}
                </div>

                {filteredHelpWanted.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredHelpWanted.map(post => (
                            <HelpWantedCard 
                                key={post.id} 
                                post={post} 
                                currentUser={currentUser} 
                                onDataChange={onDataChange} 
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-12">No open roles match your current filters.</p>
                )}
             </div>
        </Card>
      </section>
    </div>
  );
};

export default OpportunitiesPage;
