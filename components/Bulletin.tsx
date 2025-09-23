import React, { useState, useEffect, useMemo } from 'react';
import { createInitiative, CreateInitiativeData, getHelpWantedPosts } from '../services/api';
import * as llmService from '../services/llmService';
import { Initiative, User, HelpWanted, InitiativeStatus, RecommendedHelpWanted } from '../types';
import { AVAILABLE_LOCATIONS } from '../constants';
import InitiativeCard from './InitiativeCard';
import HelpWantedCard from './HelpWantedCard';
import CreateInitiativeModal from './CreateInitiativeModal';
import { Sparkles, Plus } from 'lucide-react';
import FilterDropdown from './ui/FilterDropdown';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { typography } from '../tokens/typography';
import { useToasts } from './ui/ToastProvider';
import CreateInitiativeFromSearchCard from './CreateInitiativeFromSearchCard';
import { UserCircle } from 'lucide-react';
import InitiativeCardSkeleton from './InitiativeCardSkeleton';

interface BulletinProps {
  initiatives: Initiative[];
  currentUser: User | null;
  users: User[];
  onSelectInitiative: (id: string) => void;
  onDataChange: () => void;
  onSelectUser: (id: string) => void;
}

type BulletinTab = 'for-you' | 'browse-all' | 'my-initiatives';

