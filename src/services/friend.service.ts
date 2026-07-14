import type { PostgrestError } from '@supabase/supabase-js';

import type {
  FriendListItem,
  FriendRequestItem,
  FriendshipRelation,
  SearchUsersInput,
  UserSearchResult,
} from '@/features/friends/types';
import { searchUsersSchema } from '@/features/friends/schemas/search-users.schema';
import { sendFriendRequestSchema } from '@/features/friends/schemas/send-friend-request.schema';
import { AppError } from '@/lib/errors/app-error';
import { mapSupabaseError } from '@/lib/errors/map-supabase-error';
import type { FriendshipRow, SearchProfileRow } from '@/lib/supabase/types';
import type { Friendship, FriendProfile } from '@/types/domain';
import {
  friendRepository,
  type FriendshipWithProfiles,
} from '@/repositories/friend.repository';

function assertNoError(error: PostgrestError | null): void {
  if (error !== null) {
    throw mapSupabaseError(error);
  }
}

function mapFriendshipRow(row: FriendshipRow): Friendship {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFriendProfile(row: { id: string; username: string; avatar_url: string | null }): FriendProfile {
  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url,
  };
}

function getOtherUserId(friendship: FriendshipWithProfiles, currentUserId: string): string {
  return friendship.requester_id === currentUserId ? friendship.addressee_id : friendship.requester_id;
}

function getOtherUserProfile(friendship: FriendshipWithProfiles, currentUserId: string): FriendProfile {
  const profile =
    friendship.requester_id === currentUserId ? friendship.addressee : friendship.requester;

  return mapFriendProfile(profile);
}

function mapAcceptedFriend(friendship: FriendshipWithProfiles, currentUserId: string): FriendListItem {
  return {
    friendshipId: friendship.id,
    profile: getOtherUserProfile(friendship, currentUserId),
    friendsSince: friendship.updated_at,
  };
}

function mapIncomingRequest(friendship: FriendshipWithProfiles): FriendRequestItem {
  return {
    friendshipId: friendship.id,
    profile: mapFriendProfile(friendship.requester),
    requestedAt: friendship.created_at,
  };
}

function mapSearchProfileRow(row: SearchProfileRow): UserSearchResult {
  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    skillLevel: row.skill_level,
    locationName: row.location_name,
    relation: 'none',
    friendshipId: null,
  };
}

function resolveRelation(
  currentUserId: string,
  targetUserId: string,
  friendship: FriendshipRow | undefined,
): { relation: FriendshipRelation; friendshipId: string | null } {
  if (currentUserId === targetUserId) {
    return { relation: 'self', friendshipId: null };
  }

  if (friendship === undefined) {
    return { relation: 'none', friendshipId: null };
  }

  if (friendship.status === 'accepted') {
    return { relation: 'friends', friendshipId: friendship.id };
  }

  if (friendship.status === 'blocked') {
    return { relation: 'blocked', friendshipId: friendship.id };
  }

  if (friendship.status === 'rejected') {
    return { relation: 'rejected', friendshipId: friendship.id };
  }

  if (friendship.requester_id === currentUserId) {
    return { relation: 'pending_outgoing', friendshipId: friendship.id };
  }

  return { relation: 'pending_incoming', friendshipId: friendship.id };
}

function getFriendshipBetweenUsers(
  friendships: FriendshipRow[],
  currentUserId: string,
  targetUserId: string,
): FriendshipRow | undefined {
  return friendships.find(
    (friendship) =>
      (friendship.requester_id === currentUserId && friendship.addressee_id === targetUserId) ||
      (friendship.requester_id === targetUserId && friendship.addressee_id === currentUserId),
  );
}

function assertFriendshipInvolved(userId: string, friendship: FriendshipRow): void {
  if (friendship.requester_id !== userId && friendship.addressee_id !== userId) {
    throw new AppError('NOT_FRIENDSHIP_INVOLVED', 'You are not part of this friendship', 403);
  }
}

