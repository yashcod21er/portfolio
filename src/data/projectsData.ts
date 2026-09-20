import type { Project } from '../types/portfolio';

/**
 * Centralized list of projects for Yash Hogade.
 * Supports deep-linking via slug (e.g., /?project=airbnb-clone).
 * No fake metrics or unbuilt features are claimed.
 */
export const projectsData: Project[] = [
  {
    id: 'proj-1',
    slug: 'airbnb-clone',
    title: 'Airbnb Clone',
    tagline: 'Full-Stack Accommodation Platform Recreation',
    description: 'A web application inspired by accommodation booking platforms, built to practice full-stack web development and RESTful architecture.',
    category: 'Full-Stack',
    status: 'COMPLETED',
    technologies: ['Node.js', 'Express.js', 'EJS', 'REST API', 'Bootstrap', 'HTML', 'CSS'],
    github: 'https://github.com', // Replace with specific repository link
    demo: '#', // Replace with live demo if deployed
    image: '/projects/airbnb-preview.svg',
    problem: 'Understanding complete end-to-end full-stack web architecture: connecting server-side route controllers, dynamic database-backed templating, and REST conventions in an industry-standard format.',
    solution: 'Designed an Express.js server utilizing server-side EJS templating and RESTful endpoints to manage listing entries, user interactions, and responsive card layouts modeled after modern hospitality platforms.',
    features: [
      'Full CRUD functionality for accommodation listings',
      'Server-side rendering via EJS dynamic templates',
      'RESTful API routing architecture with Express.js',
      'Responsive design using Bootstrap grid system',
      'Error handling middleware for malformed requests'
    ],
    architectureHighlights: [
      'Model-View-Controller (MVC) architectural separation',
      'Parameterized route handling for individual listing queries',
      'Modular route handlers for clean code organization'
    ]
  },
  {
    id: 'proj-2',
    slug: 'spotify-clone',
    title: 'Spotify Clone',
    tagline: 'Interactive Music Streaming UI & Audio Player',
    description: 'A frontend recreation inspired by modern music streaming interfaces, focused on responsive UI development and frontend interactions.',
    category: 'Frontend',
    status: 'COMPLETED',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    github: 'https://github.com', // Replace with specific repository link
    demo: '#',
    image: '/projects/spotify-preview.svg',
    problem: 'Replicating intricate desktop-to-mobile responsive streaming layouts and managing dynamic DOM audio controls without relying on heavy frameworks.',
    solution: 'Engineered a pixel-precise, responsive frontend using pure HTML, modern CSS (Flexbox & Grid), and vanilla JavaScript to handle interactive playback states, playlists, and responsive navigation.',
    features: [
      'Interactive audio playback controls (Play, Pause, Next, Previous)',
      'Responsive navigation drawer and sticky audio playback bar',
      'Dynamic track listing cards with hover glow states',
      'Custom styled seekbar and volume slider interactions',
      'Fluid mobile-first responsive layout transitions'
    ],
    architectureHighlights: [
      'Vanilla DOM manipulation for lightweight, instant responsiveness',
      'CSS custom properties for sleek dark streaming theme',
      'Custom event listeners for media state synchronization'
    ]
  },
  {
    id: 'proj-3',
    slug: 'recipehub',
    title: 'RecipeHub',
    tagline: 'Interactive Recipe Discovery & Culinary Showcase',
    description: 'A web project focused on discovering and presenting culinary recipes through an interactive web interface with intuitive search and filtering.',
    category: 'Frontend',
    status: 'IN PROGRESS',
    technologies: ['React', 'JavaScript', 'Tailwind CSS', 'REST API'],
    github: 'https://github.com',
    demo: '#',
    image: '/projects/recipehub-preview.svg',
    problem: 'Providing an intuitive, distraction-free interface for browsing culinary recipes with dietary categorization and real-time search filtering.',
    solution: 'Currently developing a modular component-driven interface allowing users to explore recipes, view step-by-step instructions, and filter by ingredients or dietary preferences.',
    features: [
      'Interactive recipe search and multi-category filtering (In Progress)',
      'Step-by-step cooking guide view with ingredient check-offs',
      'Responsive grid layout with high-contrast culinary cards',
      'Preparation time, servings, and difficulty tag indicators'
    ],
    architectureHighlights: [
      'Component-based UI state management',
      'Optimized client-side search filtering algorithms'
    ]
  },
  {
    id: 'proj-4',
    slug: 'ai-stock-market',
    title: 'AI Stock Market Intelligence',
    tagline: 'Algorithmic Financial Analysis & Trend Visualizer',
    description: 'A planned engineering project exploring financial market data retrieval, algorithmic indicators, and predictive time-series visualization.',
    category: 'Systems & AI',
    status: 'PLANNED',
    technologies: ['Python', 'JavaScript', 'REST APIs', 'Data Visualization', 'SQL'],
    github: 'https://github.com',
    image: '/projects/aimarket-preview.svg',
    problem: 'Making complex stock price movements and technical indicators digestible through clean visual charts and automated statistical summaries.',
    solution: 'Architecting an analytical dashboard integrating market data feeds, moving average computation, and statistical trend breakdowns.',
    features: [
      'Historical price chart integration with technical indicators (Planned)',
      'Algorithmic trend signal calculation',
      'Configurable stock watchlist and comparative analysis view'
    ],
    architectureHighlights: [
      'Planned API pipeline for fetching real-time financial quotes',
      'Optimized time-series plotting using canvas-based rendering'
    ]
  }
];
