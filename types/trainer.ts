export interface TrainerProfile {
  id: string;
  userId: string;
  displayName: string;
  email?: string;
  bio?: string;
  credentials?: string; // e.g., "AWS Certified Cloud Practitioner, Solutions Architect, Developer"
  specialties?: string[]; // Areas of expertise
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

