import './about.css';
import Manifesto from './Manifesto';
import SpecSheet from './SpecSheet';
import Skills from './Skills';
import Journey from './Journey';

/**
 * #about — manifesto, fact sheet, skills (marquee + domains), and the road here.
 * Each part owns its own useGSAP scope; all of them render their final state without JS.
 */
export default function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="relative overflow-x-clip bg-ink pt-[clamp(120px,16vw,240px)] pb-[clamp(96px,12vw,180px)] text-bone"
    >
      <Manifesto />
      <div className="mt-[clamp(120px,16vw,240px)]">
        <SpecSheet />
      </div>
      <div className="mt-[clamp(120px,16vw,240px)]">
        <Skills />
      </div>
      <div className="mt-[clamp(120px,16vw,240px)]">
        <Journey />
      </div>
    </section>
  );
}
