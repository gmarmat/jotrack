export type Persona = 'recruiter' | 'hiring-manager' | 'peer';

export const PERSONAS: Persona[] = ['recruiter', 'hiring-manager', 'peer'];

export const PERSONA_LABELS: Record<Persona, string> = {
  'recruiter': 'Recruiter',
  'hiring-manager': 'Hiring Manager', 
  'peer': 'Peer'
};

export const PERSONA_ICONS: Record<Persona, string> = {
  'recruiter': '👥',
  'hiring-manager': '👔',
  'peer': '🤝'
};

export const PERSONA_DESCRIPTIONS: Record<Persona, string> = {
  'recruiter': 'Focuses on cultural fit and communication skills',
  'hiring-manager': 'Evaluates technical skills and team dynamics',
  'peer': 'Assesses collaboration and day-to-day working style'
};
