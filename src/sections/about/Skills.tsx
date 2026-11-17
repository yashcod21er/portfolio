import { useRef } from 'react';
import { useGSAP } from '../../lib/gsap';
import { prefersReducedMotion } from '../../lib/smooth';
import { skillsData } from '../../data/skillsData';
import Mask from './Mask';
import SkillsMarquee from './SkillsMarquee';
import SkillDomains from './SkillDomains';
import SkillsKeyboard from './SkillsKeyboard';
import { riseIn } from './motion';

const uniqueNames = [...new Set(skillsData.flatMap((d) => d.skills.map((s) => s.name)))];
const pad = (n: number) => String(n).padStart(2, '0');

export default function Skills() {
  const head = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !head.current) return;
      riseIn(head.current, 'top 85%', 0.1);
    },
    { scope: head },
  );

  return (
    <div role="group" aria-labelledby="about-stack">
      <div
        ref={head}
        className="gutter mx-auto grid w-full max-w-[1600px] gap-y-6 pb-[clamp(40px,6vw,88px)] md:grid-cols-12 md:items-end md:gap-x-8"
      >
        <div className="md:col-span-8">
          <p className="label">Skills</p>
          <h3
            id="about-stack"
            className="ab-h display mt-4 text-[clamp(56px,7.5vw,120px)] text-bone"
          >
            <Mask>
              The working <span className="serif-i">stack</span>
            </Mask>
          </h3>
        </div>
        <p className="label md:col-span-4 md:text-right">
          <Mask>
            {pad(skillsData.length)} domains · {pad(uniqueNames.length)} tools
          </Mask>
        </p>
      </div>

      <SkillsMarquee names={uniqueNames} />

      <SkillsKeyboard />

      <div className="gutter mx-auto mt-[clamp(56px,8vw,120px)] w-full max-w-[1600px]">
        <SkillDomains domains={skillsData} />
      </div>
    </div>
  );
}
