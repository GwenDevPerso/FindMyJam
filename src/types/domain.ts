export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'all_levels';

/** How a recurring jam repeats; `monthly_weekday` keeps the weekday position of the first date (e.g. 2nd Tuesday). */
export type JamRecurrence = 'weekly' | 'biweekly' | 'monthly_weekday';

export type Profile = {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  skillLevel: SkillLevel | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  instrumentIds: string[];
  styleIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type Jam = {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  startsAt: string;
  locationName: string;
  latitude: number;
  longitude: number;
  skillLevel: SkillLevel;
  maxParticipants: number;
  participantCount: number;
  distanceMeters: number | null;
  instrumentIds: string[];
  styleIds: string[];
  /** Series the jam is an occurrence of; null for a one-off jam. */
  seriesId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JamParticipant = {
  jamId: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  joinedAt: string;
};

export type Instrument = {
  id: string;
  name: string;
  slug: string;
};

export type MusicStyle = {
  id: string;
  name: string;
  slug: string;
};

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export type Friendship = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
};

export type FriendProfile = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

/** A message of a jam's chat room. */
export type ChatMessage = {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl: string | null;
  body: string;
  createdAt: string;
};
