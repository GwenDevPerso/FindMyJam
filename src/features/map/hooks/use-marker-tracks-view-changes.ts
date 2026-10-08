import { useEffect, useState } from 'react';

const MARKER_RENDER_DELAY_MS = 500;

export function useMarkerTracksViewChanges(trackKey: string): boolean {
  const [settledKey, setSettledKey] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSettledKey(trackKey);
    }, MARKER_RENDER_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [trackKey]);

  return settledKey !== trackKey;
}
