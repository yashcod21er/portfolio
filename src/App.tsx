import { useEffect } from 'react';
import { startSmoothScroll } from './lib/smooth';

import Preloader from './chrome/Preloader';
import Cursor from './chrome/Cursor';
import Nav from './chrome/Nav';
import Grain from './chrome/Grain';
import Hero from './sections/hero/Hero';
import Work from './sections/work/Work';
import Interlude from './sections/interlude/Interlude';
import ProjectCase from './sections/work/ProjectCase';
import About from './sections/about/About';
import Contact from './sections/contact/Contact';
import CommandPalette from './sections/contact/CommandPalette';

export default function App() {
  useEffect(() => {
    startSmoothScroll();
  }, []);

  return (
    <>
      <Preloader />
      <Grain />
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Work />
        <Interlude />
        <About />
        <Contact />
      </main>
      <ProjectCase />
      <CommandPalette />
    </>
  );
}
