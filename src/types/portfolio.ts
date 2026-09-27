export type SectionId = 'home' | 'about' | 'skills' | 'projects' | 'journey' | 'contact';

export type AppView = 'portfolio' | 'journey';

export type QualityTier = 'AUTO' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OFF';

export interface JourneyCameraConfig {
  offset: [number, number, number];
  lookAtOffset: [number, number, number];
  fov?: number;
}

export interface JourneyStation {
  id: string;
  slug: string;
  index: number;
  numberStr: string;
  district: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  skills: string[];
  routeProgress: number; // 0.0 to 1.0 along the road spline
  worldPosition: [number, number, number];
  accent: string;
  camera: JourneyCameraConfig;
  status: 'COMPLETED' | 'CURRENT' | 'FUTURE';
}

export interface JourneyProjectLink {
  slug: string;
  title: string;
  tagline: string;
  category: string;
  technologies: string[];
}

export type ThemeMode = 'dark' | 'light';

export interface SocialLinks {
  github: string;
  linkedin: string;
  email: string;
  phone?: string;
}

export interface EducationInfo {
  degree: string;
  college: string;
  city: string;
  state: string;
  university: string;
  status: string;
  cgpa?: string;
  hsc?: string;
  ssc?: string;
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
  resumePreviewImage?: string;
  certification?: string;
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
  timeline?: string;
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
