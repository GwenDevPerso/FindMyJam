import { ZodError } from 'zod';

import { AppError } from '@/lib/errors/app-error';
import type { JamMessageRow, JamMessageWithSenderRow } from '@/lib/supabase/types';
import { chatRepository } from '@/repositories/chat.repository';
import { chatService } from '@/services/chat.service';
import { buildPostgrestError } from '@/test-utils/supabase-errors';

jest.mock('@/repositories/chat.repository');

const mockedChatRepository = jest.mocked(chatRepository);

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SENDER_ID = '22222222-2222-4222-8222-222222222222';
const JAM_ID = '33333333-3333-4333-8333-333333333333';
const MESSAGE_ID = '44444444-4444-4444-8444-444444444444';
const OLDER_MESSAGE_ID = '55555555-5555-4555-8555-555555555555';
const SERIES_ID = '77777777-7777-4777-8777-777777777777';

function buildMessageRow(overrides: Partial<JamMessageWithSenderRow>): JamMessageWithSenderRow {
  return {
    id: MESSAGE_ID,
    jam_id: null,
    series_id: SERIES_ID,
    sender_id: SENDER_ID,
    body: 'Who brings the bass amp?',
    created_at: '2026-10-24T18:00:00.000Z',
    sender_username: 'miles',
    sender_avatar_url: null,
    ...overrides,
  };
}

function buildInsertedRow(overrides: Partial<JamMessageRow>): JamMessageRow {
  return {
    id: MESSAGE_ID,
    jam_id: null,
    series_id: SERIES_ID,
    sender_id: USER_ID,
    body: 'I do',
    created_at: '2026-10-24T18:01:00.000Z',
    ...overrides,
  };
}

describe('chatService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('list', () => {
    it('loads the first page of a series room and maps the messages', async () => {
      mockedChatRepository.list.mockResolvedValue({
        data: [buildMessageRow({ sender_avatar_url: 'https://example.com/miles.png' })],
        error: null,
      });

      const result = await chatService.list({ kind: 'series', seriesId: SERIES_ID }, 30, null);

      expect(mockedChatRepository.list).toHaveBeenCalledWith({
        jamId: null,
        seriesId: SERIES_ID,
        limit: 30,
        cursor: null,
      });
      expect(result.messages).toEqual([
        {
          id: MESSAGE_ID,
          senderId: SENDER_ID,
          senderUsername: 'miles',
          senderAvatarUrl: 'https://example.com/miles.png',
          body: 'Who brings the bass amp?',
          createdAt: '2026-10-24T18:00:00.000Z',
        },
      ]);
    });

    it('queries a one-off jam room by jam id', async () => {
      mockedChatRepository.list.mockResolvedValue({ data: [], error: null });

      await chatService.list({ kind: 'jam', jamId: JAM_ID }, 30, null);

      expect(mockedChatRepository.list).toHaveBeenCalledWith({
        jamId: JAM_ID,
        seriesId: null,
        limit: 30,
        cursor: null,
      });
    });

    it('passes the cursor through', async () => {
      mockedChatRepository.list.mockResolvedValue({ data: [], error: null });
      const cursor = { createdAt: '2026-10-24T18:00:00.000Z', id: MESSAGE_ID };

      await chatService.list({ kind: 'jam', jamId: JAM_ID }, 30, cursor);

      expect(mockedChatRepository.list).toHaveBeenCalledWith(expect.objectContaining({ cursor }));
    });

    it('returns a cursor on the oldest message when the page is full', async () => {
      mockedChatRepository.list.mockResolvedValue({
        data: [
          buildMessageRow({ id: MESSAGE_ID, created_at: '2026-10-24T18:00:00.000Z' }),
          buildMessageRow({ id: OLDER_MESSAGE_ID, created_at: '2026-10-24T17:00:00.000Z' }),
        ],
        error: null,
      });

      const result = await chatService.list({ kind: 'series', seriesId: SERIES_ID }, 2, null);

      expect(result.nextCursor).toEqual({ createdAt: '2026-10-24T17:00:00.000Z', id: OLDER_MESSAGE_ID });
    });

    it('returns no cursor on the last page', async () => {
      mockedChatRepository.list.mockResolvedValue({ data: [buildMessageRow({})], error: null });

      const result = await chatService.list({ kind: 'series', seriesId: SERIES_ID }, 2, null);

      expect(result.nextCursor).toBeNull();
    });

    it('rejects an invalid limit without querying', async () => {
      await expect(chatService.list({ kind: 'series', seriesId: SERIES_ID }, 0, null)).rejects.toBeInstanceOf(
        ZodError,
      );
      expect(mockedChatRepository.list).not.toHaveBeenCalled();
    });

    it('maps a Supabase error to an AppError', async () => {
      mockedChatRepository.list.mockResolvedValue({
        data: [],
        error: buildPostgrestError({ code: '42501', message: 'permission denied' }),
      });

      await expect(chatService.list({ kind: 'series', seriesId: SERIES_ID }, 30, null)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('send', () => {
    it('posts a trimmed message to a series room', async () => {
      mockedChatRepository.send.mockResolvedValue({ data: buildInsertedRow({}), error: null });

      await chatService.send(USER_ID, { kind: 'series', seriesId: SERIES_ID }, '  I do \n');

      expect(mockedChatRepository.send).toHaveBeenCalledWith({
        jam_id: null,
        series_id: SERIES_ID,
        sender_id: USER_ID,
        body: 'I do',
      });
    });

    it('posts to a one-off jam room', async () => {
      mockedChatRepository.send.mockResolvedValue({
        data: buildInsertedRow({ jam_id: JAM_ID, series_id: null }),
        error: null,
      });

      await chatService.send(USER_ID, { kind: 'jam', jamId: JAM_ID }, 'I do');

      expect(mockedChatRepository.send).toHaveBeenCalledWith({
        jam_id: JAM_ID,
        series_id: null,
        sender_id: USER_ID,
        body: 'I do',
      });
    });

    it('rejects an empty message without sending it', async () => {
      await expect(chatService.send(USER_ID, { kind: 'jam', jamId: JAM_ID }, '   ')).rejects.toBeInstanceOf(
        ZodError,
      );
      expect(mockedChatRepository.send).not.toHaveBeenCalled();
    });

    it('maps a refused insert (not a member of the room) to an AppError', async () => {
      mockedChatRepository.send.mockResolvedValue({
        data: null,
        error: buildPostgrestError({ code: '42501', message: 'new row violates row-level security policy' }),
      });

      const promise = chatService.send(USER_ID, { kind: 'jam', jamId: JAM_ID }, 'Hello');

      await expect(promise).rejects.toBeInstanceOf(AppError);
      await expect(promise).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });
  });

  describe('delete', () => {
    it("deletes the user's own message", async () => {
      mockedChatRepository.delete.mockResolvedValue({ error: null });

      await chatService.delete(USER_ID, MESSAGE_ID);

      expect(mockedChatRepository.delete).toHaveBeenCalledWith(USER_ID, MESSAGE_ID);
    });

    it('maps a Supabase error to an AppError', async () => {
      mockedChatRepository.delete.mockResolvedValue({ error: buildPostgrestError({}) });

      await expect(chatService.delete(USER_ID, MESSAGE_ID)).rejects.toBeInstanceOf(AppError);
    });
  });
});
