import { ZodError } from 'zod';

import type { UpdateProfileInput } from '@/features/profile/types';
import type { ProfileRow } from '@/lib/supabase/types';
import { jamRepository } from '@/repositories/jam.repository';
import { profileRepository } from '@/repositories/profile.repository';
import { referenceRepository } from '@/repositories/reference.repository';
import { profileService } from '@/services/profile.service';
import { buildJamRow } from '@/test-utils/jam-rows';
import { buildPostgrestError } from '@/test-utils/supabase-errors';

jest.mock('@/repositories/jam.repository');
jest.mock('@/repositories/profile.repository');
jest.mock('@/repositories/reference.repository');

const mockedJamRepository = jest.mocked(jamRepository);
const mockedProfileRepository = jest.mocked(profileRepository);
const mockedReferenceRepository = jest.mocked(referenceRepository);

const USER_ID = '11111111-1111-4111-8111-111111111111';
const GUITAR_ID = '22222222-2222-4222-8222-222222222222';
const DRUMS_ID = '33333333-3333-4333-8333-333333333333';
const JAZZ_ID = '44444444-4444-4444-8444-444444444444';
const ROCK_ID = '55555555-5555-4555-8555-555555555555';

const CREATED_AT = '2026-01-01T00:00:00.000Z';

function buildProfileRow(overrides: Partial<ProfileRow>): ProfileRow {
  return {
    id: USER_ID,
    username: 'miles',
    avatar_url: 'https://cdn.test/miles.jpg',
    bio: 'Trumpet',
    skill_level: 'expert',
    location_name: 'Paris',
    latitude: 48.85,
    longitude: 2.35,
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-02T10:00:00.000Z',
    ...overrides,
  };
}

function buildUpdateProfileInput(overrides: Partial<UpdateProfileInput>): UpdateProfileInput {
  return {
    username: 'miles',
    bio: 'Trumpet',
    skillLevel: 'expert',
    locationName: 'Paris',
    latitude: 48.85,
    longitude: 2.35,
    instrumentIds: [GUITAR_ID],
    styleIds: [JAZZ_ID],
    ...overrides,
  };
}

function mockProfileLookup(): void {
  mockedProfileRepository.findById.mockResolvedValue({ data: buildProfileRow({}), error: null });
  mockedProfileRepository.getInstrumentIds.mockResolvedValue({ data: [GUITAR_ID], error: null });
  mockedProfileRepository.getStyleIds.mockResolvedValue({ data: [JAZZ_ID], error: null });
  mockedReferenceRepository.getInstruments.mockResolvedValue({
    data: [
      { id: DRUMS_ID, name: 'Drums', slug: 'drums', created_at: CREATED_AT },
      { id: GUITAR_ID, name: 'Guitar', slug: 'guitar', created_at: CREATED_AT },
    ],
    error: null,
  });
  mockedReferenceRepository.getMusicStyles.mockResolvedValue({
    data: [
      { id: JAZZ_ID, name: 'Jazz', slug: 'jazz', created_at: CREATED_AT },
      { id: ROCK_ID, name: 'Rock', slug: 'rock', created_at: CREATED_AT },
    ],
    error: null,
  });
}

function mockSuccessfulWrites(): void {
  mockedProfileRepository.update.mockResolvedValue({ data: buildProfileRow({}), error: null });
  mockedProfileRepository.setInstruments.mockResolvedValue({ error: null });
  mockedProfileRepository.setStyles.mockResolvedValue({ error: null });
}

