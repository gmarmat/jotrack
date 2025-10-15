// v2.7: Resume extraction to 3 variants

import type { IExtractor, VariantSet, NormalizedResume } from '../types';

export class ResumeExtractor implements IExtractor {
  async extract(sourceId: string, rawText: string): Promise<VariantSet> {
    // For now, use simple extraction (TODO: Replace with AI extraction)
    const normalized = await this.extractResumeData(rawText);

    return {
      // Variant 1: UI - Lightweight for display
      ui: {
        summary: normalized.summary.substring(0, 200) + '...',
        keyHighlights: normalized.experience.slice(0, 3).map((e) => e.highlights[0] || e.role),
        topSkills: normalized.skills.technical.slice(0, 5),
        totalYears: normalized.totalYearsExperience,
      },

      // Variant 2: AI-optimized - Token-efficient for AI analysis
      ai_optimized: {
        skills: normalized.skills,
        experience: normalized.experience.map((e) => ({
          role: e.role,
          company: e.company,
          duration: e.duration,
          keyAchievements: e.highlights.slice(0, 2), // Top 2 only
          technologies: e.technologies,
        })),
        education: normalized.education,
        summary: normalized.summary,
        certifications: normalized.certifications,
        totalYears: normalized.totalYearsExperience,
      },

      // Variant 3: Detailed - Complete extraction
      detailed: normalized,
    };
  }

  /**
   * Extract structured resume data (simple version - will be replaced with AI)
   */
  private async extractResumeData(rawText: string): Promise<NormalizedResume> {
    // Simple extraction logic (placeholder)
    // TODO: Replace with AI extraction call
    
    const lines = rawText.split('\n').filter((l) => l.trim());
    
    // Basic skill extraction (look for common patterns)
    const skills = this.extractSkills(rawText);
    
    // Extract experience (simplified)
    const experience = this.extractExperience(rawText);
    
    // Extract education
    const education = this.extractEducation(rawText);
    
    return {
      summary: this.generateSummary(rawText),
      skills,
      experience,
      education,
      certifications: this.extractCertifications(rawText),
      totalYearsExperience: this.calculateTotalYears(experience),
      industryExperience: this.extractIndustries(experience),
    };
  }

  private generateSummary(text: string): string {
    // Take first 2-3 sentences or first paragraph
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    return sentences.slice(0, 3).join('. ') + '.';
  }

  private extractSkills(text: string): { technical: string[]; soft: string[] } {
    const commonTechSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js', 'AWS', 'Docker',
      'SQL', 'MongoDB', 'GraphQL', 'REST', 'API', 'Git', 'CI/CD', 'Kubernetes', 'Django',
      'Flask', 'Vue', 'Angular', 'Next.js', 'Express', 'PostgreSQL', 'Redis', 'Kafka'
    ];
    
    const commonSoftSkills = [
      'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration',
      'Time Management', 'Critical Thinking', 'Adaptability', 'Creativity'
    ];

    const textLower = text.toLowerCase();
    
    const technical = commonTechSkills.filter((skill) =>
      textLower.includes(skill.toLowerCase())
    );
    
    const soft = commonSoftSkills.filter((skill) =>
      textLower.includes(skill.toLowerCase())
    );

    return { technical, soft };
  }

  private extractExperience(text: string): NormalizedResume['experience'] {
    // Simplified extraction - look for patterns like "Software Engineer at Company"
    const experiences: NormalizedResume['experience'] = [];
    
    // Look for common job title patterns
    const experienceRegex = /(Software|Senior|Lead|Principal|Engineer|Developer|Manager|Director|Analyst|Designer|Architect|Specialist)[^@\n]+ at ([A-Z][a-zA-Z\s&,]+)/gi;
    const matches = [...text.matchAll(experienceRegex)];
    
    for (const match of matches.slice(0, 5)) {
      experiences.push({
        role: match[0].split(' at ')[0].trim(),
        company: match[0].split(' at ')[1].trim(),
        duration: '2+ years', // Placeholder
        highlights: ['Key responsibility or achievement'],
        technologies: [],
      });
    }

    // If no matches, create a generic entry
    if (experiences.length === 0) {
      experiences.push({
        role: 'Professional Experience',
        company: 'Various',
        duration: '3+ years',
        highlights: ['Professional experience in the field'],
        technologies: [],
      });
    }

    return experiences;
  }

  private extractEducation(text: string): NormalizedResume['education'] {
    const education: NormalizedResume['education'] = [];
    
    // Look for degree patterns
    const degreeRegex = /(Bachelor|Master|PhD|BS|MS|MBA|BA|MA)[^@\n]+ (from|at) ([A-Z][a-zA-Z\s&,]+)/gi;
    const matches = [...text.matchAll(degreeRegex)];
    
    for (const match of matches) {
      education.push({
        degree: match[0].split(/from|at/i)[0].trim(),
        institution: match[0].split(/from|at/i)[1].trim(),
        year: '2020', // Placeholder
      });
    }

    return education;
  }

  private extractCertifications(text: string): string[] {
    const certifications: string[] = [];
    const commonCerts = ['AWS', 'PMP', 'Certified', 'Certificate'];
    
    const textLower = text.toLowerCase();
    for (const cert of commonCerts) {
      if (textLower.includes(cert.toLowerCase())) {
        certifications.push(cert);
      }
    }
    
    return certifications;
  }

  private calculateTotalYears(experience: NormalizedResume['experience']): number {
    // Simplified - count number of experiences * 2 years
    return Math.min(experience.length * 2, 15);
  }

  private extractIndustries(experience: NormalizedResume['experience']): string[] {
    // Common industry keywords
    const industries = new Set<string>();
    const industryKeywords = [
      'FinTech', 'Healthcare', 'E-commerce', 'SaaS', 'Enterprise',
      'Startup', 'Consulting', 'EdTech', 'MarTech', 'AdTech'
    ];

    const textLower = experience.map((e) => e.company.toLowerCase()).join(' ');
    
    for (const keyword of industryKeywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        industries.add(keyword);
      }
    }

    return Array.from(industries);
  }
}

