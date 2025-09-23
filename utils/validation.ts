// Input validation utilities for security and data integrity

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please enter a valid email address');
  } else if (email.length > 254) {
    errors.push('Email is too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      errors.push('Password is too long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Name validation
export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name) {
    errors.push('Name is required');
  } else {
    if (name.length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    if (name.length > 100) {
      errors.push('Name is too long');
    }
    if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) {
      errors.push('Name can only contain letters, spaces, hyphens, apostrophes, and periods');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Initiative title validation
export const validateInitiativeTitle = (title: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!title) {
    errors.push('Title is required');
  } else {
    if (title.length < 3) {
      errors.push('Title must be at least 3 characters long');
    }
    if (title.length > 200) {
      errors.push('Title is too long');
    }
    if (title.trim() !== title) {
      errors.push('Title cannot start or end with whitespace');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Initiative description validation
export const validateInitiativeDescription = (description: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!description) {
    errors.push('Description is required');
  } else {
    if (description.length < 10) {
      errors.push('Description must be at least 10 characters long');
    }
    if (description.length > 5000) {
      errors.push('Description is too long');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Skills validation
export const validateSkills = (skills: string[]): ValidationResult => {
  const errors: string[] = [];
  
  if (!skills || skills.length === 0) {
    errors.push('At least one skill is required');
  } else {
    if (skills.length > 20) {
      errors.push('Too many skills (maximum 20)');
    }
    
    for (const skill of skills) {
      if (!skill || skill.trim().length === 0) {
        errors.push('Skills cannot be empty');
        break;
      }
      if (skill.length > 50) {
        errors.push('Each skill must be 50 characters or less');
        break;
      }
      if (!/^[a-zA-Z0-9\s\-_]+$/.test(skill)) {
        errors.push('Skills can only contain letters, numbers, spaces, hyphens, and underscores');
        break;
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Location validation
export const validateLocation = (location: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!location) {
    errors.push('Location is required');
  } else {
    if (location.length < 2) {
      errors.push('Location must be at least 2 characters long');
    }
    if (location.length > 100) {
      errors.push('Location is too long');
    }
    if (!/^[a-zA-Z\s\-',\.]+$/.test(location)) {
      errors.push('Location can only contain letters, spaces, hyphens, apostrophes, commas, and periods');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Weekly capacity validation
export const validateWeeklyCapacity = (capacity: number): ValidationResult => {
  const errors: string[] = [];
  
  if (capacity === undefined || capacity === null) {
    errors.push('Weekly capacity is required');
  } else {
    if (!Number.isInteger(capacity)) {
      errors.push('Weekly capacity must be a whole number');
    } else if (capacity < 1) {
      errors.push('Weekly capacity must be at least 1 hour');
    } else if (capacity > 80) {
      errors.push('Weekly capacity cannot exceed 80 hours');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Task title validation
export const validateTaskTitle = (title: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!title) {
    errors.push('Task title is required');
  } else {
    if (title.length < 3) {
      errors.push('Task title must be at least 3 characters long');
    }
    if (title.length > 200) {
      errors.push('Task title is too long');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Task description validation
export const validateTaskDescription = (description: string): ValidationResult => {
  const errors: string[] = [];
  
  if (description && description.length > 2000) {
    errors.push('Task description is too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Join request message validation
export const validateJoinRequestMessage = (message: string): ValidationResult => {
  const errors: string[] = [];
  
  if (message && message.length > 1000) {
    errors.push('Message is too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize HTML content
export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Sanitize text input
export const sanitizeText = (text: string): string => {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove angle brackets
};

// Validate file upload
export const validateFileUpload = (file: File, maxSize: number = 5 * 1024 * 1024): ValidationResult => {
  const errors: string[] = [];
  
  if (!file) {
    errors.push('File is required');
  } else {
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
    
    // Check file type for images
    if (file.type.startsWith('image/')) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        errors.push('Only JPEG, PNG, GIF, and WebP images are allowed');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
