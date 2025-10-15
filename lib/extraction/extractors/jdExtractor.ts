// v2.7: Job Description extraction to 3 variants

import type { IExtractor, VariantSet, NormalizedJD } from '../types';

export class JDExtractor implements IExtractor {
  async extract(sourceId: string, rawText: string): Promise<VariantSet> {
    // For now, use simple extraction (TODO: Replace with AI extraction)
    const normalized = await this.extractJDData(rawText);

    return {
      // Variant 1: UI - Lightweight for display
      ui: {
        role: normalized.role,
        company: normalized.company,
        location: normalized.location,
        keyRequirements: normalized.requirements.technical.slice(0, 5).map((r) => r.skill),
        topResponsibilities: normalized.responsibilities.slice(0, 3),
      },

      // Variant 2: AI-optimized - Token-efficient for AI analysis
      ai_optimized: {
        role: normalized.role,
        company: normalized.company,
        requirements: {
          technical: normalized.requirements.technical,
          soft: normalized.requirements.soft,
          education: normalized.requirements.education,
        },
        responsibilities: normalized.responsibilities,
        companyInfo: normalized.companyInfo,
      },

      // Variant 3: Detailed - Complete extraction
      detailed: normalized,
    };
  }

  /**
   * Extract structured JD data (simple version - will be replaced with AI)
   */
  private async extractJDData(rawText: string): Promise<NormalizedJD> {
    // Simple extraction logic (placeholder)
    // TODO: Replace with AI extraction call

    return {
      role: this.extractRole(rawText),
      company: this.extractCompany(rawText),
      location: this.extractLocation(rawText),
      salaryRange: this.extractSalary(rawText),
      requirements: this.extractRequirements(rawText),
      responsibilities: this.extractResponsibilities(rawText),
      niceToHave: this.extractNiceToHave(rawText),
      companyInfo: this.extractCompanyInfo(rawText),
    };
  }

  private extractRole(text: string): string {
    // Look for common job title patterns at the beginning
    const titlePatterns = [
      /(?:Position|Role|Title):\s*([^\n]+)/i,
      /^([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Director|Lead|Analyst|Designer|Specialist|Architect))/m,
    ];

    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'Software Engineer'; // Default
  }

  private extractCompany(text: string): string {
    // Look for company name patterns
    const companyPatterns = [
      /(?:Company|Organization):\s*([^\n]+)/i,
      /at ([A-Z][a-zA-Z\s&,]+)(?:\s+is|,|\.|$)/,
    ];

    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'Company Name'; // Placeholder
  }

  private extractLocation(text: string): string {
    const locationPatterns = [
      /(?:Location|Based in):\s*([^\n]+)/i,
      /(Remote|Hybrid|On-site)/i,
      /(San Francisco|New York|Seattle|Austin|Boston|Los Angeles)/i,
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'Location not specified';
  }

  private extractSalary(text: string): string | undefined {
    const salaryPattern = /\$\d{2,3}[,kK]?\s*-\s*\$?\d{2,3}[,kK]?/;
    const match = text.match(salaryPattern);
    return match ? match[0] : undefined;
  }

  private extractRequirements(text: string): NormalizedJD['requirements'] {
    const technical: NormalizedJD['requirements']['technical'] = [];
    const soft: string[] = [];

    // Extract technical skills
    const techSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js', 'AWS', 'Docker',
      'SQL', 'MongoDB', 'GraphQL', 'REST API', 'Git', 'CI/CD', 'Kubernetes', 'Django',
      'Flask', 'Vue', 'Angular', 'Next.js', 'PostgreSQL', 'Redis'
    ];

    const textLower = text.toLowerCase();
    
    for (const skill of techSkills) {
      if (textLower.includes(skill.toLowerCase())) {
        // Check if it's required or nice-to-have
        const required = this.isRequired(text, skill);
        const years = this.extractYearsForSkill(text, skill);
        
        technical.push({
          skill,
          required,
          years,
        });
      }
    }

    // Extract soft skills
    const softSkillKeywords = [
      'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration',
      'Time Management', 'Critical Thinking', 'Adaptability', 'Self-starter'
    ];

    for (const skill of softSkillKeywords) {
      if (textLower.includes(skill.toLowerCase())) {
        soft.push(skill);
      }
    }

    // Extract education requirements
    const education: string[] = [];
    if (/bachelor|bs|ba/i.test(text)) education.push("Bachelor's degree");
    if (/master|ms|ma|mba/i.test(text)) education.push("Master's degree");

    return {
      technical,
      soft,
      education,
      certifications: [],
    };
  }

