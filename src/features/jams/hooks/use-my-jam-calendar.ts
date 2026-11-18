import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { jamService } from '@/services/jam.service';
import { useAuthStore } from '@/store/auth.store';

type UseMyJamCalendarOptions = {
  /** `YYYY-MM`, local month. */
  month: string;
  enabled: boolean;
};

/** Jams the signed-in user created or joined during a month. */
export function useMyJamCalendar({ month, enabled }: UseMyJamCalendarOptions) {
  const userId = useAuthStore((state) => state.userId);

  return useQuery({
    queryKey: queryKeys.profiles.calendarMonth(userId ?? '', month),
    queryFn: () => {
      if (userId === null) {
        throw new Error('User ID is required to fetch the calendar');
      }

      return jamService.listCalendarMonth(userId, month);
    },
    staleTime: DEFAULT_STALE_TIME_MS,
    enabled: enabled && userId !== null,
  });
}
