
import { Text } from '@/components/ui/text';
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

  return <Text className="self-start rounded-sm border border-primary-text bg-background/85 px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-label text-primary-text">{formatRecurrenceSummary(recurrence, startsAt)}</Text>;
}
