import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { CreateInitiativeData } from '../services/api';
import { AVAILABLE_LOCATIONS } from '../constants';
import { processDocumentForInitiative, isFileTypeSupported, getFileExtension } from '../services/documentParser';
import { Button } from './ui/button';
import { X } from "lucide-react"
import { FileText } from "lucide-react"
import UserSearchSelect from './ui/UserSearchSelect';
import MultiSelectDropdown from './ui/MultiSelectDropdown';
import Modal from './ui/Modal';
import { typography } from '../tokens/typography';

interface CreateInitiativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (initiative: CreateInitiativeData) => void;
  currentUser: User | null;
  allUsers: User[];
  initialData?: Partial<Omit<CreateInitiativeData, 'teamMemberIds'>> | null;
}

const CreateInitiativeModal: React.FC<CreateInitiativeModalProps> = ({ isOpen, onClose, onCreate, currentUser, allUsers, initialData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsNeeded, setSkillsNeeded] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  
  // Document upload state
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      // Reset form on open and apply initial data if available
      setTitle(initialData?.title || '');
      setDescription(initialData?.description || '');
      setSkillsNeeded(initialData?.skillsNeeded?.join(', ') || '');
      setLocations(initialData?.locations || []);
      setTags(initialData?.tags?.join(', ') || '');
      // Do not use initialData for team members as the flow is now invitation-based
      setTeamMemberIds(currentUser ? [currentUser.id] : []);
      
      setCoverImageFile(null);
      if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
      setCoverImagePreview(null);
      
      // Reset document upload state
      setDocumentFile(null);
      setIsProcessingDocument(false);
      setDocumentError(null);
      
      setErrors({});
    }
  }, [isOpen, initialData, currentUser, coverImagePreview]);
  
  // Cleanup object URL
  useEffect(() => {
    return () => {
        if (coverImagePreview) {
            URL.revokeObjectURL(coverImagePreview);
        }
    };
  }, [coverImagePreview]);
  
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = 'Title is required.';
    if (!description.trim()) newErrors.description = 'Description is required.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (file: File | null) => {
    if (coverImagePreview) {
        URL.revokeObjectURL(coverImagePreview);
    }
    if (file && file.type.startsWith('image/')) {
        setCoverImageFile(file);
        setCoverImagePreview(URL.createObjectURL(file));
    } else {
        setCoverImageFile(null);
        setCoverImagePreview(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0] || null;
      handleFileChange(file);
  };

  const handleDocumentUpload = async (file: File | null) => {
    if (!file) {
      setDocumentFile(null);
      setDocumentError(null);
      return;
    }

    // Validate file type
    if (!isFileTypeSupported(file.type)) {
      setDocumentError(`Unsupported file type. Please upload a PDF, Word, PowerPoint, Excel, or text file.`);
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setDocumentError('File size too large. Please upload a file smaller than 10MB.');
      return;
    }

    setDocumentFile(file);
    setDocumentError(null);
    setIsProcessingDocument(true);

    try {
      const initiativeData = await processDocumentForInitiative(file);
      
      // Pre-fill form with extracted data
      if (initiativeData.title) setTitle(initiativeData.title);
      if (initiativeData.description) setDescription(initiativeData.description);
      if (initiativeData.skillsNeeded && initiativeData.skillsNeeded.length > 0) {
        setSkillsNeeded(initiativeData.skillsNeeded.join(', '));
      }
      if (initiativeData.tags && initiativeData.tags.length > 0) {
        setTags(initiativeData.tags.join(', '));
      }
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : 'Failed to process document');
    } finally {
      setIsProcessingDocument(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const newInitiative: CreateInitiativeData = {
      title,
      description,
      teamMemberIds,
      skillsNeeded: skillsNeeded.split(',').map(s => s.trim()).filter(Boolean),
      locations: locations,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      coverImageFile: coverImageFile || undefined,
    };
    onCreate(newInitiative);
  };
  
  const inputClasses = `mt-1 block w-full rounded-md border-input bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2`;
  const labelClasses = "block text-sm font-medium text-foreground";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-6xl">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start justify-between border-b border-border p-6">
            <h2 id="modal-title" className={`${typography.h1} text-foreground`}>Create New Initiative</h2>
            <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
            >
                <X className="h-6 w-6" />
            </button>
        </div>
        
        <div className="overflow-y-auto p-6" style={{ maxHeight: '70vh' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className={labelClasses}>Initiative Title</label>
                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className={`${inputClasses} ${errors.title ? 'border-destructive' : ''}`} />
                {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="description" className={labelClasses}>Description</label>
                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className={`${inputClasses} ${errors.description ? 'border-destructive' : ''}`}></textarea>
                {errors.description && <p className="mt-1 text-sm text-destructive">{errors.description}</p>}
              </div>

              <div>
                <label className={labelClasses}>Team Members</label>
                <UserSearchSelect
                  allUsers={allUsers}
                  selectedUserIds={teamMemberIds}
                  onChange={setTeamMemberIds}
                  creatorId={currentUser?.id}
                />
                <p className="mt-1 text-xs text-muted-foreground">The owner is added automatically. Other selected users will be sent an invitation.</p>
              </div>
            
              <div>
                <label htmlFor="skillsNeeded" className={labelClasses}>Skills Needed</label>
                <input type="text" id="skillsNeeded" value={skillsNeeded} onChange={e => setSkillsNeeded(e.target.value)} className={inputClasses} placeholder="e.g. React, Figma, UI/UX" />
                <p className="mt-1 text-xs text-muted-foreground">Enter skills separated by commas.</p>
              </div>

              <div>
                <label className={labelClasses}>Locations</label>
                <MultiSelectDropdown
                  options={AVAILABLE_LOCATIONS}
                  selectedOptions={locations}
                  onChange={setLocations}
                  placeholder="Select applicable locations"
                />
                <p className="mt-1 text-xs text-muted-foreground">Select all locations where this initiative is based. Use 'Remote' for remote-friendly initiatives.</p>
              </div>
            
              <div>
                <label htmlFor="tags" className={labelClasses}>Tags</label>
                <input type="text" id="tags" value={tags} onChange={e => setTags(e.target.value)} className={inputClasses} placeholder="e.g. Design System, AI/ML" />
                <p className="mt-1 text-xs text-muted-foreground">Enter tags separated by commas to help others find your initiative.</p>
              </div>
            
              <div>
                <label className={labelClasses}>Cover Image</label>
                {!coverImagePreview ? (
                  <div
                    className="mt-1 flex justify-center rounded-lg border-2 border-dashed border-border px-6 pt-5 pb-6 hover:border-primary"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-muted-foreground" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-muted-foreground">
                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-background font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80">
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} accept="image/*" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="relative">
                      <img src={coverImagePreview} alt="Cover preview" className="rounded-lg max-h-48 w-full object-cover border border-border" />
                      <button
                        type="button"
                        onClick={() => handleFileChange(null)}
                        className="absolute top-2 right-2 rounded-full bg-background/60 p-1.5 text-foreground transition-colors hover:bg-background/80"
                        aria-label="Remove image"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">If left blank, a random image based on your first tag will be generated.</p>
              </div>
            </div>

            {/* Right Column - Document Upload Section */}
            <div className="lg:border-l lg:border-border lg:pl-8">
              <div className="sticky top-0">
                <label className={labelClasses}>Upload Document for Data Extraction</label>
                <p className="mt-1 text-xs text-muted-foreground mb-3">
                  Upload a PDF, Word, PowerPoint, Excel, or text file to automatically extract initiative details and pre-fill the form.
                </p>
                
                {!documentFile ? (
                  <div
                    className="mt-1 flex justify-center rounded-lg border-2 border-dashed border-border px-6 pt-5 pb-6 hover:border-primary"
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0] || null;
                      handleDocumentUpload(file);
                    }}
                  >
                    <div className="space-y-1 text-center">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="flex text-sm text-muted-foreground">
                        <label htmlFor="document-upload" className="relative cursor-pointer rounded-md bg-background font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80">
                          <span>Upload a document</span>
                          <input 
                            id="document-upload" 
                            name="document-upload" 
                            type="file" 
                            className="sr-only" 
                            onChange={(e) => handleDocumentUpload(e.target.files?.[0] || null)} 
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-muted-foreground">PDF, Word, PowerPoint, Excel, or text files up to 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{documentFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isProcessingDocument && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            <span>Processing...</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDocumentUpload(null)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Remove document"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {documentError && (
                  <p className="mt-2 text-sm text-destructive">{documentError}</p>
                )}
                
                {/* Additional information about document upload */}
                <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
                  <h4 className="text-sm font-medium text-foreground mb-2">How it works:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Upload any supported document file</li>
                    <li>• AI will extract relevant information</li>
                    <li>• Form fields will be automatically filled</li>
                    <li>• You can edit any extracted data before creating</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-4 border-t border-border bg-muted/50 p-6">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create Initiative</Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateInitiativeModal;