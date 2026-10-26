import { jamRepository } from '@/repositories/jam.repository';
import { participationRepository } from '@/repositories/participation.repository';
import { participationService } from '@/services/participation.service';
import { buildJamRow } from '@/test-utils/jam-rows';
import { buildPostgrestError } from '@/test-utils/supabase-errors';

jest.mock('@/repositories/jam.repository');
jest.mock('@/repositories/participation.repository');

const mockedJamRepository = jest.mocked(jamRepository);
const mockedParticipationRepository = jest.mocked(participationRepository);

const JAM_ID = '11111111-1111-4111-8111-111111111111';
const CREATOR_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = '33333333-3333-4333-8333-333333333333';
const OTHER_USER_ID = '44444444-4444-4444-8444-444444444444';

function mockJoinableJam(participantCount: number, maxParticipants: number): void {
  mockedJamRepository.findById.mockResolvedValue({
    data: buildJamRow({ id: JAM_ID, creator_id: CREATOR_ID, max_participants: maxParticipants }),
    error: null,
  });
  mockedParticipationRepository.isParticipant.mockResolvedValue({ data: false, error: null });
  mockedJamRepository.getParticipantCount.mockResolvedValue({ data: participantCount, error: null });
  mockedParticipationRepository.join.mockResolvedValue({ error: null });
}

