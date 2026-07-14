import { Badge, BadgeGroup } from '@/components/ui/badge';
import { InstrumentBadge } from '@/components/ui/instrument-badge';
import { StyleBadge } from '@/components/ui/style-badge';
import { useReferenceInstruments } from '@/features/profile/hooks/use-reference-instruments';
import { useReferenceMusicStyles } from '@/features/profile/hooks/use-reference-music-styles';

type JamBadgesProps = {
  instrumentIds: string[];
  styleIds: string[];
  maxVisible: number;
  size: 'sm' | 'md';
};

export function JamBadges({
  instrumentIds,
  styleIds,
  maxVisible,
  size,
}: JamBadgesProps): React.JSX.Element | null {
  const instrumentsQuery = useReferenceInstruments({ enabled: instrumentIds.length > 0 });
  const stylesQuery = useReferenceMusicStyles({ enabled: styleIds.length > 0 });

  const instruments = (instrumentsQuery.data ?? []).filter((item) => instrumentIds.includes(item.id));
  const styles = (stylesQuery.data ?? []).filter((item) => styleIds.includes(item.id));

  if (instruments.length === 0 && styles.length === 0) {
    return null;
  }

  const visibleInstruments = instruments.slice(0, maxVisible);
  const visibleStyles = styles.slice(0, Math.max(0, maxVisible - visibleInstruments.length));
  const hiddenCount =
    instrumentIds.length + styleIds.length - visibleInstruments.length - visibleStyles.length;

  return (
    <BadgeGroup>
      {visibleInstruments.map((instrument) => (
        <InstrumentBadge
          key={instrument.id}
          name={instrument.name}
          slug={instrument.slug}
          size={size}
        />
      ))}
      {visibleStyles.map((style) => (
        <StyleBadge key={style.id} name={style.name} slug={style.slug} size={size} />
      ))}
      {hiddenCount > 0 ? (
        <Badge label={`+${hiddenCount}`} variant="outline" size="sm" />
      ) : null}
    </BadgeGroup>
  );
}
