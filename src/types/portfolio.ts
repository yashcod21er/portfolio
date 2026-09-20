export type SectionId = 'home' | 'about' | 'skills' | 'projects' | 'journey' | 'contact';

export type QualityTier = 'AUTO' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OFF';

export type ThemeMode = 'dark' | 'light';

export interface SocialLinks {
  github: string;
  linkedin: string;
  email: string;
}

export interface EducationInfo {
  degree: string;
  college: string;
  city: string;
  state: string;
  university: string;
  status: string;
  focus: string[];
}

export interface PortfolioConfig {
  name: string;
  callsign: string;
  role: string;
  subRole: string;
  tagline: string;
  bio: string;
  location: string;
  education: EducationInfo;
  socials: SocialLinks;
  resumePath: string;
  systemVersion: string;
  copyrightYear: number;
}

export type ProjectStatus = 'COMPLETED' | 'IN PROGRESS' | 'PLANNED';

export interface Project {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  problem: string;
  solution: string;
  features: string[];
  technologies: string[];
  status: ProjectStatus;
  github: string;
  demo?: string;
  image?: string;
  architectureHighlights?: string[];
  category: 'Full-Stack' | 'Frontend' | 'Systems & AI';
}

export interface SkillItem {
  name: string;
  category: string;
  tags?: string[];
}

export interface SkillCategory {
  id: string;
  name: string;
  tag: string;
  skills: SkillItem[];
  color: string;
}

export type MilestoneStatus = 'COMPLETED' | 'CURRENT' | 'FUTURE';

export interface JourneyMilestone {
  id: string;
  phase: string;
  title: string;
  institutionOrScope: string;
  description: string;
  technologies: string[];
  status: MilestoneStatus;
}
