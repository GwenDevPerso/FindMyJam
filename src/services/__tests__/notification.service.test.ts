import { ZodError } from 'zod';

import type { NotificationPreferencesRow, NotificationRow } from '@/lib/supabase/types';
import {
  notificationPreferencesRepository,
  notificationRepository,
} from '@/repositories/notification.repository';
import { notificationService } from '@/services/notification.service';
import { buildPostgrestError } from '@/test-utils/supabase-errors';

jest.mock('@/repositories/notification.repository');

const mockedNotificationRepository = jest.mocked(notificationRepository);
const mockedPreferencesRepository = jest.mocked(notificationPreferencesRepository);

const USER_ID = '11111111-1111-4111-8111-111111111111';
const NOTIFICATION_ID = '22222222-2222-4222-8222-222222222222';
const JAM_ID = '33333333-3333-4333-8333-333333333333';

function buildNotificationRow(overrides: Partial<NotificationRow>): NotificationRow {
  return {
    id: NOTIFICATION_ID,
    user_id: USER_ID,
    type: 'JAM_STARTING_SOON',
    title: 'Jam starting soon',
    body: 'Sunday jazz session starts in 30 minutes',
    image_url: null,
    data: {},
    is_read: false,
    created_at: '2026-07-21T12:00:00.000Z',
    ...overrides,
  };
}

function buildPreferencesRow(overrides: Partial<NotificationPreferencesRow>): NotificationPreferencesRow {
  return {
    user_id: USER_ID,
    friend_requests: true,
    friend_acceptance: true,
    new_jams_city: false,
    new_jams_radius: true,
    new_matching_jams: true,
    jam_updates: true,
    jam_starting: true,
    marketing: false,
    radius_km: 25,
    quiet_hours_start: '22:00',
    quiet_hours_end: null,
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-02T10:00:00.000Z',
    ...overrides,
  };
}

