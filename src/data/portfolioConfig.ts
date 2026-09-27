import type { PortfolioConfig } from '../types/portfolio';

/**
 * Primary editable profile, contact, education, and configuration for Yash Hogade.
 * Edit this file to update personal details, links, and paths across the entire portfolio.
 */
export const portfolioConfig: PortfolioConfig = {
  name: 'Yash Hogade',
  callsign: 'YASH — DIGITAL STUDIO',
  role: 'Full-Stack Developer',
  subRole: 'MERN Stack · B.E. Computer Engineering',
  tagline: 'Building clean, reliable web applications and practical digital products.',
  bio: 'I am Yash Hogade, a final-year Computer Engineering student at AISSMS COE (SPPU), Pune. I build full-stack web applications using React.js, Node.js, Express.js, and MongoDB, turning ideas into dependable digital products.',
  location: 'Pune, Maharashtra, India',
  
  education: {
    degree: 'B.E. in Computer Engineering',
    college: 'AISSMS College of Engineering',
    city: 'Pune',
    state: 'Maharashtra',
    university: 'Savitribai Phule Pune University (SPPU)',
    status: 'SPPU | CGPA: 7.81/10 (Expected 2027)',
    cgpa: '7.81 / 10',
    hsc: '74% · Abasaheb Vartak College',
    ssc: '88% · M.G. Parulekar Mitramandal School',
    focus: [
      'Data Structures & Algorithms',
      'Database Management Systems (MongoDB & MySQL)',
      'Object-Oriented Programming (C++)',
      'Operating Systems & Computer Networks',
      'Full-Stack MERN Engineering (React.js, Node.js, Express.js)'
    ]
  },

  socials: {
    github: 'https://github.com/yashcod21er',
    linkedin: 'https://linkedin.com/in/yash-hogade',
    email: 'yashhogade6@gmail.com',
    phone: '+91 7057327228'
  },

  // Path to your verified resume documents inside public/assets/
  resumePath: '/assets/Yash_Hogade_Resume.pdf',
  resumePreviewImage: '/assets/resume-preview.png',
  certification: 'Microsoft Certified: Azure AI Fundamentals (Issued: Aug 2026 | ID: w9Rn2-FahH)',

  systemVersion: 'v1.0.5',
  copyrightYear: 2026,
};
