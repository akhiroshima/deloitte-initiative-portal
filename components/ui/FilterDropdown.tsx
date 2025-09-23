import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterDropdownProps {
  label: string;
  options: string[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, options, selectedOptions, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleOptionChange = (option: string) => {
    const newSelectedOptions = selectedOptions.includes(option)
      ? selectedOptions.filter(item => item !== option)
      : [...selectedOptions, option];
    onChange(newSelectedOptions);
  };

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

  const hasSelection = selectedOptions.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className={`flex items-center gap-1 rounded-md border  px-3 py-1.5 text-sm  transition-colors ${
            hasSelection 
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-input bg-card text-foreground hover:bg-muted'
        }`}
      >
        {label}
        {hasSelection && <span className="ml-1 rounded-full bg-primary px-2 text-xs text-primary-foreground">{selectedOptions.length}</span>}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-64 origin-top rounded-md border bg-popover text-popover-foreground shadow-lg animate-scaleIn">
          <ul className="max-h-60 overflow-y-auto p-1">
            {options.length > 0 ? options.map(option => (
              <li key={option}>
                <label className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-popover-foreground hover:bg-muted">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background"
                    checked={selectedOptions.includes(option)}
                    onChange={() => handleOptionChange(option)}
                  />
                  <span>{option}</span>
                </label>
              </li>
            )) :
                <li className="px-3 py-2 text-sm text-muted-foreground">No options available</li>
            }
          </ul>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;