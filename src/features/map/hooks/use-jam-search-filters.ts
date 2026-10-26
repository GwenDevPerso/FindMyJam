import { useMemo, useState } from 'react';

import { getDateFilterRange } from '@/features/map/utils/date-filter';
import { useMapFiltersStore } from '@/store/map-filters.store';

type JamSearchFilterValues = {
  instrumentIds: string[];
  styleIds: string[];
  startsAfter: string;
  startsBefore: string | null;
};

/**
 * Instrument, style and date filters shared by the map and the jams list, with the date filter turned into a range.
 * The range is computed from the time the screen opened, so the query key stays stable between renders.
 */
export function useJamSearchFilters(): JamSearchFilterValues {
  const [openedAt] = useState((): Date => new Date());

  const instrumentIds = useMapFiltersStore((state) => state.instrumentIds);
  const styleIds = useMapFiltersStore((state) => state.styleIds);
  const dateFilter = useMapFiltersStore((state) => state.dateFilter);

  return useMemo((): JamSearchFilterValues => {
    const { startsAfter, startsBefore } = getDateFilterRange(dateFilter, openedAt);

    return { instrumentIds, styleIds, startsAfter, startsBefore };
  }, [instrumentIds, styleIds, dateFilter, openedAt]);
}