describe('profileService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getById', () => {
    it('maps the profile row and resolves only its own instruments and styles', async () => {
      mockProfileLookup();

      const profile = await profileService.getById(USER_ID);

      expect(profile).toEqual({
        id: USER_ID,
        username: 'miles',
        avatarUrl: 'https://cdn.test/miles.jpg',
        bio: 'Trumpet',
        skillLevel: 'expert',
        locationName: 'Paris',
        latitude: 48.85,
        longitude: 2.35,
        instrumentIds: [GUITAR_ID],
        styleIds: [JAZZ_ID],
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: '2026-07-02T10:00:00.000Z',
        instruments: [{ id: GUITAR_ID, name: 'Guitar', slug: 'guitar' }],
        musicStyles: [{ id: JAZZ_ID, name: 'Jazz', slug: 'jazz' }],
      });
    });

    it('throws PROFILE_NOT_FOUND when there is no profile row', async () => {
      mockProfileLookup();
      mockedProfileRepository.findById.mockResolvedValue({ data: null, error: null });

      await expect(profileService.getById(USER_ID)).rejects.toMatchObject({
        code: 'PROFILE_NOT_FOUND',
        statusCode: 404,
      });
    });

    it('throws the mapped AppError when the profile query fails', async () => {
      mockProfileLookup();
      mockedProfileRepository.findById.mockResolvedValue({
        data: null,
        error: buildPostgrestError({ code: '42501', message: 'permission denied' }),
      });

      await expect(profileService.getById(USER_ID)).rejects.toMatchObject({
        name: 'AppError',
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('update', () => {
    it('writes the profile as a snake_case row, then its instruments and styles', async () => {
      mockProfileLookup();
      mockSuccessfulWrites();

      await profileService.update(USER_ID, buildUpdateProfileInput({ username: '  miles  ' }));

      expect(mockedProfileRepository.update).toHaveBeenCalledWith(USER_ID, {
        username: 'miles',
        bio: 'Trumpet',
        skill_level: 'expert',
        location_name: 'Paris',
        latitude: 48.85,
        longitude: 2.35,
      });
      expect(mockedProfileRepository.setInstruments).toHaveBeenCalledWith(USER_ID, [GUITAR_ID]);
      expect(mockedProfileRepository.setStyles).toHaveBeenCalledWith(USER_ID, [JAZZ_ID]);
    });

    it('stores an empty bio and location as null', async () => {
      mockProfileLookup();
      mockSuccessfulWrites();

      await profileService.update(
        USER_ID,
        buildUpdateProfileInput({ bio: '', locationName: '   ', latitude: null, longitude: null }),
      );

      expect(mockedProfileRepository.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ bio: null, location_name: null, latitude: null, longitude: null }),
      );
    });

    it('returns the freshly reloaded profile', async () => {
      mockProfileLookup();
      mockSuccessfulWrites();

      const profile = await profileService.update(USER_ID, buildUpdateProfileInput({}));

      expect(profile).toMatchObject({
        id: USER_ID,
        instruments: [{ id: GUITAR_ID, name: 'Guitar', slug: 'guitar' }],
      });
    });

    it('rejects an invalid username without writing anything', async () => {
      await expect(
        profileService.update(USER_ID, buildUpdateProfileInput({ username: 'no spaces allowed' })),
      ).rejects.toBeInstanceOf(ZodError);

      expect(mockedProfileRepository.update).not.toHaveBeenCalled();
    });

    it('stops and throws the mapped AppError when the profile update fails', async () => {
      mockSuccessfulWrites();
      mockedProfileRepository.update.mockResolvedValue({
        data: buildProfileRow({}),
        error: buildPostgrestError({ code: '42501', message: 'permission denied' }),
      });

      await expect(profileService.update(USER_ID, buildUpdateProfileInput({}))).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
      expect(mockedProfileRepository.setInstruments).not.toHaveBeenCalled();
    });
  });

  describe('uploadAvatar', () => {
    const avatarInput = { uri: 'file:///tmp/avatar.png', mimeType: 'image/png', fileSize: 1024 };

    afterEach(() => {
      jest.restoreAllMocks();
    });

    function mockFetchedImage(ok: boolean, body: ArrayBuffer): jest.SpiedFunction<typeof fetch> {
      return jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok,
        arrayBuffer: async () => body,
      } as unknown as Response);
    }

    it('uploads the bytes read from the image uri and returns the avatar url', async () => {
      const bytes = new ArrayBuffer(8);
      const fetchSpy = mockFetchedImage(true, bytes);
      mockedProfileRepository.uploadAvatar.mockResolvedValue({
        data: 'https://cdn.test/avatar.jpg?t=1',
        error: null,
      });

      const url = await profileService.uploadAvatar(USER_ID, avatarInput);

      expect(fetchSpy).toHaveBeenCalledWith('file:///tmp/avatar.png');
      expect(mockedProfileRepository.uploadAvatar).toHaveBeenCalledWith({
        userId: USER_ID,
        fileData: bytes,
        contentType: 'image/png',
      });
      expect(url).toBe('https://cdn.test/avatar.jpg?t=1');
    });

    it.each([
      ['an unsupported mime type', { mimeType: 'image/gif' }],
      ['a file larger than 5 MB', { fileSize: 5 * 1024 * 1024 + 1 }],
      ['an empty uri', { uri: '' }],
    ])('rejects %s before reading the file', async (_label, overrides) => {
      const fetchSpy = mockFetchedImage(true, new ArrayBuffer(8));

      await expect(
        profileService.uploadAvatar(USER_ID, { ...avatarInput, ...overrides }),
      ).rejects.toBeInstanceOf(ZodError);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(mockedProfileRepository.uploadAvatar).not.toHaveBeenCalled();
    });

    it('throws INVALID_AVATAR when the image cannot be read', async () => {
      mockFetchedImage(false, new ArrayBuffer(0));

      await expect(profileService.uploadAvatar(USER_ID, avatarInput)).rejects.toMatchObject({
        code: 'INVALID_AVATAR',
        statusCode: 400,
      });
      expect(mockedProfileRepository.uploadAvatar).not.toHaveBeenCalled();
    });

    it('throws INVALID_AVATAR with the storage message when the upload fails', async () => {
      mockFetchedImage(true, new ArrayBuffer(8));
      mockedProfileRepository.uploadAvatar.mockResolvedValue({
        data: '',
        error: { name: 'StorageError', message: 'Bucket not found' },
      });

      await expect(profileService.uploadAvatar(USER_ID, avatarInput)).rejects.toMatchObject({
        name: 'AppError',
        code: 'INVALID_AVATAR',
        message: 'Bucket not found',
      });
    });
  });

  describe('getCreatedJams', () => {
    it('maps each jam row with its participant count, instruments and styles', async () => {
      mockedJamRepository.findByCreatorId.mockResolvedValue({
        data: [buildJamRow({ creator_id: USER_ID })],
        error: null,
      });
      mockedJamRepository.getParticipantCount.mockResolvedValue({ data: 3, error: null });
      mockedJamRepository.getInstrumentIds.mockResolvedValue({ data: [GUITAR_ID], error: null });
      mockedJamRepository.getStyleIds.mockResolvedValue({ data: [JAZZ_ID], error: null });

      const jams = await profileService.getCreatedJams(USER_ID);

      expect(mockedJamRepository.findByCreatorId).toHaveBeenCalledWith(USER_ID);
      expect(jams).toEqual([
        {
          id: '11111111-1111-4111-8111-111111111111',
          creatorId: USER_ID,
          title: 'Sunday jazz session',
          description: 'Bring your own amp',
          startsAt: '2026-08-01T18:00:00.000Z',
          locationName: 'Le Caveau',
          latitude: 48.85,
          longitude: 2.35,
          skillLevel: 'intermediate',
          maxParticipants: 6,
          participantCount: 3,
          distanceMeters: null,
          instrumentIds: [GUITAR_ID],
          styleIds: [JAZZ_ID],
          createdAt: '2026-07-01T10:00:00.000Z',
          updatedAt: '2026-07-02T10:00:00.000Z',
        },
      ]);
    });
  });

  describe('getReferenceInstruments', () => {
    it('returns instruments without database-only columns', async () => {
      mockProfileLookup();

      await expect(profileService.getReferenceInstruments()).resolves.toEqual([
        { id: DRUMS_ID, name: 'Drums', slug: 'drums' },
        { id: GUITAR_ID, name: 'Guitar', slug: 'guitar' },
      ]);
    });
  });
});
