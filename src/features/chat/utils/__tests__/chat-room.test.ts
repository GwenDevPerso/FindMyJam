import { getChatRoomForJam, getChatRoomKey } from '@/features/chat/utils/chat-room';

const JAM_ID = '33333333-3333-4333-8333-333333333333';
const SERIES_ID = '77777777-7777-4777-8777-777777777777';

describe('getChatRoomForJam', () => {
  it('uses the series room for a date of a series', () => {
    expect(getChatRoomForJam({ id: JAM_ID, seriesId: SERIES_ID })).toEqual({
      kind: 'series',
      seriesId: SERIES_ID,
    });
  });

  it('uses the jam room for a one-off jam', () => {
    expect(getChatRoomForJam({ id: JAM_ID, seriesId: null })).toEqual({ kind: 'jam', jamId: JAM_ID });
  });
});

describe('getChatRoomKey', () => {
  it('prefixes a series room', () => {
    expect(getChatRoomKey({ kind: 'series', seriesId: SERIES_ID })).toBe(`series:${SERIES_ID}`);
  });

  it('prefixes a jam room', () => {
    expect(getChatRoomKey({ kind: 'jam', jamId: JAM_ID })).toBe(`jam:${JAM_ID}`);
  });
});
