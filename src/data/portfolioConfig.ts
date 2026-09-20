import type { PortfolioConfig } from '../types/portfolio';

/**
 * Primary editable profile, contact, education, and configuration for Yash Hogade.
 * Edit this file to update personal details, links, and paths across the entire portfolio.
 */
export const portfolioConfig: PortfolioConfig = {
  name: 'Yash Hogade',
  callsign: 'YASH.OS',
  role: 'Computer Engineering Student',
  subRole: 'Full-Stack Developer',
  tagline: 'I build interactive digital experiences and full-stack applications.',
  bio: 'I am Yash Hogade, a final-year Computer Engineering student at AISSMS College of Engineering, Pune. I enjoy building modern web applications, exploring full-stack development, and turning ideas into practical digital products.',
  location: 'Pune, Maharashtra, India',
  
  education: {
    degree: 'BE in Computer Engineering (Final Year)',
    college: 'AISSMS College of Engineering',
    city: 'Pune',
    state: 'Maharashtra',
    university: 'Savitribai Phule Pune University',
    status: 'Final Year Student (Expected 2026)',
    focus: [
      'Data Structures & Algorithms',
      'Object-Oriented Programming (C++)',
      'Database Management Systems (SQL & NoSQL)',
      'Computer Networks & Web Systems',
      'Full-Stack Application Engineering'
    ]
  },

  // Update these URLs with your actual profile links
  socials: {
    github: 'https://github.com', // Replace with your actual GitHub URL e.g. https://github.com/yashhogade
    linkedin: 'https://linkedin.com', // Replace with your actual LinkedIn URL e.g. https://linkedin.com/in/yashhogade
    email: 'yashhogade.dev@gmail.com' // Replace with your actual contact email
  },

  // Path to your resume inside public/assets/
  resumePath: '/assets/Yash_Hogade_Resume.pdf',

  systemVersion: 'v1.0.4',
  copyrightYear: 2026,
};
