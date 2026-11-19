import { type Href, router } from 'expo-router';
import { ChevronLeft, Share as ShareIcon } from 'lucide-react-native';
import { ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Loading } from '@/components/feedback/loading';
import { ErrorState } from '@/components/layout/error-state';
import { Screen } from '@/components/layout/screen';
import { AvatarStack } from '@/components/ui/avatar-stack';
import { Button } from '@/components/ui/button';
import { Horizon } from '@/components/ui/horizon';
import { IconButton, type IconButtonVariant } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { Routes } from '@/constants/routes';
import { JamBadges } from '@/features/jams/components/jam-badges';
import { JamDeleteButton } from '@/features/jams/components/jam-delete-button';
import { JamDetailFooter } from '@/features/jams/components/jam-detail-footer';
import { JamLocationMap } from '@/features/jams/components/jam-location-map';
import { JamRecurrenceSummary } from '@/features/jams/components/jam-recurrence-summary';
import { useJamDetail } from '@/features/jams/hooks/use-jam-detail';
import { useJamParticipants } from '@/features/jams/hooks/use-jam-participants';
import { useJamWaitlist } from '@/features/jams/hooks/use-jam-waitlist';
import type { JamDetail } from '@/features/jams/types';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/utils/cn';
import { formatJamDateTime } from '@/utils/date';
import { formatDistance, formatParticipantCount, formatSkillLevel } from '@/utils/format';

const MAX_SHOWN_AVATARS = 6;
const SECTION_LABEL_CLASS = 'font-mono text-xs font-semibold uppercase tracking-label text-muted-foreground';

type JamDetailScreenProps = {
  jamId: string;
};

type JamSectionProps = {
  jam: JamDetail;
};

function isJamFull(jam: JamDetail): boolean {
  return jam.participantCount >= jam.maxParticipants;
}

function goBack(): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(Routes.home as Href);
}

function BackButton({ variant }: { variant: IconButtonVariant }): React.JSX.Element {
  const theme = useTheme();

  return (
    <IconButton accessibilityLabel="Back" variant={variant} onPress={goBack}>
      <ChevronLeft size={20} color={theme.text} strokeWidth={1.8} />
    </IconButton>
  );
}

function StateScreen({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Screen scrollable={false} withTabBarInset={false} contentClassName="gap-4 pt-2">
      <BackButton variant="default" />
      {children}
    </Screen>
  );
}

function JamDetailHeader({ jam }: JamSectionProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const insetStyle = { paddingTop: insets.top };

  const handleShare = (): void => {
    // A dismissed or failed share sheet loses nothing; there is nothing to report.
    Share.share({ message: `${jam.title} · ${formatJamDateTime(jam.startsAt)} · ${jam.locationName}` }).catch(
      () => undefined,
    );
  };

  return (
    <View style={insetStyle}>
      <View className="absolute inset-0">
        <Horizon variant="header" />
      </View>

      <View className="flex-row justify-between px-4 pt-2">
        <BackButton variant="overlay" />
        <IconButton accessibilityLabel="Share" variant="overlay" onPress={handleShare}>
          <ShareIcon size={20} color={theme.text} strokeWidth={1.8} />
        </IconButton>
      </View>

      <View className="gap-2 px-5 pb-4 pt-14">
        <JamRecurrenceSummary recurrence={jam.recurrence} startsAt={jam.startsAt} />
        <Text accessibilityRole="header" className="text-2xl tracking-display text-foreground">
          {jam.title}
        </Text>
      </View>
    </View>
  );
}

type InfoCardProps = {
  label: string;
  value: string;
  className?: string;
};

function InfoCard({ label, value, className }: InfoCardProps): React.JSX.Element {
  return (
    <View className={cn('gap-1', className)}>
      <Text className={SECTION_LABEL_CLASS}>{label}</Text>
      <Text className="text-base font-bold text-foreground">{value}</Text>
    </View>
  );
}

function JamInfoGrid({ jam }: JamSectionProps): React.JSX.Element {
  const distanceLabel = formatDistance(jam.distanceMeters);
  const cardClass = 'rounded-lg border border-border bg-card p-3';

  return (
    <View className="gap-2.5">
      <View className="flex-row gap-2.5">
        <InfoCard
          label={jam.recurrence !== null ? 'Next date' : 'Date'}
          value={formatJamDateTime(jam.startsAt)}
          className={cn('flex-1', cardClass)}
        />
        <InfoCard label="Level" value={formatSkillLevel(jam.skillLevel)} className={cn('flex-1', cardClass)} />
      </View>
      <View className={cn('flex-row items-center justify-between gap-2.5', cardClass)}>
        <InfoCard label="Where" value={jam.locationName} className="flex-1" />
        {distanceLabel !== null ? <Text className="font-mono text-sm text-accent">{distanceLabel}</Text> : null}
      </View>
    </View>
  );
}

function JamLookingFor({ jam }: JamSectionProps): React.JSX.Element | null {
  if (jam.instrumentIds.length === 0 && jam.styleIds.length === 0) {
    return null;
  }

  return (
    <View className="gap-2">
      <Text className={SECTION_LABEL_CLASS}>Looking for</Text>
      <JamBadges instrumentIds={jam.instrumentIds} styleIds={jam.styleIds} maxVisible={8} size="md" />
    </View>
  );
}

