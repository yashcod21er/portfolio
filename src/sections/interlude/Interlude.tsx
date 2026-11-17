import Cinematic from './Cinematic';
import Still from './Still';
import { FINE_QUERY, MOBILE_QUERY, REDUCED_QUERY, useMedia } from './useMedia';

/**
 * #interlude — between Work and About. A pinned, scrubbed three-act scene where the
 * photograph is the material: 01 the portrait assembles on a cylinder of strips,
 * 02 the statement rushes out of a perspective tunnel, 03 the work turns in orbit.
 * Reduced motion gets a still, unpinned version of the same content.
 */
export default function Interlude() {
  const reduced = useMedia(REDUCED_QUERY);
  const mobile = useMedia(MOBILE_QUERY);
  const fine = useMedia(FINE_QUERY);

  return (
    <section id="interlude" aria-labelledby="interlude-title" className="relative bg-ink text-bone">
      {reduced ? (
        <Still />
      ) : (
        // Remount on the breakpoint: strip count and pin length differ.
        <Cinematic key={mobile ? 'mobile' : 'desktop'} mobile={mobile} tilt={fine && !mobile} />
      )}
    </section>
  );
}
