import type { JourneyMilestone } from '../types/portfolio';

/**
 * Authentic milestones tracking Yash's engineering trajectory.
 * Editable without breaking timeline components.
 */
export const journeyData: JourneyMilestone[] = [
  {
    id: 'milestone-1',
    phase: 'FOUNDATION',
    title: 'Computer Engineering Degree',
    institutionOrScope: 'AISSMS College of Engineering, Pune',
    description: 'Admitted into the Bachelor of Engineering in Computer Engineering program. Mastered foundational core computer science subjects including Data Structures & Algorithms, Object-Oriented Programming with C++, Operating Systems, and Database Management Systems.',
    technologies: ['C++', 'Data Structures', 'Algorithms', 'DBMS', 'OS'],
    status: 'COMPLETED'
  },
  {
    id: 'milestone-2',
    phase: 'WEB CORE',
    title: 'Frontend Foundations & UI Systems',
    institutionOrScope: 'Self-Directed & Academic Projects',
    description: 'Built deep competency in modern web interfaces, beginning with semantic HTML5, modern CSS layouts (Flexbox, CSS Grid), responsive design patterns, and accessible design principles.',
    technologies: ['HTML5', 'CSS3', 'Bootstrap', 'Responsive Web Design'],
    status: 'COMPLETED'
  },
  {
    id: 'milestone-3',
    phase: 'INTERACTIVITY',
    title: 'JavaScript & Interactive Web Engineering',
    institutionOrScope: 'Web Applications Practice',
    description: 'Deepened mastery of asynchronous JavaScript, DOM manipulation, ES6+ conventions, API consumption, and event-driven architecture. Successfully engineered interactive frontends like the Spotify Clone.',
    technologies: ['JavaScript ES6+', 'Async / Await', 'DOM Manipulation', 'REST Consuming'],
    status: 'COMPLETED'
  },
  {
    id: 'milestone-4',
    phase: 'BACKEND',
    title: 'Backend Runtimes & Server Architecture',
    institutionOrScope: 'Full-Stack Development Focus',
    description: 'Transitioned from client-only development into server architecture using Node.js and Express. Mastered RESTful API design, middleware patterns, routing, and dynamic server-side rendering with EJS.',
    technologies: ['Node.js', 'Express.js', 'REST APIs', 'EJS Templating'],
    status: 'COMPLETED'
  },
  {
    id: 'milestone-5',
    phase: 'PRODUCTION',
    title: 'Full-Stack Web Applications',
    institutionOrScope: 'Portfolio Projects',
    description: 'Synthesized frontend and backend skills into cohesive production-ready web apps, including an Airbnb accommodation platform clone with complete CRUD capabilities, responsive layouts, and robust route controllers.',
    technologies: ['Full-Stack', 'Express', 'MVC Architecture', 'Bootstrap', 'Node.js'],
    status: 'COMPLETED'
  },
  {
    id: 'milestone-6',
    phase: 'CURRENT FOCUS',
    title: 'React Ecosystem & Advanced Interactive Systems',
    institutionOrScope: 'Final Year Engineering & Modern Web Projects',
    description: 'Developing RecipeHub with modern React component architecture while exploring 3D interactive graphics (Three.js / React Three Fiber) and real-time algorithmic analysis for planned stock intelligence tooling.',
    technologies: ['React', 'Three.js', 'Tailwind CSS', 'State Management'],
    status: 'CURRENT'
  },
  {
    id: 'milestone-7',
    phase: 'HORIZON',
    title: 'Professional Software Engineering',
    institutionOrScope: 'Industry Contribution',
    description: 'Aiming to bring strong computer engineering fundamentals, high curiosity, and full-stack web engineering skills to impactful software engineering teams and high-scale digital products.',
    technologies: ['Scalable Systems', 'Cloud Services', 'Production Engineering'],
    status: 'FUTURE'
  }
];
