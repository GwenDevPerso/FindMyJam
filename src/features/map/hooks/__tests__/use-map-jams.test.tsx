import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { MAP_FILTER_DEBOUNCE_MS } from '@/features/map/constants';
import { useMapJams } from '@/features/map/hooks/use-map-jams';
import type { MapSearchParams } from '@/features/map/types';
import { mapService } from '@/services/map.service';

jest.mock('@/services/map.service');

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const mockedSearchJams = jest.mocked(mapService.searchJams);

const PARIS_SEARCH: MapSearchParams = {
  latitude: 48.8566,
  longitude: 2.3522,
  radiusMeters: 50_000,
  instrumentIds: [],
  styleIds: [],
  startsAfter: '2026-11-18T00:00:00.000Z',
  startsBefore: null,
};
const LYON_SEARCH: MapSearchParams = { ...PARIS_SEARCH, latitude: 45.764, longitude: 4.8357, radiusMeters: 5_600 };

// No retries and no garbage-collection timer, so nothing outlives the test.
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

function wrapper({ children }: { children: ReactNode }): React.JSX.Element {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useMapJams', () => {
  beforeEach(() => {
    mockedSearchJams.mockResolvedValue({ markers: [], nextCursor: null });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('never searches a new centre with the old radius', async () => {
    const { rerender, unmount } = await renderHook(
      ({ searchParams }: { searchParams: MapSearchParams }) => useMapJams({ searchParams, enabled: true }),
      { wrapper, initialProps: { searchParams: PARIS_SEARCH } },
    );
    await act(async () => {
      await wait(MAP_FILTER_DEBOUNCE_MS + 50);
    });
    mockedSearchJams.mockClear();

    await act(async () => {
      await rerender({ searchParams: LYON_SEARCH });
    });
    await act(async () => {
      await wait(MAP_FILTER_DEBOUNCE_MS + 50);
    });

    const searched = mockedSearchJams.mock.calls.map(([params]) => params);
    expect(searched).toHaveLength(1);
    expect(searched[0]).toMatchObject({ latitude: LYON_SEARCH.latitude, radiusMeters: LYON_SEARCH.radiusMeters });
    await unmount();
  });
});