const Bulletin: React.FC<BulletinProps> = ({ initiatives, currentUser, users, onSelectInitiative, onDataChange, onSelectUser }) => {
  const [personalRecommendations, setPersonalRecommendations] = useState<{ id: string, reasoning: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState<Partial<CreateInitiativeData> | null>(null);
  const { addToast } = useToasts();

  // State for AI Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSummary, setSearchSummary] = useState<string | null>(null);
  const [searchIntent, setSearchIntent] = useState<'build' | 'join' | 'general' | null>(null);
  const [foundInitiatives, setFoundInitiatives] = useState<{ initiative: Initiative; reasoning: string }[] | null>(null);
  const [foundHelpWanted, setFoundHelpWanted] = useState<RecommendedHelpWanted[]>([]);
  const [helpWantedForSearch, setHelpWantedForSearch] = useState<HelpWanted[]>([]);
  const [isPrefilling, setIsPrefilling] = useState(false);

  // State for filters
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // State for tabbed view
  const [activeTab, setActiveTab] = useState<BulletinTab>('browse-all');
  
  // State for status filter (used in browse-all and my-initiatives)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (currentUser && initiatives.length > 0) {
        setAiLoading(true);
        const joinableInitiatives = initiatives.filter(i => i.status === 'Searching Talent' || i.status === 'In Progress');
        try {
          const recommendations = await llmService.getRecommendedInitiatives(currentUser, joinableInitiatives);
          const mappedRecs = recommendations.map(r => ({ id: r.initiativeId, reasoning: r.reasoning }));
          setPersonalRecommendations(mappedRecs);
        } catch (error) {
          console.error("Failed to fetch recommendations:", error);
        } finally {
          setAiLoading(false);
        }
      } else {
         setAiLoading(false);
      }
    };
    fetchRecommendations();
  }, [currentUser, initiatives]);
  
  useEffect(() => {
    const skills = [...new Set(initiatives.flatMap(i => i.skillsNeeded))].sort();
    const tags = [...new Set(initiatives.flatMap(i => i.tags))].sort();
    setAllSkills(skills);
    setAllTags(tags);
  }, [initiatives]);

  const handleClearFilters = () => {
    setSelectedLocations([]);
    setSelectedSkills([]);
    setSelectedTags([]);
    setSelectedStatuses([]);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setPrefilledData(null);
  }
  
  const handleCreateInitiative = async (newInitiativeData: CreateInitiativeData) => {
    if (!currentUser) return;
    await createInitiative(newInitiativeData);
    addToast('Initiative created successfully!', 'success');
    onDataChange();
    handleModalClose();
    handleClearSearch();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchError(null);
    setSearchSummary(null);
    setSearchIntent(null);
    setFoundInitiatives(null);
    setFoundHelpWanted([]);
  };

  const handleSearch = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !currentUser) return;
    
    setIsSearching(true);
    setSearchError(null);
    setSearchSummary(null);
    setFoundHelpWanted([]);
    setFoundInitiatives(null);

    try {
      const analysis = await llmService.analyzeSearchQuery(searchQuery);
      setSearchIntent(analysis.intent);

      let summaryResults: Initiative[] = [];

      if (analysis.intent === 'join') {
        // For join intent, show matching roles and initiatives inline
        const allHelpWanted = await getHelpWantedPosts();
        setHelpWantedForSearch(allHelpWanted);
        const matches = await llmService.findMatchingOpportunities(analysis.keywords, initiatives, allHelpWanted);

        // Map initiative recommendations to full objects with reasoning
        if (matches.initiatives && matches.initiatives.length > 0) {
          const matchedInitiatives = matches.initiatives.map(rec => {
            const initiative = initiatives.find(i => i.id === rec.initiativeId);
            return initiative ? { initiative, reasoning: rec.reasoning } : null;
          }).filter((i): i is { initiative: Initiative; reasoning: string } => !!i);
          setFoundInitiatives(matchedInitiatives);
          summaryResults = matchedInitiatives.map(m => m.initiative);
        } else {
          setFoundInitiatives([]);
        }

        // Store help wanted recommendations (resolve to posts in render)
        setFoundHelpWanted(matches.helpWanted || []);
      } else { // 'build' or 'general'
        const similar = await llmService.findSimilarInitiatives(searchQuery, initiatives);
        const matchedInitiatives = similar.map(rec => {
           const initiative = initiatives.find(i => i.id === rec.initiativeId);
           return initiative ? { initiative, reasoning: rec.reasoning } : null;
        }).filter((i): i is { initiative: Initiative; reasoning: string } => !!i);
        setFoundInitiatives(matchedInitiatives);
        
        summaryResults = matchedInitiatives.map(m => m.initiative);
      }

      if (summaryResults.length > 0) {
        const summary = await llmService.summarizeSearchResults(searchQuery, summaryResults, analysis.intent);
        setSearchSummary(summary);
      }

    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleCreateFromSearch = async () => {
    setIsPrefilling(true);
    try {
      const data = await llmService.extractInitiativeDetailsFromQuery(searchQuery);
      setPrefilledData(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      addToast('Could not analyze your idea.', 'error');
      setPrefilledData(null);
      setIsModalOpen(true);
    } finally {
      setIsPrefilling(false);
    }
  };

  const filteredInitiatives = useMemo(() => {
    return initiatives.filter(initiative => {
        const locationMatch = selectedLocations.length === 0 || (initiative.locations && initiative.locations.some(loc => selectedLocations.includes(loc)));
        const skillMatch = selectedSkills.length === 0 || (initiative.skillsNeeded && initiative.skillsNeeded.some(skill => selectedSkills.includes(skill)));
        const tagMatch = selectedTags.length === 0 || (initiative.tags && initiative.tags.some(tag => selectedTags.includes(tag)));
        return locationMatch && skillMatch && tagMatch;
    });
  }, [initiatives, selectedLocations, selectedSkills, selectedTags]);
  
  const areFiltersActive = selectedLocations.length > 0 || selectedSkills.length > 0 || selectedTags.length > 0 || selectedStatuses.length > 0;
  
  const tabs: {id: BulletinTab, label: string}[] = [
      { id: 'for-you', label: 'For You'},
      { id: 'browse-all', label: 'Browse All' },
      { id: 'my-initiatives', label: 'My Initiatives' },
  ];

  // Available status options for filtering
  const statusOptions = [
    'Searching Talent',
    'In Progress', 
    'Under Review',
    'Completed'
  ];

  // Get initiatives for current user (owned or joined)
  const getMyInitiatives = () => {
    if (!currentUser) return [];
    return initiatives.filter(initiative => 
      initiative.ownerId === currentUser.id || 
      initiative.teamMembers.some(member => member.userId === currentUser.id)
    );
  };

  // Apply status filtering to initiatives
  const getStatusFilteredInitiatives = (initiativesToFilter: Initiative[]) => {
    if (selectedStatuses.length === 0) return initiativesToFilter;
    return initiativesToFilter.filter(initiative => selectedStatuses.includes(initiative.status));
  };

  const renderTabContent = () => {
    switch(activeTab) {
        case 'for-you':
            const recommended = initiatives.filter(i => personalRecommendations.map(r => r.id).includes(i.id));
            
            return (
                <div className="space-y-6">
<h2 className={`flex items-center gap-2 ${typography.h2} text-foreground`}><Sparkles className="h-5 w-5 text-primary" /> Recommended Initiatives</h2>
                     <p className="text-sm text-muted-foreground -mt-3">AI-powered initiative recommendations based on your profile.</p>
                     {aiLoading ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <InitiativeCardSkeleton />
                            <InitiativeCardSkeleton />
                            <InitiativeCardSkeleton />
                        </div>
                    ) : recommended.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {recommended.map((init, index) => (
                                <InitiativeCard 
                                    key={`fy-init-${init.id}`} 
                                    initiative={init}
                                    recommendationReason={personalRecommendations.find(r => r.id === init.id)?.reasoning}
                                    onSelect={() => onSelectInitiative(init.id)}
                                    currentUser={currentUser}
                                    onDataChange={onDataChange}
                                    onSelectUser={onSelectUser}
                                    style={{ animationDelay: `${index * 80}ms` }}
                                    className="animate-fadeIn"
                                />
                            ))}
                        </div>
                    ) : (
                         <Card className="text-center p-8 animate-fadeIn">
                             <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                             <h3 className="mt-4 text-lg font-medium text-foreground">Nothing to recommend... yet</h3>
                             <p className="mt-1 text-sm text-muted-foreground">Update your profile with your skills to get personalized recommendations, or browse the other tabs!</p>
                         </Card>
                    )}
                </div>
            );

        case 'browse-all':
            const browseInitiatives = getStatusFilteredInitiatives(filteredInitiatives);
            return <InitiativeSection initiatives={browseInitiatives} currentUser={currentUser} onSelectInitiative={onSelectInitiative} onDataChange={onDataChange} onSelectUser={onSelectUser} />;
        
        case 'my-initiatives':
            const myInitiatives = getMyInitiatives();
            const filteredMyInitiatives = myInitiatives.filter(initiative => {
                const locationMatch = selectedLocations.length === 0 || (initiative.location && selectedLocations.includes(initiative.location));
                const skillMatch = selectedSkills.length === 0 || (initiative.skillsNeeded && initiative.skillsNeeded.some(skill => selectedSkills.includes(skill)));
                const tagMatch = selectedTags.length === 0 || (initiative.tags && initiative.tags.some(tag => selectedTags.includes(tag)));
                return locationMatch && skillMatch && tagMatch;
            });
            const statusFilteredMyInitiatives = getStatusFilteredInitiatives(filteredMyInitiatives);
            return <InitiativeSection initiatives={statusFilteredMyInitiatives} currentUser={currentUser} onSelectInitiative={onSelectInitiative} onDataChange={onDataChange} onSelectUser={onSelectUser} />;

        default:
            return null;
    }
  }


  return (
    <>
    <CreateInitiativeModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onCreate={handleCreateInitiative}
        currentUser={currentUser}
        allUsers={users}
        initialData={prefilledData}
    />
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Discover, join, and manage internal initiatives.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-5 w-5 -ml-1 mr-2" />
            Create Initiative
        </Button>
      </div>

      <Card className="p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-shrink-0 text-primary">
            <Sparkles className="h-8 w-8"/>
          </div>
          <div className="flex-grow">
            <h2 className="text-lg font-semibold text-foreground">Have an idea? Or want to join?</h2>
            <p className="text-sm text-muted-foreground">Describe what you want to build or what skills you want to use. We'll find a match for you.</p>
          </div>
        </div>
        <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row sm:items-stretch gap-3">
            <textarea
              disabled={isSearching}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isSearching ? "Analyzing..." : "e.g., 'An app for new hires to find mentors' or 'Looking to join a project using React'"}
              className={`w-full flex-grow rounded-md border-input bg-background shadow-sm focus:border-primary focus:ring-primary text-base placeholder:text-muted-foreground resize-none px-4 py-2.5 transition-all ${
                isSearching 
                ? 'bg-muted cursor-wait' 
                : 'bg-background'
              }`}
              rows={1}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (searchQuery.trim()) handleSearch(e);
                  }
              }}
            />
            <Button type="submit" disabled={isSearching || !searchQuery.trim()} className="w-full sm:w-auto">
              {isSearching ? 'Searching...' : 'Explore'}
            </Button>
        </form>
      </Card>

      {searchIntent !== null ? (
        <section className="space-y-8">
           <div className="flex justify-between items-center">
             <h2 className={`${typography.h2} text-foreground`}>AI Search Results</h2>
             <Button onClick={handleClearSearch} variant="secondary">Clear Search</Button>
           </div>
          {searchSummary && (
             <Card className="bg-primary/10 border-primary/20 animate-fadeIn">
                <div className="flex items-start gap-4">
                    <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-base text-foreground leading-relaxed">{searchSummary}</p>
                </div>
            </Card>
          )}

          {foundInitiatives && foundInitiatives.length === 0 && searchIntent !== 'join' && (
            <Card className="text-center p-8 bg-muted animate-fadeIn">
                <h3 className="text-xl font-semibold text-foreground">No similar initiatives found</h3>
                <p className="text-muted-foreground mt-2">
                This looks like a brand new idea!
                </p>
                 <div className="mt-6">
                   <CreateInitiativeFromSearchCard onClick={handleCreateFromSearch} disabled={isPrefilling} />
                 </div>
            </Card>
          )}
          
          {foundInitiatives && foundInitiatives.length > 0 && (
            <section>
              <h3 className={`${typography.h2} text-foreground mb-3`}>Matching Initiatives</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {foundInitiatives.map(({ initiative, reasoning }, index) => (
                  <InitiativeCard 
                      key={initiative.id} 
                      initiative={initiative}
                      onSelect={() => onSelectInitiative(initiative.id)}
                      onSelectUser={onSelectUser}
                      currentUser={currentUser}
                      onDataChange={onDataChange}
                      recommendationReason={reasoning}
                      style={{ animationDelay: `${index * 80}ms` }}
                      className="animate-fadeIn"
                  />
                ))}
                {(searchIntent === 'build' || searchIntent === 'general') && (
                    <CreateInitiativeFromSearchCard onClick={handleCreateFromSearch} disabled={isPrefilling} style={{ animationDelay: `${foundInitiatives.length * 80}ms` }} className="animate-fadeIn" />
                )}
              </div>
            </section>
           )}

           {/* Matching roles for 'join' intent */}
           {foundHelpWanted.length > 0 && (
             <section>
               <h3 className={`${typography.h2} text-foreground mb-3`}>Matching Roles</h3>
               <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {foundHelpWanted.map((rec, idx) => {
                   const post = helpWantedForSearch.find(p => p.id === rec.helpWantedId);
                   return post ? (
                     <HelpWantedCard
                       key={post.id}
                       post={post}
                       currentUser={currentUser}
                       onDataChange={onDataChange}
                       recommendationReason={rec.reasoning}
                     />
                   ) : null;
                 })}
               </div>
             </section>
           )}
        </section>
      ) : (
        <div className="space-y-6">
          <Card className="p-0">
             <div className="border-b border-border px-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="p-5">
               {activeTab !== 'for-you' && (
                <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border bg-muted p-3">
                    <FilterDropdown label="Status" options={statusOptions} selectedOptions={selectedStatuses} onChange={setSelectedStatuses} />
                    <FilterDropdown label="Location" options={AVAILABLE_LOCATIONS} selectedOptions={selectedLocations} onChange={setSelectedLocations} />
                    <FilterDropdown label="Skill" options={allSkills} selectedOptions={selectedSkills} onChange={setSelectedSkills} />
                    <FilterDropdown label="Tag" options={allTags} selectedOptions={selectedTags} onChange={setSelectedTags} />
                    {areFiltersActive && <button onClick={handleClearFilters} className="ml-auto text-sm font-medium text-primary hover:underline">Clear all</button>}
                </div>
               )}
               <div key={activeTab} className="animate-fadeIn">
                 {renderTabContent()}
               </div>
            </div>
          </Card>
        </div>
      )}
    </div>
    </>
  );
};


const InitiativeSection: React.FC<InitiativeSectionProps> = ({ initiatives, currentUser, onSelectInitiative, onDataChange, onSelectUser }) => {
  if (initiatives.length === 0) {
    return <p className="text-center text-muted-foreground py-12">No initiatives in this category.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {initiatives.map((init, index) => (
        <InitiativeCard 
          key={init.id} 
          initiative={init} 
          onSelect={() => onSelectInitiative(init.id)}
          currentUser={currentUser}
          onDataChange={onDataChange}
          onSelectUser={onSelectUser}
          style={{ animationDelay: `${index * 80}ms` }}
          className="animate-fadeIn"
        />
      ))}
    </div>
  );
};

interface InitiativeSectionProps {
  initiatives: Initiative[];
  currentUser: User | null;
  onSelectInitiative: (id: string) => void;
  onDataChange: () => void;
  onSelectUser: (id: string) => void;
}

export default Bulletin;