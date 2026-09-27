import React, { useState, useEffect, useRef } from 'react';
import { useSystem } from '../../context/SystemContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { portfolioConfig } from '../../data/portfolioConfig';
import { projectsData } from '../../data/projectsData';
import { skillsData } from '../../data/skillsData';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from 'lucide-react';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

export const TerminalModal: React.FC = () => {
  const { theme, setTheme, terminalOpen, setTerminalOpen, triggerSound, openProjectModal } = useSystem();
  const [isMaximized, setIsMaximized] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      type: 'system',
      text: `YASH — DIGITAL STUDIO [v${portfolioConfig.systemVersion}] Developer Shell`,
    },
    {
      id: 'init-2',
      type: 'system',
      text: 'Type "help" for a list of available system commands.',
    },
  ]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trapRef = useFocusTrap<HTMLDivElement>({
    isOpen: terminalOpen,
    onClose: () => setTerminalOpen(false),
  });

  useEffect(() => {
    if (terminalOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [terminalOpen]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!terminalOpen) return null;

  const handleCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    triggerSound('command');

    // Add command to history list
    setCmdHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const newLines: TerminalLine[] = [
      { id: `in-${Date.now()}`, type: 'input', text: `> ${trimmed}` },
    ];

    const [mainCmd, ...args] = trimmed.toLowerCase().split(' ');

    switch (mainCmd) {
      case 'help':
        newLines.push({
          id: `out-${Date.now()}-1`,
          type: 'output',
          text: `Available commands:
  about       - Overview of Yash Hogade & background
  education   - AISSMS College of Engineering credentials
  skills      - List of technologies & programming skills
  projects    - View portfolio projects & open details
  contact     - Communication channels & email
  resume      - Open/Download current resume
  github      - Yash's GitHub link
  linkedin    - Yash's LinkedIn link
  theme       - Switch theme ("theme light" or "theme dark")
  whoami      - Display current visitor & system profile
  date        - Current system timestamp
  clear       - Clear terminal output
  exit        - Close the terminal window`,
        });
        break;

      case 'about':
        newLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `${portfolioConfig.name} — ${portfolioConfig.role} & ${portfolioConfig.subRole}\nLocation: ${portfolioConfig.location}\n\n${portfolioConfig.bio}`,
        });
        break;

      case 'education':
        newLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `EDUCATION CREDENTIALS:
Degree:     ${portfolioConfig.education.degree}
College:    ${portfolioConfig.education.college}, ${portfolioConfig.education.city}
University: ${portfolioConfig.education.university}
Status:     ${portfolioConfig.education.status}

Focus Areas:
${portfolioConfig.education.focus.map((f) => ` • ${f}`).join('\n')}`,
        });
        break;

      case 'skills':
        const skillsSummary = skillsData
          .map((cat) => `[${cat.name.toUpperCase()}]\n${cat.skills.map((s) => s.name).join(', ')}`)
          .join('\n\n');
        newLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: skillsSummary,
        });
        break;

      case 'projects':
        if (args.length > 0) {
          const targetSlug = args[0];
          const found = projectsData.find((p) => p.slug === targetSlug || p.id === targetSlug);
          if (found) {
            newLines.push({
              id: `out-${Date.now()}`,
              type: 'output',
              text: `Opening project deep-dive: ${found.title}...`,
            });
            openProjectModal(found.slug);
            setTerminalOpen(false);
          } else {
            newLines.push({
              id: `err-${Date.now()}`,
              type: 'error',
              text: `Project "${targetSlug}" not found. Available: ${projectsData.map((p) => p.slug).join(', ')}`,
            });
          }
        } else {
          const projList = projectsData
            .map((p) => `• ${p.title} (${p.status}) - slug: ${p.slug}`)
            .join('\n');
          newLines.push({
            id: `out-${Date.now()}`,
            type: 'output',
            text: `CURRENT PROJECTS:\n${projList}\n\nTip: Type "projects <slug>" (e.g. "projects airbnb-clone") to open directly.`,
          });
        }
        break;

      case 'contact':
        newLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `CONTACT CHANNELS:
Email:    ${portfolioConfig.socials.email}
GitHub:   ${portfolioConfig.socials.github}
LinkedIn: ${portfolioConfig.socials.linkedin}
Location: ${portfolioConfig.location}`,
        });
        break;

      case 'resume':
        newLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `Accessing resume document at ${portfolioConfig.resumePath}...`,
        });
        window.open(portfolioConfig.resumePath, '_blank');
        break;

      case 'github':
        newLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `Opening GitHub: ${portfolioConfig.socials.github}`,
        });
        window.open(portfolioConfig.socials.github, '_blank');
        break;

      case 'linkedin':
        newLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `Opening LinkedIn: ${portfolioConfig.socials.linkedin}`,
        });
        window.open(portfolioConfig.socials.linkedin, '_blank');
        break;

      case 'date':
        newLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `SYSTEM TIME: ${new Date().toString()}`,
        });
        break;

      case 'theme':
        if (args[0] === 'light') {
          setTheme('light');
          newLines.push({
            id: `out-${Date.now()}`,
            type: 'system',
            text: 'System theme updated to: LIGHT (Neural White).',
          });
        } else if (args[0] === 'dark') {
          setTheme('dark');
          newLines.push({
            id: `out-${Date.now()}`,
            type: 'system',
            text: 'System theme updated to: DARK (Cyber Midnight).',
          });
        } else {
          newLines.push({
            id: `out-${Date.now()}`,
            type: 'output',
            text: `Current theme: ${theme.toUpperCase()}\nUsage: "theme light" or "theme dark"`,
          });
        }
        break;

      case 'whoami':
        newLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `visitor@yash.os [session: authenticated, terminal_mode: interactive]`,
        });
        break;

      case 'clear':
        setHistory([]);
        setInputVal('');
        return;

      case 'exit':
        setTerminalOpen(false);
        return;

      default:
        newLines.push({
          id: `err-${Date.now()}`,
          type: 'error',
          text: `Command not recognized: "${trimmed}". Type "help" for a list of commands.`,
        });
        break;
    }

    setHistory((prev) => [...prev, ...newLines]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const nextIndex = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIndex);
        setInputVal(cmdHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdHistory.length > 0 && historyIndex !== -1) {
        const nextIndex = historyIndex + 1;
        if (nextIndex < cmdHistory.length) {
          setHistoryIndex(nextIndex);
          setInputVal(cmdHistory[nextIndex]);
        } else {
          setHistoryIndex(-1);
          setInputVal('');
        }
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terminal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#111318]/50 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        ref={trapRef}
        className={`w-full bg-[#111318] border border-[#232733] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isMaximized ? 'h-[94vh] max-w-[96vw]' : 'h-[520px] max-h-[86vh] max-w-2xl'
        }`}
      >
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#181C26] border-b border-[#232733]">
          <div className="flex items-center gap-2.5">
            <TerminalIcon className="w-4 h-4 text-[#10B981]" />
            <span id="terminal-title" className="text-xs font-mono font-bold text-[#F6F5F0] tracking-wider">
              YASH // STUDIO TERMINAL SHELL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded text-[#94A3B8] hover:text-[#F6F5F0] hover:bg-[#232733] transition-colors cursor-pointer"
              title={isMaximized ? 'Restore window' : 'Maximize window'}
              aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setTerminalOpen(false)}
              className="p-1.5 rounded text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#232733] transition-colors cursor-pointer"
              title="Close terminal (Esc)"
              aria-label="Close terminal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Terminal Output Window */}
        <div
          className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2.5 leading-relaxed selection:bg-[#2563EB]/40"
          aria-live="polite"
        >
          {history.map((line) => {
            if (line.type === 'input') {
              return (
                <div key={line.id} className="text-[#60A5FA] font-bold">
                  {line.text}
                </div>
              );
            }
            if (line.type === 'error') {
              return (
                <div key={line.id} className="text-[#EF4444]">
                  {line.text}
                </div>
              );
            }
            if (line.type === 'system') {
              return (
                <div key={line.id} className="text-[#818CF8]">
                  {line.text}
                </div>
              );
            }
            return (
              <div key={line.id} className="text-[#E2E8F0] whitespace-pre-wrap">
                {line.text}
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>

        {/* Active Command Prompt Input */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#111318] border-t border-[#232733]">
          <span className="text-[#10B981] font-mono text-xs font-bold">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type command here (e.g. 'help', 'skills', 'about')..."
            className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-[#F6F5F0] placeholder-[#64748B]"
            autoFocus
          />
          <span className="w-2 h-4 bg-[#60A5FA] animate-pulse" />
        </div>
      </div>
    </div>
  );
};
