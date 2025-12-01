import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface MultiSelectDropdownProps {
  options: string[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, selectedOptions, onChange, placeholder = "Select options" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleToggle = () => setIsOpen(!isOpen);
    
    const handleOptionToggle = (option: string) => {
        const newSelected = selectedOptions.includes(option)
          ? selectedOptions.filter(item => item !== option)
          : [...selectedOptions, option];
        onChange(newSelected);
    };

    const handleRemoveOption = (option: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent dropdown from opening
        onChange(selectedOptions.filter(item => item !== option));
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
          }
        };
    
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative mt-1" ref={dropdownRef}>
            <div onClick={handleToggle} className="flex min-h-[42px] flex-wrap items-center gap-2 rounded-md border border-input bg-card p-2 text-sm shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-background cursor-pointer">
                {selectedOptions.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
                {selectedOptions.map(option => (
                    <span key={option} className="flex items-center gap-1.5 rounded-full bg-muted py-0.5 pl-2 pr-1 font-medium text-muted-foreground">
                        {option}
                        <button
                            type="button"
                            onClick={(e) => handleRemoveOption(option, e)}
                            className="rounded-full text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground"
                            aria-label={`Remove ${option}`}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </span>
                ))}
                <ChevronDown className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg">
                  <ul className="max-h-60 overflow-y-auto p-1">
                    {options.map(option => (
                      <li key={option}>
                        <label className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-popover-foreground hover:bg-muted">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background"
                            checked={selectedOptions.includes(option)}
                            onChange={() => handleOptionToggle(option)}
                          />
                          <span>{option}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
            )}
        </div>
    );
}

export default MultiSelectDropdown;