export const friendService = {
  searchUsers: async (currentUserId: string, input: SearchUsersInput): Promise<UserSearchResult[]> => {
    const validated = searchUsersSchema.parse(input);

    const { data, error } = await friendRepository.searchProfiles({
      query: validated.query.length > 0 ? validated.query : null,
      instrumentIds: validated.instrumentIds.length > 0 ? validated.instrumentIds : null,
      styleIds: validated.styleIds.length > 0 ? validated.styleIds : null,
      limit: validated.limit,
    });
    assertNoError(error);

    const profiles = data
      .filter((profile) => profile.id !== currentUserId)
      .map(mapSearchProfileRow);

    if (profiles.length === 0) {
      return [];
    }

    const targetUserIds = profiles.map((profile) => profile.id);
    const { data: friendships, error: relationsError } = await friendRepository.findRelationsForUsers(
      currentUserId,
      targetUserIds,
    );
    assertNoError(relationsError);

    return profiles.map((profile) => {
      const friendship = getFriendshipBetweenUsers(friendships, currentUserId, profile.id);
      const { relation, friendshipId } = resolveRelation(currentUserId, profile.id, friendship);

      return {
        ...profile,
        relation,
        friendshipId,
      };
    });
  },

  listAccepted: async (userId: string): Promise<FriendListItem[]> => {
    const { data, error } = await friendRepository.findByUserAndStatus(userId, 'accepted');
    assertNoError(error);

    return data.map((friendship) => mapAcceptedFriend(friendship, userId));
  },

  listIncomingRequests: async (userId: string): Promise<FriendRequestItem[]> => {
    const { data, error } = await friendRepository.findPendingIncoming(userId);
    assertNoError(error);

    return data.map(mapIncomingRequest);
  },

  sendRequest: async (requesterId: string, addresseeId: string): Promise<Friendship> => {
    const validated = sendFriendRequestSchema.parse({ addresseeId });

    if (requesterId === validated.addresseeId) {
      throw new AppError('CANNOT_FRIEND_SELF', 'You cannot send a friend request to yourself', 400);
    }

    const { data: existing, error: existingError } = await friendRepository.findBetweenUsers(
      requesterId,
      validated.addresseeId,
    );
    assertNoError(existingError);

    if (existing === null) {
      const { data, error } = await friendRepository.create({
        requester_id: requesterId,
        addressee_id: validated.addresseeId,
        status: 'pending',
      });
      assertNoError(error);

      return mapFriendshipRow(data);
    }

    if (existing.status === 'accepted') {
      throw new AppError('ALREADY_FRIENDS', 'You are already friends with this user', 409);
    }

    if (existing.status === 'blocked') {
      throw new AppError('FRIENDSHIP_BLOCKED', 'This friendship is blocked', 403);
    }

    if (existing.status === 'pending') {
      throw new AppError('FRIEND_REQUEST_EXISTS', 'A friend request already exists', 409);
    }

    const { data, error } = await friendRepository.update(existing.id, {
      requester_id: requesterId,
      addressee_id: validated.addresseeId,
      status: 'pending',
    });
    assertNoError(error);

    return mapFriendshipRow(data);
  },

  acceptRequest: async (userId: string, friendshipId: string): Promise<Friendship> => {
    const { data: friendship, error } = await friendRepository.findById(friendshipId);
    assertNoError(error);

    if (friendship === null) {
      throw new AppError('FRIENDSHIP_NOT_FOUND', 'Friend request not found', 404);
    }

    if (friendship.addressee_id !== userId) {
      throw new AppError('NOT_FRIENDSHIP_ADDRESSEE', 'Only the recipient can accept this request', 403);
    }

    if (friendship.status !== 'pending') {
      throw new AppError('FRIENDSHIP_NOT_PENDING', 'This friend request is no longer pending', 409);
    }

    const { data, error: updateError } = await friendRepository.update(friendshipId, {
      status: 'accepted',
    });
    assertNoError(updateError);

    return mapFriendshipRow(data);
  },

  rejectRequest: async (userId: string, friendshipId: string): Promise<Friendship> => {
    const { data: friendship, error } = await friendRepository.findById(friendshipId);
    assertNoError(error);

    if (friendship === null) {
      throw new AppError('FRIENDSHIP_NOT_FOUND', 'Friend request not found', 404);
    }

    if (friendship.addressee_id !== userId) {
      throw new AppError('NOT_FRIENDSHIP_ADDRESSEE', 'Only the recipient can reject this request', 403);
    }

    if (friendship.status !== 'pending') {
      throw new AppError('FRIENDSHIP_NOT_PENDING', 'This friend request is no longer pending', 409);
    }

    const { data, error: updateError } = await friendRepository.update(friendshipId, {
      status: 'rejected',
    });
    assertNoError(updateError);

    return mapFriendshipRow(data);
  },

  removeFriendship: async (userId: string, friendshipId: string): Promise<void> => {
    const { data: friendship, error } = await friendRepository.findById(friendshipId);
    assertNoError(error);

    if (friendship === null) {
      throw new AppError('FRIENDSHIP_NOT_FOUND', 'Friendship not found', 404);
    }

    assertFriendshipInvolved(userId, friendship);

    const { error: deleteError } = await friendRepository.delete(friendshipId);
    assertNoError(deleteError);
  },
};
