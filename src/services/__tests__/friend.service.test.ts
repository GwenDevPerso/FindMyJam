import { ZodError } from 'zod';

import type { FriendshipRow, SearchProfileRow } from '@/lib/supabase/types';
import { friendRepository, type FriendshipWithProfiles } from '@/repositories/friend.repository';
import { friendService } from '@/services/friend.service';
import { buildPostgrestError } from '@/test-utils/supabase-errors';

jest.mock('@/repositories/friend.repository');

const mockedFriendRepository = jest.mocked(friendRepository);

const ME = '11111111-1111-4111-8111-111111111111';
const ALICE = '22222222-2222-4222-8222-222222222222';
const BOB = '33333333-3333-4333-8333-333333333333';
const FRIENDSHIP_ID = '44444444-4444-4444-8444-444444444444';

function buildFriendshipRow(overrides: Partial<FriendshipRow>): FriendshipRow {
  return {
    id: FRIENDSHIP_ID,
    requester_id: ALICE,
    addressee_id: ME,
    status: 'pending',
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-02T10:00:00.000Z',
    ...overrides,
  };
}

function buildFriendshipWithProfiles(overrides: Partial<FriendshipRow>): FriendshipWithProfiles {
  return {
    ...buildFriendshipRow(overrides),
    requester: { id: ALICE, username: 'alice', avatar_url: 'https://cdn.test/alice.jpg' },
    addressee: { id: ME, username: 'me', avatar_url: null },
  };
}

