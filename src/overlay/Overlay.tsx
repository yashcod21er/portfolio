import type { ComponentType } from 'react';
import { CHAPTERS, type ChapterId } from '../world/layout';
import ContactChapter from './ContactChapter';
import Hud from './Hud';
import IntroChapter from './IntroChapter';
import JourneyChapter from './JourneyChapter';
import StackChapter from './StackChapter';
import WorkChapter from './WorkChapter';
import './overlay.css';

const VIEWS: Record<ChapterId, ComponentType> = {
  intro: IntroChapter,
  work: WorkChapter,
  stack: StackChapter,
  journey: JourneyChapter,
  contact: ContactChapter,
};

/**
 * The DOM layer over the 3D canvas. One <section> per chapter, exactly `vh` tall (this is the
 * scroll length the camera flies), each holding a pinned stage; plus the fixed HUD.
 * Transparent: the world shows through everywhere.
 */
export default function Overlay() {
  return (
    <div className="relative z-10">
      <Hud />
      {CHAPTERS.map((c) => {
        const View = VIEWS[c.id];
        return (
          <section key={c.id} id={c.id} aria-label={c.label} className="relative" style={{ height: `${c.vh}vh` }}>
            <View />
          </section>
        );
      })}
    </div>
  );
}