function JamMusicians({ jam }: JamSectionProps): React.JSX.Element {
  const isFull = isJamFull(jam);
  const participantsQuery = useJamParticipants({ jamId: jam.id, enabled: true });
  const waitlistQuery = useJamWaitlist({ jamId: jam.id, enabled: isFull });
  const hostQuery = useProfile({ userId: jam.creatorId, enabled: true });

  const participants = participantsQuery.data ?? [];
  const hiddenCount = participants.length - MAX_SHOWN_AVATARS;
  const waitingCount = waitlistQuery.data?.size ?? 0;
  const othersLabel = [
    hiddenCount > 0 ? `+${hiddenCount} more` : null,
    waitingCount > 0 ? `${waitingCount} waiting` : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');
  const host = hostQuery.data;
  const hostInstrument = host?.instruments[0];

  return (
    <View className="gap-2.5">
      <View className="flex-row items-baseline justify-between">
        <Text className={SECTION_LABEL_CLASS}>Musicians</Text>
        <Text className={cn('font-mono text-xs font-semibold uppercase', isFull ? 'text-primary-text' : 'text-accent')}>
          {`${formatParticipantCount(jam.participantCount, jam.maxParticipants)}${isFull ? ' · Full' : ''}`}
        </Text>
      </View>

      {participantsQuery.isLoading ? (
        <Text className="text-sm text-muted-foreground">Loading musicians…</Text>
      ) : null}

      {participantsQuery.isError ? (
        <View className="gap-2">
          <Text className="text-sm text-destructive">Could not load the musicians.</Text>
          <Button
            label="Try again"
            variant="ghost"
            size="md"
            isLoading={false}
            onPress={() => {
              void participantsQuery.refetch();
            }}
          />
        </View>
      ) : null}

      {!participantsQuery.isLoading && !participantsQuery.isError && participants.length === 0 ? (
        <Text className="text-sm text-text-soft">No musicians have joined yet.</Text>
      ) : null}

      {participants.length > 0 ? (
        <View className="flex-row items-center gap-2.5">
          <AvatarStack
            avatars={participants.slice(0, MAX_SHOWN_AVATARS).map((participant) => ({
              id: participant.userId,
              source: participant.avatarUrl,
              fallback: participant.username,
            }))}
            max={MAX_SHOWN_AVATARS}
          />
          {othersLabel.length > 0 ? <Text className="text-sm text-text-soft">{othersLabel}</Text> : null}
        </View>
      ) : null}

      {host !== undefined ? (
        <Text className="text-sm text-text-soft">
          Hosted by <Text className="text-sm font-bold text-foreground">{`@${host.username}`}</Text>
          {hostInstrument !== undefined ? ` · ${hostInstrument.name}` : ''}
        </Text>
      ) : null}
    </View>
  );
}

function JamWaitlistRank({ jam }: JamSectionProps): React.JSX.Element | null {
  const canWait = isJamFull(jam) && !jam.isCreator && !jam.isParticipant;
  const waitlistQuery = useJamWaitlist({ jamId: jam.id, enabled: canWait });
  const position = canWait ? (waitlistQuery.data?.position ?? null) : null;

  if (position === null) {
    return null;
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      className="flex-row items-center gap-3 rounded-lg border border-accent bg-accent/10 p-3.5">
      <Text className="text-3xl text-accent">{`#${position}`}</Text>
      <Text className="flex-1 text-sm text-foreground">
        You&apos;re on the waitlist. You will join automatically when a spot opens up, and get a notification.
      </Text>
    </View>
  );
}

/** Jam screen of the neon night mockup: horizon header, info cards, musicians, then the actions pinned below. */
export function JamDetailScreen({ jamId }: JamDetailScreenProps): React.JSX.Element {
  const jamQuery = useJamDetail({ jamId, enabled: jamId.length > 0 });

  if (jamQuery.isLoading) {
    return (
      <StateScreen>
        <Loading message="Loading jam…" size="large" fullScreen={true} />
      </StateScreen>
    );
  }

  if (jamQuery.isError) {
    return (
      <StateScreen>
        <ErrorState
          title="Unable to load jam"
          message={jamQuery.error.message}
          onRetry={() => {
            void jamQuery.refetch();
          }}
        />
      </StateScreen>
    );
  }

  const jam = jamQuery.data;

  if (jam === undefined) {
    return (
      <StateScreen>
        <ErrorState title="Jam not found" message="This jam may have been removed." />
      </StateScreen>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        <JamDetailHeader jam={jam} />

        <View className="gap-4 px-5 pt-4">
          <JamInfoGrid jam={jam} />
          <JamLookingFor jam={jam} />
          <JamMusicians jam={jam} />
          {jam.description !== null && jam.description.length > 0 ? (
            <Text className="text-sm text-text-soft">{jam.description}</Text>
          ) : null}
          <JamWaitlistRank jam={jam} />
          <JamLocationMap
            coordinates={{ latitude: jam.latitude, longitude: jam.longitude }}
            title={jam.title}
            locationName={jam.locationName}
          />
          {jam.isCreator ? <JamDeleteButton jamId={jam.id} seriesId={jam.seriesId} jamTitle={jam.title} /> : null}
        </View>
      </ScrollView>

      <JamDetailFooter jam={jam} />
    </View>
  );
}
