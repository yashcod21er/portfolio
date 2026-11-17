import { portfolioConfig as cfg } from '../../data/portfolioConfig';
import { projectsData } from '../../data/projectsData';
import { skillsData } from '../../data/skillsData';
import { useSound } from '../../lib/sound';
import { CHAPTERS, type ChapterId } from '../../world/layout';
import { prettyUrl } from './clipboard';

/**
 * The palette's terminal: a pure command interpreter. It returns text lines plus an
 * optional side effect, which the CommandPalette component carries out.
 * Every fact printed here comes from src/data/*.
 */

export type TermTone = 'in' | 'out' | 'dim' | 'accent' | 'err';
export type TermOut = [TermTone, string];

export type TermEffect =
  | { type: 'clear' }
  | { type: 'exit' }
  | { type: 'project'; slug: string }
  | { type: 'url'; href: string }
  | { type: 'mailto'; href: string }
  | { type: 'sound'; on: boolean }
  | { type: 'goto'; id: ChapterId };

export interface TermResult {
  lines: TermOut[];
  effect?: TermEffect;
}

export const PROMPT = 'guest@hogade:~$';

const COMMANDS: Array<[string, string]> = [
  ['help', 'list available commands'],
  ['whoami', 'who is this'],
  ['about', 'a short bio'],
  ['education', 'degree, college, scores'],
  ['skills', 'the toolbox, by domain'],
  ['projects', 'selected work  (alias: ls)'],
  ['open <slug>', 'open a case study · or github | linkedin | resume'],
  ['cd <chapter>', 'fly to intro | work | stack | journey | contact'],
  ['contact', 'how to reach me'],
  ['resume', 'open the résumé (pdf)'],
  ['date', 'current time in Pune (IST)'],
  ['sound on|off', 'ambient sound + interface effects'],
  ['clear', 'clear the screen'],
  ['exit', 'back to the command palette'],
];

const LINKS: Record<string, string> = {
  github: cfg.socials.github,
  linkedin: cfg.socials.linkedin,
  resume: cfg.resumePath,
};

const slugs = projectsData.map((p) => p.slug);
const chapterIds = CHAPTERS.map((c) => c.id);

export function banner(): TermOut[] {
  return [
    ['accent', `hogade.sh ${cfg.systemVersion} — ${cfg.name}, ${cfg.role.toLowerCase()}`],
    ['dim', 'an interactive résumé. type `help` to begin, `exit` to leave.'],
    ['dim', ''],
  ];
}

