import type { Instrument, MusicStyle, Profile } from '@/types/domain';

export type { Profile };

export type ProfileDetail = Profile & {
  instruments: Instrument[];
  musicStyles: MusicStyle[];
};

export type UpdateProfileInput = {
  username: string;
  bio: string | null;
  skillLevel: Profile['skillLevel'];
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  instrumentIds: string[];
  styleIds: string[];
};

export type UploadAvatarInput = {
  uri: string;
  mimeType: string;
  fileSize: number;
};

export type ProfileJamTab = 'created' | 'participated';
