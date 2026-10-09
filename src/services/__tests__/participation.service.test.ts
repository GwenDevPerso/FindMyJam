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
});
