import type { SkillCategory } from '../types/portfolio';

/**
 * Authentic technical skills grouped into 5 clear engineering domains.
 * No arbitrary percentages or unverified proficiencies.
 */
export const skillsData: SkillCategory[] = [
  {
    id: 'frontend',
    name: 'Frontend Development',
    tag: 'UI / UX & Client Architecture',
    color: '#39DFFF', // Electric Cyan
    skills: [
      { name: 'HTML5', category: 'Frontend', tags: ['Semantic', 'Accessibility'] },
      { name: 'CSS3', category: 'Frontend', tags: ['Flexbox', 'Grid', 'Animations'] },
      { name: 'JavaScript', category: 'Frontend', tags: ['ES6+', 'Async/Await', 'DOM'] },
      { name: 'React', category: 'Frontend', tags: ['Hooks', 'State', 'Components'] },
      { name: 'Bootstrap', category: 'Frontend', tags: ['Responsive', 'Grid System'] },
    ]
  },
  {
    id: 'backend',
    name: 'Backend Architecture',
    tag: 'Server Runtimes & Web APIs',
    color: '#9B7BFF', // Violet
    skills: [
      { name: 'Node.js', category: 'Backend', tags: ['Runtime', 'Event Loop'] },
      { name: 'Express.js', category: 'Backend', tags: ['Routing', 'Middleware'] },
      { name: 'REST APIs', category: 'Backend', tags: ['HTTP', 'CRUD', 'Endpoints'] },
      { name: 'EJS', category: 'Backend', tags: ['Server Templates', 'SSR'] },
    ]
  },
  {
    id: 'database',
    name: 'Database Management',
    tag: 'Data Modeling & Persistence',
    color: '#38BDF8', // Cyan-Blue
    skills: [
      { name: 'MongoDB', category: 'Database', tags: ['NoSQL', 'Document Store'] },
      { name: 'MySQL', category: 'Database', tags: ['Relational', 'Schemas'] },
      { name: 'SQL', category: 'Database', tags: ['Queries', 'Joins', 'Indexes'] },
    ]
  },
  {
    id: 'programming',
    name: 'Programming Fundamentals',
    tag: 'Core Languages & Algorithms',
    color: '#A855F7', // Deep Violet
    skills: [
      { name: 'C++', category: 'Programming', tags: ['OOP', 'Memory', 'DSA'] },
      { name: 'JavaScript', category: 'Programming', tags: ['Functional', 'Prototypal'] },
      { name: 'SQL', category: 'Programming', tags: ['Data Manipulation'] },
    ]
  },
  {
    id: 'tools',
    name: 'Developer Toolchain',
    tag: 'Workflow, Versioning & Testing',
    color: '#67E8F9', // Sky Cyan
    skills: [
      { name: 'Git', category: 'Tools', tags: ['Version Control', 'Branching'] },
      { name: 'GitHub', category: 'Tools', tags: ['Collaboration', 'Repositories'] },
      { name: 'VS Code', category: 'Tools', tags: ['IDE', 'Debugging'] },
      { name: 'Postman', category: 'Tools', tags: ['API Testing', 'Collections'] },
      { name: 'Figma', category: 'Tools', tags: ['Wireframing', 'UI Design'] },
      { name: 'npm', category: 'Tools', tags: ['Package Management'] },
    ]
  }
];