export function istNow(withDate = true) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    ...(withDate ? { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' } : {}),
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

const pad = (s: string, n: number) => s.padEnd(n, ' ');

export function runCommand(raw: string): TermResult {
  const input = raw.trim().replace(/\s+/g, ' ');
  if (!input) return { lines: [] };
  const [name, ...args] = input.split(' ');
  const cmd = name.toLowerCase();
  const arg = args.join(' ').toLowerCase();

  switch (cmd) {
    case 'help':
    case 'man':
      return {
        lines: [
          ...COMMANDS.map(([c, d]): TermOut => ['out', `${pad(c, 13)}${d}`]),
          ['dim', ''],
          ['dim', 'psst — some things need sudo.'],
        ],
      };

    case 'whoami':
      return {
        lines: [
          ['accent', cfg.name.toLowerCase()],
          ['out', `${cfg.role} · ${cfg.subRole}`],
          ['dim', cfg.location],
        ],
      };

    case 'about':
      return { lines: [['out', cfg.bio], ['dim', ''], ['dim', cfg.tagline]] };

    case 'education': {
      const e = cfg.education;
      return {
        lines: [
          ['accent', e.degree],
          ['out', `${e.college}, ${e.city}`],
          ['out', e.university],
          ['out', `${pad('cgpa', 6)}${e.cgpa}  ·  ${e.status}`],
          ['out', `${pad('hsc', 6)}${e.hsc}`],
          ['out', `${pad('ssc', 6)}${e.ssc}`],
          ['dim', ''],
          ['dim', 'focus'],
          ...e.focus.map((f): TermOut => ['out', `  – ${f}`]),
          ['dim', ''],
          ['dim', 'certification'],
          ['out', `  – ${cfg.certification}`],
        ],
      };
    }

    case 'skills':
      return {
        lines: skillsData.flatMap((c, i): TermOut[] => [
          ...(i ? ([['dim', '']] as TermOut[]) : []),
          ['accent', c.name.toLowerCase()],
          ['out', `  ${c.skills.map((s) => s.name).join(' · ')}`],
        ]),
      };

    case 'projects':
    case 'ls':
      return {
        lines: [
          ...projectsData.map((p): TermOut => ['out', `${pad(p.slug, 15)}${p.title} · ${p.category}`]),
          ['dim', ''],
          ['dim', 'type `open <slug>` to read a case study.'],
        ],
      };

    case 'open': {
      if (!arg) return { lines: [['err', 'usage: open <slug> — try `projects`']] };
      const project = projectsData.find((p) => p.slug === arg);
      if (project) return { lines: [['dim', `opening ${project.title}…`]], effect: { type: 'project', slug: project.slug } };
      if (LINKS[arg]) return { lines: [['dim', `opening ${prettyUrl(LINKS[arg])}…`]], effect: { type: 'url', href: LINKS[arg] } };
      return { lines: [['err', `open: no such target '${arg}'`], ['dim', `try: ${[...slugs, ...Object.keys(LINKS)].join(', ')}`]] };
    }

    case 'cd':
    case 'goto': {
      const target = arg.replace(/^[#/~.]+/, '') || 'intro';
      const chapter = CHAPTERS.find((c) => c.id === target);
      if (!chapter) return { lines: [['err', `cd: no such chapter '${arg}'`], ['dim', `try: ${chapterIds.join(', ')}`]] };
      return { lines: [['dim', `flying to ${chapter.label.toLowerCase()}…`]], effect: { type: 'goto', id: chapter.id } };
    }

    case 'contact':
      return {
        lines: [
          ['out', `${pad('email', 10)}${cfg.socials.email}`],
          ['out', `${pad('github', 10)}${prettyUrl(cfg.socials.github)}`],
          ['out', `${pad('linkedin', 10)}${prettyUrl(cfg.socials.linkedin)}`],
          ['out', `${pad('based', 10)}${cfg.location} · open to remote`],
        ],
      };

    case 'resume':
    case 'cv':
      return { lines: [['dim', `opening ${cfg.resumePath}…`]], effect: { type: 'url', href: cfg.resumePath } };

    case 'date':
      return { lines: [['out', `${istNow()} IST (UTC+05:30)`]] };

    case 'sound': {
      const on = useSound.getState().enabled;
      if (arg === 'on' || arg === 'off') {
        const next = arg === 'on';
        if (next === on) return { lines: [['dim', `sound is already ${arg}.`]] };
        return {
          lines: next
            ? [['accent', 'sound on — a quiet pad, generated live (webaudio, no files).']]
            : [['out', 'sound off.']],
          effect: { type: 'sound', on: next },
        };
      }
      if (arg === 'toggle') return { lines: [['out', `sound ${on ? 'off' : 'on'}.`]], effect: { type: 'sound', on: !on } };
      return { lines: [['out', `sound is ${on ? 'on' : 'off'}.`], ['dim', 'usage: sound on | off']] };
    }

    case 'clear':
    case 'cls':
      return { lines: [], effect: { type: 'clear' } };

    case 'exit':
    case 'quit':
      return { lines: [], effect: { type: 'exit' } };

    case 'sudo': {
      if (arg === 'hire-me' || arg === 'hire me') {
        const subject = encodeURIComponent(`Let's talk — a role for ${cfg.name}`);
        return {
          lines: [
            ['dim', '[sudo] password for recruiter: ••••••••'],
            ['out', 'permission granted.'],
            ['out', `✓ candidate   ${cfg.name} — ${cfg.role}`],
            ['out', '✓ open to     internships & full-time roles · 2026–27'],
            ['out', '✓ based in    Pune · open to remote'],
            ['accent', `→ drafting an email to ${cfg.socials.email}…`],
          ],
          effect: { type: 'mailto', href: `mailto:${cfg.socials.email}?subject=${subject}` },
        };
      }
      return { lines: [['err', 'guest is not in the sudoers file. this incident will be reported.']] };
    }

    default:
      return { lines: [['err', `command not found: ${name}`], ['dim', 'type `help` for a list of commands.']] };
  }
}

/** Tab completion: returns the completed input, or null when ambiguous / no match. */
export function complete(raw: string): string | null {
  const v = raw.trimStart().toLowerCase();
  if (v.startsWith('sound ')) {
    const part = v.slice(6);
    const hits = ['on', 'off'].filter((o) => o.startsWith(part));
    return hits.length === 1 ? `sound ${hits[0]}` : null;
  }
  if (v.startsWith('cd ')) {
    const part = v.slice(3);
    const hits = chapterIds.filter((o) => o.startsWith(part));
    return hits.length === 1 ? `cd ${hits[0]}` : null;
  }
  if (v.startsWith('open ')) {
    const part = v.slice(5);
    const hits = [...slugs, ...Object.keys(LINKS)].filter((o) => o.startsWith(part));
    return hits.length === 1 ? `open ${hits[0]}` : null;
  }
  if (!v) return null;
  const names = [...COMMANDS.map(([c]) => c.split(' ')[0]), 'sudo hire-me'];
  const hits = names.filter((n) => n.startsWith(v));
  if (hits.length !== 1) return null;
  return hits[0] === 'open' || hits[0] === 'sound' || hits[0] === 'cd' ? `${hits[0]} ` : hits[0];
}
