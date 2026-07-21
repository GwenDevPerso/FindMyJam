export const Routes = {
  home: '/',
  login: '/login',
  register: '/register',
  explore: '/explore',
  friends: '/friends',
  friendsSearch: '/friends/search',
  profile: '/profile',
  profileEdit: '/profile/edit',
  jamsCreate: '/jams/create',
  jamsAll: '/jams/all',
  notifications: '/notifications',
  jamDetail: (id: string) => `/jams/${id}` as const,
  notFound: '/+not-found',
} as const;

export type AppRoute = (typeof Routes)[keyof typeof Routes];
