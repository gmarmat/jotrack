// v2.7: Extraction system types

import type { VariantType, SourceType } from '@/db/schema';

export type { VariantType, SourceType };

export interface ExtractionResult {
  variantId: string;
  content: any; // JSON object
  tokenCount: number;
  contentHash: string;
}

export interface VariantSet {
  ui: any;
  ai_optimized: any;
  detailed: any;
}

export interface IExtractor {
  extract(sourceId: string, rawContent: string): Promise<VariantSet>;
}

// Normalized schemas for different content types

export interface NormalizedResume {
  summary: string;
  skills: {
    technical: string[];
    soft: string[];
  };
  experience: Array<{
    role: string;
    company: string;
    duration: string;
    startDate?: string;
    endDate?: string;
    highlights: string[];
    technologies: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  certifications: string[];
  totalYearsExperience: number;
  industryExperience: string[];
}

export interface NormalizedJD {
  role: string;
  company: string;
  location: string;
  salaryRange?: string;
  requirements: {
    technical: Array<{
      skill: string;
      required: boolean;
      years?: number;
    }>;
    soft: string[];
    education: string[];
    certifications: string[];
  };
  responsibilities: string[];
  niceToHave: string[];
  companyInfo: {
    industry: string;
    size?: string;
    stage?: string;
    culture: string[];
  };
}

export interface NormalizedPeopleProfile {
  name: string;
  title: string;
  company: string;
  location?: string;
  previousRoles: Array<{
    role: string;
    company: string;
    years: number;
    highlights?: string[];
  }>;
  education?: string;
  totalYearsExperience: number;
  expertise: string[];
  interests: string[];
  communicationStyle: string;
  recentActivity?: Array<{
    type: 'post' | 'article' | 'share';
    content: string;
    date: string;
  }>;
  commonalities: {
    sharedCompanies: string[];
    sharedSchools: string[];
    sharedInterests: string[];
    mutualConnections?: number;
  };
}

export interface ExtractionOptions {
  priority?: number;
  async?: boolean;
  model?: string;
}