describe('participationService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('join', () => {
    it('adds the user to a jam that still has room', async () => {
      mockJoinableJam(5, 6);

      await participationService.join(USER_ID, JAM_ID);

      expect(mockedParticipationRepository.join).toHaveBeenCalledWith(JAM_ID, USER_ID);
    });

    it('throws JAM_NOT_FOUND when the jam does not exist', async () => {
      mockedJamRepository.findById.mockResolvedValue({ data: null, error: null });

      await expect(participationService.join(USER_ID, JAM_ID)).rejects.toMatchObject({
        code: 'JAM_NOT_FOUND',
        statusCode: 404,
      });
      expect(mockedParticipationRepository.join).not.toHaveBeenCalled();
    });

    it('refuses the creator joining their own jam', async () => {
      mockJoinableJam(0, 6);

      await expect(participationService.join(CREATOR_ID, JAM_ID)).rejects.toMatchObject({
        code: 'CREATOR_CANNOT_JOIN',
      });
      expect(mockedParticipationRepository.join).not.toHaveBeenCalled();
    });

    it('refuses a user who has already joined', async () => {
      mockJoinableJam(1, 6);
      mockedParticipationRepository.isParticipant.mockResolvedValue({ data: true, error: null });

      await expect(participationService.join(USER_ID, JAM_ID)).rejects.toMatchObject({
        code: 'ALREADY_JOINED',
      });
      expect(mockedParticipationRepository.join).not.toHaveBeenCalled();
    });

    it('refuses when the jam has reached its maximum number of participants', async () => {
      mockJoinableJam(6, 6);

      await expect(participationService.join(USER_ID, JAM_ID)).rejects.toMatchObject({
        code: 'JAM_FULL',
        statusCode: 409,
      });
      expect(mockedParticipationRepository.join).not.toHaveBeenCalled();
    });

    it('maps a "jam is full" error raised by the database on insert', async () => {
      mockJoinableJam(5, 6);
      mockedParticipationRepository.join.mockResolvedValue({
        error: buildPostgrestError({ code: 'P0001', message: 'Jam is full' }),
      });

      await expect(participationService.join(USER_ID, JAM_ID)).rejects.toMatchObject({
        name: 'AppError',
        code: 'JAM_FULL',
      });
    });
  });

  describe('leave', () => {
    it('removes a participant from the jam', async () => {
      mockedParticipationRepository.isParticipant.mockResolvedValue({ data: true, error: null });
      mockedParticipationRepository.leave.mockResolvedValue({ error: null });

      await participationService.leave(USER_ID, JAM_ID);

      expect(mockedParticipationRepository.leave).toHaveBeenCalledWith(JAM_ID, USER_ID);
    });

    it('throws NOT_PARTICIPANT when the user has not joined', async () => {
      mockedParticipationRepository.isParticipant.mockResolvedValue({ data: false, error: null });

      await expect(participationService.leave(USER_ID, JAM_ID)).rejects.toMatchObject({
        code: 'NOT_PARTICIPANT',
        statusCode: 404,
      });
      expect(mockedParticipationRepository.leave).not.toHaveBeenCalled();
    });

    it('throws the mapped AppError when the delete fails', async () => {
      mockedParticipationRepository.isParticipant.mockResolvedValue({ data: true, error: null });
      mockedParticipationRepository.leave.mockResolvedValue({
        error: buildPostgrestError({ code: '42501', message: 'permission denied' }),
      });

      await expect(participationService.leave(USER_ID, JAM_ID)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('getWaitlistStatus', () => {
    it('gives the rank of the user among the people waiting, whatever the stored positions', async () => {
      mockedParticipationRepository.findWaitlist.mockResolvedValue({
        data: [
          { user_id: OTHER_USER_ID, position: 3 },
          { user_id: USER_ID, position: 7 },
        ],
        error: null,
      });

      await expect(participationService.getWaitlistStatus(USER_ID, JAM_ID)).resolves.toEqual({ position: 2, size: 2 });
      expect(mockedParticipationRepository.findWaitlist).toHaveBeenCalledWith(JAM_ID);
    });

    it('has no position when the user is not waiting', async () => {
      mockedParticipationRepository.findWaitlist.mockResolvedValue({
        data: [{ user_id: OTHER_USER_ID, position: 1 }],
        error: null,
      });

      await expect(participationService.getWaitlistStatus(USER_ID, JAM_ID)).resolves.toEqual({
        position: null,
        size: 1,
      });
    });

    it('throws the mapped AppError when the read fails', async () => {
      mockedParticipationRepository.findWaitlist.mockResolvedValue({
        data: [],
        error: buildPostgrestError({ code: '42501', message: 'permission denied' }),
      });

      await expect(participationService.getWaitlistStatus(USER_ID, JAM_ID)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('joinWaitlist', () => {
    function mockFullJam(): void {
      mockJoinableJam(6, 6);
      mockedParticipationRepository.findWaitlist.mockResolvedValue({ data: [], error: null });
      mockedParticipationRepository.joinWaitlist.mockResolvedValue({ error: null });
    }

    it('adds the user to the waitlist of a full jam', async () => {
      mockFullJam();

      await participationService.joinWaitlist(USER_ID, JAM_ID);

      expect(mockedParticipationRepository.joinWaitlist).toHaveBeenCalledWith(JAM_ID, USER_ID);
    });

    it('throws JAM_NOT_FOUND when the jam does not exist', async () => {
      mockedJamRepository.findById.mockResolvedValue({ data: null, error: null });

      await expect(participationService.joinWaitlist(USER_ID, JAM_ID)).rejects.toMatchObject({
        code: 'JAM_NOT_FOUND',
      });
      expect(mockedParticipationRepository.joinWaitlist).not.toHaveBeenCalled();
    });

    it('refuses the creator', async () => {
      mockFullJam();

      await expect(participationService.joinWaitlist(CREATOR_ID, JAM_ID)).rejects.toMatchObject({
        code: 'CREATOR_CANNOT_JOIN',
      });
      expect(mockedParticipationRepository.joinWaitlist).not.toHaveBeenCalled();
    });

    it('refuses a participant', async () => {
      mockFullJam();
      mockedParticipationRepository.isParticipant.mockResolvedValue({ data: true, error: null });

      await expect(participationService.joinWaitlist(USER_ID, JAM_ID)).rejects.toMatchObject({
        code: 'ALREADY_JOINED',
      });
      expect(mockedParticipationRepository.joinWaitlist).not.toHaveBeenCalled();
    });

    it('refuses when the jam still has room', async () => {
      mockFullJam();
      mockedJamRepository.getParticipantCount.mockResolvedValue({ data: 5, error: null });

      await expect(participationService.joinWaitlist(USER_ID, JAM_ID)).rejects.toMatchObject({
        code: 'JAM_NOT_FULL',
        statusCode: 409,
      });
      expect(mockedParticipationRepository.joinWaitlist).not.toHaveBeenCalled();
    });

    it('refuses a user who is already waiting', async () => {
      mockFullJam();
      mockedParticipationRepository.findWaitlist.mockResolvedValue({
        data: [{ user_id: USER_ID, position: 1 }],
        error: null,
      });

      await expect(participationService.joinWaitlist(USER_ID, JAM_ID)).rejects.toMatchObject({
        code: 'ALREADY_ON_WAITLIST',
        statusCode: 409,
      });
      expect(mockedParticipationRepository.joinWaitlist).not.toHaveBeenCalled();
    });

    it('maps an error raised by the database on insert', async () => {
      mockFullJam();
      mockedParticipationRepository.joinWaitlist.mockResolvedValue({
        error: buildPostgrestError({ code: 'P0001', message: 'Jam 1111 is not full' }),
      });

      await expect(participationService.joinWaitlist(USER_ID, JAM_ID)).rejects.toMatchObject({
        name: 'AppError',
        code: 'JAM_NOT_FULL',
      });
    });
  });

  describe('leaveWaitlist', () => {
    it('removes the user from the waitlist', async () => {
      mockedParticipationRepository.findWaitlist.mockResolvedValue({
        data: [{ user_id: USER_ID, position: 1 }],
        error: null,
      });
      mockedParticipationRepository.leaveWaitlist.mockResolvedValue({ error: null });

      await participationService.leaveWaitlist(USER_ID, JAM_ID);

      expect(mockedParticipationRepository.leaveWaitlist).toHaveBeenCalledWith(JAM_ID, USER_ID);
    });

    it('throws NOT_ON_WAITLIST when the user is not waiting', async () => {
      mockedParticipationRepository.findWaitlist.mockResolvedValue({ data: [], error: null });

      await expect(participationService.leaveWaitlist(USER_ID, JAM_ID)).rejects.toMatchObject({
        code: 'NOT_ON_WAITLIST',
        statusCode: 404,
      });
      expect(mockedParticipationRepository.leaveWaitlist).not.toHaveBeenCalled();
    });
  });
});
