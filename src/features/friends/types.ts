import type { FriendProfile, FriendshipStatus, SkillLevel } from '@/types/domain';

export type FriendshipRelation =
  | 'none'
  | 'friends'
  | 'pending_outgoing'
  | 'pending_incoming'
  | 'rejected'
  | 'blocked'
  | 'self';

export type FriendListItem = {
  friendshipId: string;
  profile: FriendProfile;
  friendsSince: string;
};

export type FriendRequestItem = {
  friendshipId: string;
  profile: FriendProfile;
  requestedAt: string;
};

export type UserSearchResult = {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  skillLevel: SkillLevel | null;
  locationName: string | null;
  relation: FriendshipRelation;
  friendshipId: string | null;
};

export type SearchUsersInput = {
  query: string;
  instrumentIds: string[];
  styleIds: string[];
  limit: number;
};

export type SendFriendRequestInput = {
  addresseeId: string;
};

export type FriendsTab = 'friends' | 'requests';

/**
 * Future evolution: one-way follow without mutual acceptance.
 * Will likely use a dedicated `followers` table.
 */
export type Follower = {
  userId: string;
  followedAt: string;
};

/**
 * Future evolution: block interactions between users.
 * `blocked` status already exists on `friendships.status`.
 */
export type BlockedUser = {
  userId: string;
  blockedAt: string;
  status: Extract<FriendshipStatus, 'blocked'>;
};

/**
 * Future evolution: algorithmic friend recommendations.
 */
export type FriendSuggestion = {
  profile: UserSearchResult;
  score: number;
  reason: string;
};
