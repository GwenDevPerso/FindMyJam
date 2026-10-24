import { Text } from 'react-native';

import type { JamRecurrence } from '@/types/domain';
import { formatRecurrenceSummary } from '@/utils/recurrence';

type JamRecurrenceSummaryProps = {
  /** Null for a one-off jam, which renders nothing. */
  recurrence: JamRecurrence | null;
  startsAt: string;
};

/** "Repeats every week on Tuesday" line of a jam that belongs to a series. */
export function JamRecurrenceSummary({
  recurrence,
  startsAt,
}: JamRecurrenceSummaryProps): React.JSX.Element | null {
  if (recurrence === null) {
    return null;
  }

  return <Text className="text-sm text-muted-foreground">{formatRecurrenceSummary(recurrence, startsAt)}</Text>;
}
