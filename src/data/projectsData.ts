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
    title: 'UrbanStay (Airbnb Clone)',
    tagline: 'Full-Stack Accommodation Platform & Marketplace',
    description: 'An accommodation booking platform named UrbanStay, built with responsive category filtering, detailed stay cards, and dynamic RESTful route controllers.',
    category: 'Full-Stack',
    status: 'COMPLETED',
    technologies: ['Node.js', 'Express.js', 'EJS', 'REST API', 'Bootstrap', 'HTML', 'CSS'],
    github: 'https://github.com/yashcod21er',
    demo: 'https://major-project-q25u.onrender.com',
    image: '/projects/airbnb-preview.png',
    problem: 'Understanding complete end-to-end full-stack web architecture: connecting server-side route controllers, dynamic database-backed templating, and REST conventions in an industry-standard format.',
    solution: 'Designed an Express.js server utilizing server-side EJS templating and RESTful endpoints to manage listing entries, user interactions, and responsive card layouts modeled after modern hospitality platforms.',
    features: [
      'Full CRUD functionality for accommodation listings',
      'Dynamic category filters (Beach, Mountain, Luxury, Camping)',
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
    description: 'A dark-mode frontend recreation inspired by Spotify, featuring dynamic playback controls, interactive song playlists, responsive sidebar navigation, and custom audio seekbars.',
    category: 'Frontend',
    status: 'COMPLETED',
    technologies: ['HTML5', 'CSS3', 'JavaScript', 'Web Audio API', 'DOM Manipulation'],
    github: 'https://github.com/yashcod21er',
    demo: '#',
    image: '/projects/spotify-preview.png',
    problem: 'Replicating intricate desktop-to-mobile responsive streaming layouts and managing dynamic DOM audio controls without relying on heavy frameworks.',
    solution: 'Engineered a pixel-precise, responsive frontend using pure HTML, modern CSS (Flexbox & Grid), and vanilla JavaScript to handle interactive playback states, playlists, and responsive navigation.',
    features: [
      'Interactive audio playback controls (Play, Pause, Next, Previous)',
      'Responsive navigation drawer and sticky audio playback bar',
      'Curated sections for Top 50 Global and Trending Now Near You',
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
    slug: 'zerodha-clone',
    title: 'Zerodha Clone',
    tagline: 'Full-Stack Investment & Trading Dashboard Recreation',
    description: "An investment and trading platform recreation modeled after Zerodha's Kite and Console platforms, featuring portfolio analytics, holdings breakdown, and clean financial visualization.",
    category: 'Full-Stack',
    status: 'COMPLETED',
    technologies: ['React', 'Node.js', 'Express.js', 'MongoDB', 'Chart.js', 'REST API', 'Tailwind CSS'],
    github: 'https://github.com/yashcod21er',
    demo: 'https://zerodha-clone-1-j33u.onrender.com',
    image: '/projects/zerodha-preview.png',
    problem: 'Building an uncluttered, high-density financial dashboard displaying multi-asset portfolios, real-time unrealized P&L, holdings distribution, and stock market watchlists.',
    solution: "Developed a component-driven investment platform replicating Zerodha's clean minimalist aesthetic, featuring interactive portfolio charts, asset allocation breakdowns, and account management.",
    features: [
      'Clean minimalist landing page and trading dashboard',
      'Holdings & equity distribution charts with P&L tracking',
      'Market watchlists and commodity position summaries',
      'Interactive navigation between Coin, Kite, and Console views',
      'Responsive financial charts and data visualization'
    ],
    architectureHighlights: [
      'Component-driven state management for portfolio analytics',
      'RESTful API integration for stock quotes and asset distribution',
      'Modular financial widget architecture'
    ]
  },
  {
    id: 'proj-4',
    slug: 'nexa-ai',
    title: 'NexaAI',
    tagline: 'AI Conversational Assistant & Intelligent Agent',
    description: 'An AI-driven conversational agent engineered with real-time prompt streaming, dynamic session chat history, and contextual natural language processing.',
    category: 'Full-Stack',
    status: 'COMPLETED',
    technologies: ['React.js', 'Node.js', 'JavaScript (ES6+)', 'AI/ML APIs', 'REST APIs', 'Tailwind CSS'],
    github: 'https://github.com/yashcod21er',
    demo: '#',
    image: '/projects/nexa-ai-preview.png',
    problem: 'Delivering low-latency conversational responses with dynamic token streaming while managing session-based conversation context, state persistence, and responsive UI layout.',
    solution: 'Engineered an interactive conversational assistant in React.js and Node.js. Integrated backend AI API endpoints to stream contextual replies in real-time, maintain clean session histories, and render formatted markdown and code blocks.',
    features: [
      'Real-time prompt streaming with smooth token-by-token rendering',
      'Dynamic conversation history sidebar with instant session switching',
      'Context-aware natural language processing via backend API integration',
      'Syntax-highlighted code output with one-click copy and formatting',
      'Prompt quick-action chips for code analysis, summarization, and brainstorming',
      'Responsive modern dark-mode interface with mobile navigation drawer'
    ],
    architectureHighlights: [
      'Node.js backend proxy handling API queries and stream forwarding',
      'React state management for real-time stream buffers and conversation history',
      'Clean separation of chat UI components and API communication layers'
    ]
  }
];
