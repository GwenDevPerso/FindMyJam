export function formatDistance(meters: number | null): string | null {
  if (meters === null) {
    return null;
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatParticipantCount(current: number, max: number): string {
  return `${current} / ${max}`;
}

export function formatSkillLevel(level: string): string {
  return level
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
