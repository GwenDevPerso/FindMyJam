export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    session: (): readonly ['auth', 'session'] => ['auth', 'session'],
  },
  jams: {
    all: ['jams'] as const,
    lists: (): readonly ['jams', 'list'] => ['jams', 'list'],
    list: (filters: Record<string, unknown>): readonly ['jams', 'list', Record<string, unknown>] => [
      'jams',
      'list',
      filters,
    ],
    detail: (id: string): readonly ['jams', 'detail', string] => ['jams', 'detail', id],
    participants: (jamId: string): readonly ['jams', 'participants', string] => [
      'jams',
      'participants',
      jamId,
    ],
  },
  profiles: {
    all: ['profiles'] as const,
    detail: (userId: string): readonly ['profiles', string] => ['profiles', userId],
    createdJams: (userId: string): readonly ['profiles', string, 'created-jams'] => [
      'profiles',
      userId,
      'created-jams',
    ],
    participatedJams: (userId: string): readonly ['profiles', string, 'participated-jams'] => [
      'profiles',
      userId,
      'participated-jams',
    ],
    jams: (userId: string): readonly ['profiles', string, 'jams'] => ['profiles', userId, 'jams'],
  },
  friends: {
    all: ['friends'] as const,
    list: (userId: string): readonly ['friends', string] => ['friends', userId],
    requests: (userId: string): readonly ['friends', string, 'requests'] => [
      'friends',
      userId,
      'requests',
    ],
    search: (query: string): readonly ['friends', 'search', string] => ['friends', 'search', query],
    relations: (userId: string, targetUserIds: string[]): readonly ['friends', string, 'relations', string[]] => [
      'friends',
      userId,
      'relations',
      targetUserIds,
    ],
  },
  reference: {
    all: ['reference'] as const,
    instruments: (): readonly ['reference', 'instruments'] => ['reference', 'instruments'],
    musicStyles: (): readonly ['reference', 'music-styles'] => ['reference', 'music-styles'],
  },
  map: {
    all: ['map'] as const,
    jams: (filters: Record<string, unknown>): readonly ['map', 'jams', Record<string, unknown>] => [
      'map',
      'jams',
      filters,
    ],
    userLocation: (): readonly ['map', 'user-location'] => ['map', 'user-location'],
  },
  location: {
    all: ['location'] as const,
    search: (query: string, proximityKey: string): readonly ['location', 'search', string, string] => [
      'location',
      'search',
      query,
      proximityKey,
    ],
  },
};