  private isRequired(text: string, skill: string): boolean {
    // Look for "required" near the skill mention
    const skillIndex = text.toLowerCase().indexOf(skill.toLowerCase());
    if (skillIndex === -1) return false;

    const context = text.substring(Math.max(0, skillIndex - 100), skillIndex + 100).toLowerCase();
    return context.includes('required') || context.includes('must have');
  }

  private extractYearsForSkill(text: string, skill: string): number | undefined {
    const skillIndex = text.toLowerCase().indexOf(skill.toLowerCase());
    if (skillIndex === -1) return undefined;

    const context = text.substring(Math.max(0, skillIndex - 50), skillIndex + 50);
    const yearsMatch = context.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    
    return yearsMatch ? parseInt(yearsMatch[1]) : undefined;
  }

  private extractResponsibilities(text: string): string[] {
    const responsibilities: string[] = [];
    
    // Look for bullet points or numbered lists
    const bulletPattern = /^[\s]*[•\-\*]\s*(.+)$/gm;
    const matches = [...text.matchAll(bulletPattern)];
    
    for (const match of matches.slice(0, 10)) {
      const resp = match[1].trim();
      if (resp.length > 20 && resp.length < 200) {
        responsibilities.push(resp);
      }
    }

    // If no bullets found, extract sentences that look like responsibilities
    if (responsibilities.length === 0) {
      const sentences = text.split(/[.!?]+/);
      for (const sentence of sentences) {
        if (sentence.length > 30 && sentence.length < 200 &&
            /(?:build|develop|design|manage|lead|create|implement|collaborate)/i.test(sentence)) {
          responsibilities.push(sentence.trim());
          if (responsibilities.length >= 5) break;
        }
      }
    }

    return responsibilities;
  }

  private extractNiceToHave(text: string): string[] {
    const niceToHave: string[] = [];
    
    // Look for "nice to have", "bonus", "preferred" sections
    const niceToHaveSection = text.match(/(?:nice to have|bonus|preferred|plus)[:\s]+([\s\S]+?)(?:\n\n|$)/i);
    
    if (niceToHaveSection) {
      const bullets = niceToHaveSection[1].match(/[•\-\*]\s*(.+)/g) || [];
      for (const bullet of bullets.slice(0, 5)) {
        niceToHave.push(bullet.replace(/[•\-\*]\s*/, '').trim());
      }
    }

    return niceToHave;
  }

  private extractCompanyInfo(text: string): NormalizedJD['companyInfo'] {
    const textLower = text.toLowerCase();
    
    // Extract industry
    const industries = ['FinTech', 'Healthcare', 'E-commerce', 'SaaS', 'Enterprise', 'Startup', 'EdTech'];
    let industry = 'Technology';
    for (const ind of industries) {
      if (textLower.includes(ind.toLowerCase())) {
        industry = ind;
        break;
      }
    }

    // Extract company size
    let size: string | undefined;
    if (textLower.includes('startup') || /\b(?:10|20|30)-(?:50|100)\b/.test(text)) {
      size = 'Startup (10-100)';
    } else if (/\b100-500\b/.test(text)) {
      size = 'Mid-size (100-500)';
    } else if (/\b500\+|1000\+|enterprise\b/i.test(text)) {
      size = 'Enterprise (500+)';
    }

    // Extract stage (for startups)
    let stage: string | undefined;
    if (/series [a-d]/i.test(text)) {
      const stageMatch = text.match(/series ([a-d])/i);
      stage = stageMatch ? `Series ${stageMatch[1].toUpperCase()}` : undefined;
    }

    // Extract culture keywords
    const culture: string[] = [];
    const cultureKeywords = [
      'Fast-paced', 'Innovative', 'Collaborative', 'Remote-friendly',
      'Work-life balance', 'Diverse', 'Inclusive', 'Agile'
    ];
    
    for (const keyword of cultureKeywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        culture.push(keyword);
      }
    }

    return {
      industry,
      size,
      stage,
      culture,
    };
  }
}

