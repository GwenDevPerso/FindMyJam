import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Loading } from '@/components/feedback/loading';
import { ErrorState } from '@/components/layout/error-state';
import { useMyJamCalendar } from '@/features/jams/hooks/use-my-jam-calendar';
import type { CalendarJam } from '@/features/jams/types';
import { useTheme } from '@/hooks/use-theme';
import { buildMonthGrid, formatMonthLabel, getMonthName, shiftMonth, toMonthKey } from '@/utils/calendar';
import { cn } from '@/utils/cn';
import { toLocalDateParts } from '@/utils/date';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const ROLE_LABELS: Record<CalendarJam['role'], string> = {
  created: 'created',
  participant: 'participating',
};

type JamCalendarProps = {
  onJamPress: (jamId: string) => void;
};

function describeDay(date: string, jams: CalendarJam[]): string {
  const created = jams.filter((jam) => jam.role === 'created').length;
  const participating = jams.length - created;
  const parts = [`${Number(date.slice(8))} ${getMonthName(date)}`];

  if (created > 0) {
    parts.push(`${created} created`);
  }
  if (participating > 0) {
    parts.push(`${participating} participating`);
  }

  return parts.join(', ');
}

/** Month view of the jams the user created and joined; pressing a day lists its jams. */
export function JamCalendar({ onJamPress }: JamCalendarProps): React.JSX.Element {
  const theme = useTheme();
  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const calendarQuery = useMyJamCalendar({ month, enabled: true });

  const today = toLocalDateParts(new Date().toISOString()).date;
  const roleColors: Record<CalendarJam['role'], string> = { created: theme.primary, participant: theme.accent };

  const jamsByDate = new Map<string, CalendarJam[]>();
  for (const jam of calendarQuery.data ?? []) {
    const { date } = toLocalDateParts(jam.startsAt);
    jamsByDate.set(date, [...(jamsByDate.get(date) ?? []), jam]);
  }

  const changeMonth = (delta: number): void => {
    setMonth(shiftMonth(month, delta));
    setSelectedDate(null);
  };

  const selectedJams = selectedDate === null ? [] : (jamsByDate.get(selectedDate) ?? []);

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" hitSlop={8} onPress={() => changeMonth(-1)}>
          <ChevronLeft size={22} color={theme.text} />
        </Pressable>
        <Text className="text-lg font-bold text-foreground">{formatMonthLabel(month)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" hitSlop={8} onPress={() => changeMonth(1)}>
          <ChevronRight size={22} color={theme.text} />
        </Pressable>
      </View>

      {calendarQuery.isLoading ? (
        <Loading message="Loading your jams…" size="small" fullScreen={false} className="py-8" />
      ) : null}

      {calendarQuery.isError ? (
        <ErrorState
          title="Unable to load your calendar"
          message={calendarQuery.error.message}
          className="py-6"
          onRetry={() => {
            void calendarQuery.refetch();
          }}
        />
      ) : null}

      {!calendarQuery.isLoading && !calendarQuery.isError ? (
        <>
          <View className="gap-1">
            <View className="flex-row">
              {WEEKDAY_LABELS.map((label, index) => (
                <Text key={index} className="flex-1 text-center text-xs font-semibold text-muted-foreground">
                  {label}
                </Text>
              ))}
            </View>

            {buildMonthGrid(month).map((week, weekIndex) => (
              <View key={weekIndex} className="flex-row">
                {week.map((date, dayIndex) => {
                  if (date === null) {
                    return <View key={dayIndex} className="h-11 flex-1" />;
                  }

                  const dayJams = jamsByDate.get(date) ?? [];
                  const roles = (['created', 'participant'] as const).filter((role) =>
                    dayJams.some((jam) => jam.role === role),
                  );
                  const isSelected = date === selectedDate;

                  return (
                    <Pressable
                      key={date}
                      accessibilityRole="button"
                      accessibilityLabel={describeDay(date, dayJams)}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setSelectedDate(date)}
                      className={cn(
                        'h-11 flex-1 items-center justify-center gap-1 rounded-lg',
                        isSelected && 'bg-secondary',
                      )}>
                      <Text
                        className={cn(
                          'text-sm text-foreground',
                          date === today && 'font-bold text-primary',
                        )}>
                        {Number(date.slice(8))}
                      </Text>
                      <View className="h-1.5 flex-row gap-1">
                        {roles.map((role) => (
                          <View
                            key={role}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: roleColors[role] }}
                          />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <View className="flex-row justify-center gap-4">
            {(['created', 'participant'] as const).map((role) => (
              <View key={role} className="flex-row items-center gap-1.5">
                <View className="h-2 w-2 rounded-full" style={{ backgroundColor: roleColors[role] }} />
                <Text className="text-xs text-muted-foreground">
                  {role === 'created' ? 'Created' : 'Participating'}
                </Text>
              </View>
            ))}
          </View>

          {calendarQuery.data?.length === 0 ? (
            <Text className="text-center text-sm text-muted-foreground">No jams this month</Text>
          ) : null}

          {selectedDate !== null && selectedJams.length === 0 && calendarQuery.data?.length !== 0 ? (
            <Text className="text-center text-sm text-muted-foreground">No jams on this day</Text>
          ) : null}

          {selectedJams.map((jam) => {
            const { time } = toLocalDateParts(jam.startsAt);

            return (
              <Pressable
                key={jam.id}
                accessibilityRole="button"
                accessibilityLabel={`${jam.title}, ${ROLE_LABELS[jam.role]}, ${time}`}
                onPress={() => onJamPress(jam.id)}
                className="flex-row items-center gap-3 rounded-lg border border-border bg-card-elevated px-3 py-2">
                <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: roleColors[jam.role] }} />
                <Text className="text-sm font-semibold text-muted-foreground">{time}</Text>
                <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                  {jam.title}
                </Text>
              </Pressable>
            );
          })}
        </>
      ) : null}
    </View>
  );
}
