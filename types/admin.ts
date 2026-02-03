/**
 * 🏛 Admin Data Models
 * Core entities for the multi-tenant education platform
 */

export interface University {
  id: string;
  name: string;
  logo?: string; // URL to logo image
  chairman_name: string;
  chairman_photo?: string; // URL to photo
  contact_numbers: string[]; // Array of phone numbers
  createdAt: string;
  updatedAt?: string;
}

export interface Branch {
  id: string;
  university_id: string; // Branches belong ONLY to universities
  name: string; // Full name (e.g., "Computer Science and Engineering")
  code: string; // Short code (e.g., "CSE", "ECE", "ME")
  description?: string; // Optional description
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface College {
  id: string;
  university_id: string; // Colleges belong to universities
  name: string;
  logo?: string; // URL to logo image
  chairman_name: string;
  chairman_photo?: string; // URL to photo
  contact_numbers: string[]; // Array of phone numbers
  offered_branches: string[]; // Array of branch IDs (subset of university branches)
  is_partnered: boolean; // White-label flag
  createdAt: string;
  updatedAt?: string;
}

// Form data types for creating/editing
export interface UniversityFormData {
  name: string;
  logo?: string;
  chairman_name: string;
  chairman_photo?: string;
  contact_numbers: string[];
}

export interface BranchFormData {
  university_id: string;
  name: string; // Full name (e.g., "Computer Science and Engineering")
  code: string; // Short code (e.g., "CSE", "ECE", "ME")
  description?: string; // Optional description
  status: 'active' | 'inactive';
}

export interface CollegeFormData {
  university_id: string;
  name: string;
  logo?: string;
  chairman_name: string;
  chairman_photo?: string;
  contact_numbers: string[];
  offered_branches: string[];
  is_partnered: boolean;
}

// Partner Context (for white-label behavior)
export interface PartnerContext {
  college: College | null;
  university: University | null;
  branches: Branch[]; // Only branches offered by this college
}