function buildSearchProfileRow(overrides: Partial<SearchProfileRow>): SearchProfileRow {
  return {
    id: ALICE,
    username: 'alice',
    avatar_url: null,
    bio: 'Bass player',
    skill_level: 'advanced',
    location_name: 'Lyon',
    latitude: 45.76,
    longitude: 4.83,
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('friendService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('sendRequest', () => {
    it('creates a pending request when the two users have no relation yet', async () => {
      mockedFriendRepository.findBetweenUsers.mockResolvedValue({ data: null, error: null });
      mockedFriendRepository.create.mockResolvedValue({
        data: buildFriendshipRow({ requester_id: ME, addressee_id: ALICE }),
        error: null,
      });

      const friendship = await friendService.sendRequest(ME, ALICE);

      expect(mockedFriendRepository.create).toHaveBeenCalledWith({
        requester_id: ME,
        addressee_id: ALICE,
        status: 'pending',
      });
      expect(friendship).toEqual({
        id: FRIENDSHIP_ID,
        requesterId: ME,
        addresseeId: ALICE,
        status: 'pending',
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: '2026-07-02T10:00:00.000Z',
      });
    });

    it('refuses a request to oneself without querying the repository', async () => {
      await expect(friendService.sendRequest(ME, ME)).rejects.toMatchObject({
        code: 'CANNOT_FRIEND_SELF',
        statusCode: 400,
      });

      expect(mockedFriendRepository.findBetweenUsers).not.toHaveBeenCalled();
    });

    it('rejects an addressee id that is not a uuid', async () => {
      await expect(friendService.sendRequest(ME, 'alice')).rejects.toBeInstanceOf(ZodError);
    });

    it.each([
      ['accepted', 'ALREADY_FRIENDS'],
      ['blocked', 'FRIENDSHIP_BLOCKED'],
      ['pending', 'FRIEND_REQUEST_EXISTS'],
    ] as const)('refuses when a %s friendship already exists (%s)', async (status, expectedCode) => {
      mockedFriendRepository.findBetweenUsers.mockResolvedValue({
        data: buildFriendshipRow({ status }),
        error: null,
      });

      await expect(friendService.sendRequest(ME, ALICE)).rejects.toMatchObject({ code: expectedCode });

      expect(mockedFriendRepository.create).not.toHaveBeenCalled();
      expect(mockedFriendRepository.update).not.toHaveBeenCalled();
    });

    it('reopens a previously rejected friendship as a new pending request from the sender', async () => {
      mockedFriendRepository.findBetweenUsers.mockResolvedValue({
        data: buildFriendshipRow({ status: 'rejected', requester_id: ALICE, addressee_id: ME }),
        error: null,
      });
      mockedFriendRepository.update.mockResolvedValue({
        data: buildFriendshipRow({ status: 'pending', requester_id: ME, addressee_id: ALICE }),
        error: null,
      });

      const friendship = await friendService.sendRequest(ME, ALICE);

      expect(mockedFriendRepository.update).toHaveBeenCalledWith(FRIENDSHIP_ID, {
        requester_id: ME,
        addressee_id: ALICE,
        status: 'pending',
      });
      expect(mockedFriendRepository.create).not.toHaveBeenCalled();
      expect(friendship.status).toBe('pending');
    });

    it('maps a unique violation raised by the insert to FRIEND_REQUEST_EXISTS', async () => {
      mockedFriendRepository.findBetweenUsers.mockResolvedValue({ data: null, error: null });
      mockedFriendRepository.create.mockResolvedValue({
        data: null as unknown as FriendshipRow,
        error: buildPostgrestError({
          code: '23505',
          message: 'duplicate key value violates unique constraint "friendships_pair_key"',
        }),
      });

      await expect(friendService.sendRequest(ME, ALICE)).rejects.toMatchObject({
        name: 'AppError',
        code: 'FRIEND_REQUEST_EXISTS',
      });
    });
  });

  describe.each([
    ['acceptRequest', 'accepted'],
    ['rejectRequest', 'rejected'],
  ] as const)('%s', (method, newStatus) => {
    it(`marks a pending request addressed to the user as ${newStatus}`, async () => {
      mockedFriendRepository.findById.mockResolvedValue({ data: buildFriendshipRow({}), error: null });
      mockedFriendRepository.update.mockResolvedValue({
        data: buildFriendshipRow({ status: newStatus }),
        error: null,
      });

      const friendship = await friendService[method](ME, FRIENDSHIP_ID);

      expect(mockedFriendRepository.update).toHaveBeenCalledWith(FRIENDSHIP_ID, { status: newStatus });
      expect(friendship).toMatchObject({ id: FRIENDSHIP_ID, requesterId: ALICE, addresseeId: ME, status: newStatus });
    });

    it('throws FRIENDSHIP_NOT_FOUND when the request does not exist', async () => {
      mockedFriendRepository.findById.mockResolvedValue({ data: null, error: null });

      await expect(friendService[method](ME, FRIENDSHIP_ID)).rejects.toMatchObject({
        code: 'FRIENDSHIP_NOT_FOUND',
        statusCode: 404,
      });
    });

    it('refuses the requester acting on their own request', async () => {
      mockedFriendRepository.findById.mockResolvedValue({ data: buildFriendshipRow({}), error: null });

      await expect(friendService[method](ALICE, FRIENDSHIP_ID)).rejects.toMatchObject({
        code: 'NOT_FRIENDSHIP_ADDRESSEE',
      });

      expect(mockedFriendRepository.update).not.toHaveBeenCalled();
    });

    it('refuses a request that is no longer pending', async () => {
      mockedFriendRepository.findById.mockResolvedValue({
        data: buildFriendshipRow({ status: 'accepted' }),
        error: null,
      });

      await expect(friendService[method](ME, FRIENDSHIP_ID)).rejects.toMatchObject({
        code: 'FRIENDSHIP_NOT_PENDING',
      });

      expect(mockedFriendRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('removeFriendship', () => {
    it.each([
      ['the requester', ALICE],
      ['the addressee', ME],
    ])('lets %s delete the friendship', async (_role, userId) => {
      mockedFriendRepository.findById.mockResolvedValue({ data: buildFriendshipRow({}), error: null });
      mockedFriendRepository.delete.mockResolvedValue({ error: null });

      await friendService.removeFriendship(userId, FRIENDSHIP_ID);

      expect(mockedFriendRepository.delete).toHaveBeenCalledWith(FRIENDSHIP_ID);
    });

    it('refuses a user who is not part of the friendship', async () => {
      mockedFriendRepository.findById.mockResolvedValue({ data: buildFriendshipRow({}), error: null });

      await expect(friendService.removeFriendship(BOB, FRIENDSHIP_ID)).rejects.toMatchObject({
        code: 'NOT_FRIENDSHIP_INVOLVED',
        statusCode: 403,
      });

      expect(mockedFriendRepository.delete).not.toHaveBeenCalled();
    });

    it('throws FRIENDSHIP_NOT_FOUND when the friendship does not exist', async () => {
      mockedFriendRepository.findById.mockResolvedValue({ data: null, error: null });

      await expect(friendService.removeFriendship(ME, FRIENDSHIP_ID)).rejects.toMatchObject({
        code: 'FRIENDSHIP_NOT_FOUND',
      });
    });
  });

  describe('listAccepted', () => {
    it('returns the other user of each friendship, whichever side sent the request', async () => {
      mockedFriendRepository.findByUserAndStatus.mockResolvedValue({
        data: [
          buildFriendshipWithProfiles({ status: 'accepted' }),
          {
            ...buildFriendshipRow({ id: 'f-2', status: 'accepted', requester_id: ME, addressee_id: BOB }),
            requester: { id: ME, username: 'me', avatar_url: null },
            addressee: { id: BOB, username: 'bob', avatar_url: null },
          },
        ],
        error: null,
      });

      const friends = await friendService.listAccepted(ME);

      expect(mockedFriendRepository.findByUserAndStatus).toHaveBeenCalledWith(ME, 'accepted');
      expect(friends).toEqual([
        {
          friendshipId: FRIENDSHIP_ID,
          profile: { id: ALICE, username: 'alice', avatarUrl: 'https://cdn.test/alice.jpg' },
          friendsSince: '2026-07-02T10:00:00.000Z',
        },
        {
          friendshipId: 'f-2',
          profile: { id: BOB, username: 'bob', avatarUrl: null },
          friendsSince: '2026-07-02T10:00:00.000Z',
        },
      ]);
    });
  });

  describe('listIncomingRequests', () => {
    it('returns the requester profile and the request date', async () => {
      mockedFriendRepository.findPendingIncoming.mockResolvedValue({
        data: [buildFriendshipWithProfiles({})],
        error: null,
      });

      const requests = await friendService.listIncomingRequests(ME);

      expect(requests).toEqual([
        {
          friendshipId: FRIENDSHIP_ID,
          profile: { id: ALICE, username: 'alice', avatarUrl: 'https://cdn.test/alice.jpg' },
          requestedAt: '2026-07-01T10:00:00.000Z',
        },
      ]);
    });

    it('throws the mapped AppError when the query fails', async () => {
      mockedFriendRepository.findPendingIncoming.mockResolvedValue({
        data: [],
        error: buildPostgrestError({ code: '42501', message: 'permission denied' }),
      });

      await expect(friendService.listIncomingRequests(ME)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });
  });

  describe('searchUsers', () => {
    const input = { query: 'ali', instrumentIds: [], styleIds: [], limit: 20 };

    it('sends empty filters to the repository as null', async () => {
      mockedFriendRepository.searchProfiles.mockResolvedValue({ data: [], error: null });

      await friendService.searchUsers(ME, { ...input, query: '  ' });

      expect(mockedFriendRepository.searchProfiles).toHaveBeenCalledWith({
        query: null,
        instrumentIds: null,
        styleIds: null,
        limit: 20,
      });
    });

    it('leaves the current user out of the results', async () => {
      mockedFriendRepository.searchProfiles.mockResolvedValue({
        data: [buildSearchProfileRow({ id: ME, username: 'me' })],
        error: null,
      });

      const results = await friendService.searchUsers(ME, input);

      expect(results).toEqual([]);
      expect(mockedFriendRepository.findRelationsForUsers).not.toHaveBeenCalled();
    });

    it('maps a profile without any friendship to relation "none"', async () => {
      mockedFriendRepository.searchProfiles.mockResolvedValue({
        data: [buildSearchProfileRow({})],
        error: null,
      });
      mockedFriendRepository.findRelationsForUsers.mockResolvedValue({ data: [], error: null });

      const results = await friendService.searchUsers(ME, input);

      expect(mockedFriendRepository.findRelationsForUsers).toHaveBeenCalledWith(ME, [ALICE]);
      expect(results).toEqual([
        {
          id: ALICE,
          username: 'alice',
          avatarUrl: null,
          bio: 'Bass player',
          skillLevel: 'advanced',
          locationName: 'Lyon',
          relation: 'none',
          friendshipId: null,
        },
      ]);
    });

    it.each([
      [{ status: 'accepted' }, 'friends'],
      [{ status: 'blocked' }, 'blocked'],
      [{ status: 'rejected' }, 'rejected'],
      [{ status: 'pending', requester_id: ME, addressee_id: ALICE }, 'pending_outgoing'],
      [{ status: 'pending', requester_id: ALICE, addressee_id: ME }, 'pending_incoming'],
    ] as const)('resolves friendship %j to relation %s', async (friendship, expectedRelation) => {
      mockedFriendRepository.searchProfiles.mockResolvedValue({
        data: [buildSearchProfileRow({})],
        error: null,
      });
      mockedFriendRepository.findRelationsForUsers.mockResolvedValue({
        data: [buildFriendshipRow(friendship)],
        error: null,
      });

      const results = await friendService.searchUsers(ME, input);

      expect(results[0]).toMatchObject({ relation: expectedRelation, friendshipId: FRIENDSHIP_ID });
    });

    it('ignores friendships that involve another pair of users', async () => {
      mockedFriendRepository.searchProfiles.mockResolvedValue({
        data: [buildSearchProfileRow({})],
        error: null,
      });
      mockedFriendRepository.findRelationsForUsers.mockResolvedValue({
        data: [buildFriendshipRow({ status: 'accepted', requester_id: BOB, addressee_id: ME })],
        error: null,
      });

      const results = await friendService.searchUsers(ME, input);

      expect(results[0]).toMatchObject({ relation: 'none', friendshipId: null });
    });
  });
});
