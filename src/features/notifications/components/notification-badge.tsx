import { CountBadge } from '@/components/ui/count-badge';
import { cn } from '@/utils/cn';

type NotificationBadgeProps = {
  count: number;
  className?: string;
};

export function NotificationBadge({ count, className }: NotificationBadgeProps): React.JSX.Element | null {
  return (
    <CountBadge
      count={count}
      accessibilityLabel={`${count} unread notifications`}
      className={cn('absolute -right-1.5 -top-1.5', className)}
    />
  );
}
