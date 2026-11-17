import { useEffect } from 'react';
import { startSmoothScroll } from './lib/smooth';

import Preloader from './chrome/Preloader';
import Cursor from './chrome/Cursor';
import Nav from './chrome/Nav';
import Grain from './chrome/Grain';
import World from './world/World';
import ScrollDriver from './world/ScrollDriver';
import ScoreDriver from './chrome/ScoreDriver';
import Overlay from './overlay/Overlay';
import ProjectCase from './sections/work/ProjectCase';
import CommandPalette from './sections/contact/CommandPalette';

/**
 * v4 "Signal Red": one fixed full-screen 3D world (<World/>) behind a DOM overlay
 * (<Overlay/>) whose scroll length drives the camera through five chapters.
 */
export default function App() {
  useEffect(() => {
    startSmoothScroll();
  }, []);

  return (
    <>
      <Preloader />
      <World />
      <Grain />
      <Cursor />
      <Nav />
      <main id="world-scroll">
        <Overlay />
      </main>
      <ScrollDriver />
      <ScoreDriver />
      <ProjectCase />
      <CommandPalette />
    </>
  );
}