describe('notificationService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('list', () => {
    it('maps notification rows and their snake_case data payload to the domain shape', async () => {
      mockedNotificationRepository.list.mockResolvedValue({
        data: [
          buildNotificationRow({
            image_url: 'https://cdn.test/jam.jpg',
            data: {
              jam_id: JAM_ID,
              action: 'open_jam',
              navigation_target: `/jams/${JAM_ID}`,
              minutes_before: 30,
            },
          }),
        ],
        error: null,
      });

      const result = await notificationService.list(USER_ID, 20, null);

      expect(result.notifications).toEqual([
        {
          id: NOTIFICATION_ID,
          userId: USER_ID,
          type: 'JAM_STARTING_SOON',
          title: 'Jam starting soon',
          body: 'Sunday jazz session starts in 30 minutes',
          imageUrl: 'https://cdn.test/jam.jpg',
          data: {
            jamId: JAM_ID,
            friendId: undefined,
            profileId: undefined,
            friendshipId: undefined,
            action: 'open_jam',
            navigationTarget: `/jams/${JAM_ID}`,
            minutesBefore: 30,
          },
          isRead: false,
          createdAt: '2026-07-21T12:00:00.000Z',
        },
      ]);
    });

    it('drops data fields that do not have the expected type', async () => {
      mockedNotificationRepository.list.mockResolvedValue({
        data: [buildNotificationRow({ data: { jam_id: 42, minutes_before: '30', friend_id: null } })],
        error: null,
      });

      const result = await notificationService.list(USER_ID, 20, null);

      expect(result.notifications[0].data.jamId).toBeUndefined();
      expect(result.notifications[0].data.minutesBefore).toBeUndefined();
      expect(result.notifications[0].data.friendId).toBeUndefined();
    });

    it('passes the user, limit and cursor to the repository', async () => {
      mockedNotificationRepository.list.mockResolvedValue({ data: [], error: null });
      const cursor = { createdAt: '2026-07-20T12:00:00.000Z', id: NOTIFICATION_ID };

      await notificationService.list(USER_ID, 5, cursor);

      expect(mockedNotificationRepository.list).toHaveBeenCalledWith({ userId: USER_ID, limit: 5, cursor });
    });

    it('returns a cursor pointing at the last notification when the page is full', async () => {
      mockedNotificationRepository.list.mockResolvedValue({
        data: [
          buildNotificationRow({}),
          buildNotificationRow({
            id: '44444444-4444-4444-8444-444444444444',
            created_at: '2026-07-20T08:00:00.000Z',
          }),
        ],
        error: null,
      });

      const result = await notificationService.list(USER_ID, 2, null);

      expect(result.nextCursor).toEqual({
        createdAt: '2026-07-20T08:00:00.000Z',
        id: '44444444-4444-4444-8444-444444444444',
      });
    });

    it('returns no cursor when the page is not full', async () => {
      mockedNotificationRepository.list.mockResolvedValue({ data: [buildNotificationRow({})], error: null });

      const result = await notificationService.list(USER_ID, 2, null);

      expect(result.nextCursor).toBeNull();
    });

    it('throws the mapped AppError when the query fails', async () => {
      mockedNotificationRepository.list.mockResolvedValue({
        data: [],
        error: buildPostgrestError({ code: '42501', message: 'permission denied' }),
      });

      await expect(notificationService.list(USER_ID, 20, null)).rejects.toMatchObject({
        name: 'AppError',
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('getUnreadCount', () => {
    it('returns the unread count of the user', async () => {
      mockedNotificationRepository.getUnreadCount.mockResolvedValue({ data: 7, error: null });

      await expect(notificationService.getUnreadCount(USER_ID)).resolves.toBe(7);
      expect(mockedNotificationRepository.getUnreadCount).toHaveBeenCalledWith(USER_ID);
    });
  });

  describe('markAsRead', () => {
    it('returns the updated notification as read', async () => {
      mockedNotificationRepository.markAsRead.mockResolvedValue({
        data: buildNotificationRow({ is_read: true }),
        error: null,
      });

      const notification = await notificationService.markAsRead(USER_ID, NOTIFICATION_ID);

      expect(mockedNotificationRepository.markAsRead).toHaveBeenCalledWith(USER_ID, NOTIFICATION_ID);
      expect(notification).toMatchObject({ id: NOTIFICATION_ID, isRead: true });
    });

    it('throws the mapped AppError when the update fails', async () => {
      mockedNotificationRepository.markAsRead.mockResolvedValue({
        data: null as unknown as NotificationRow,
        error: buildPostgrestError({ code: '42501', message: 'permission denied' }),
      });

      await expect(notificationService.markAsRead(USER_ID, NOTIFICATION_ID)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('markAllAsRead', () => {
    it('throws the mapped AppError when the update fails', async () => {
      mockedNotificationRepository.markAllAsRead.mockResolvedValue({
        error: buildPostgrestError({ code: '42501', message: 'permission denied' }),
      });

      await expect(notificationService.markAllAsRead(USER_ID)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('getPreferences', () => {
    it('maps the stored preferences', async () => {
      mockedPreferencesRepository.findByUserId.mockResolvedValue({ data: buildPreferencesRow({}), error: null });

      const preferences = await notificationService.getPreferences(USER_ID);

      expect(preferences).toEqual({
        userId: USER_ID,
        friendRequests: true,
        friendAcceptance: true,
        newJamsCity: false,
        newJamsRadius: true,
        newMatchingJams: true,
        jamUpdates: true,
        jamStarting: true,
        marketing: false,
        radiusKm: 25,
        quietHoursStart: '22:00',
        quietHoursEnd: null,
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: '2026-07-02T10:00:00.000Z',
      });
      expect(mockedPreferencesRepository.create).not.toHaveBeenCalled();
    });

    it('creates default preferences the first time they are requested', async () => {
      mockedPreferencesRepository.findByUserId.mockResolvedValue({ data: null, error: null });
      mockedPreferencesRepository.create.mockResolvedValue({
        data: buildPreferencesRow({ radius_km: 50 }),
        error: null,
      });

      const preferences = await notificationService.getPreferences(USER_ID);

      expect(mockedPreferencesRepository.create).toHaveBeenCalledWith({ user_id: USER_ID });
      expect(preferences.radiusKm).toBe(50);
    });
  });

  describe('updatePreferences', () => {
    it('sends only the provided fields, renamed to snake_case', async () => {
      mockedPreferencesRepository.update.mockResolvedValue({ data: buildPreferencesRow({}), error: null });

      await notificationService.updatePreferences(USER_ID, {
        marketing: false,
        radiusKm: 10,
        quietHoursStart: null,
      });

      expect(mockedPreferencesRepository.update).toHaveBeenCalledWith(USER_ID, {
        marketing: false,
        radius_km: 10,
        quiet_hours_start: null,
      });
    });

    it('rejects a radius outside 1-500 km without calling the repository', async () => {
      await expect(
        notificationService.updatePreferences(USER_ID, { radiusKm: 0 }),
      ).rejects.toBeInstanceOf(ZodError);

      expect(mockedPreferencesRepository.update).not.toHaveBeenCalled();
    });
  });
});
