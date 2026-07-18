import { useEffect, useState } from 'react';

const MARKER_RENDER_DELAY_MS = 500;

export function useMarkerTracksViewChanges(trackKey: string): boolean {
  const [tracksViewChanges, setTracksViewChanges] = useState<boolean>(true);

  useEffect(() => {
    setTracksViewChanges(true);

    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, MARKER_RENDER_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [trackKey]);

  return tracksViewChanges;
}
