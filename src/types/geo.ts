export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type GeoBounds = {
  northEast: Coordinates;
  southWest: Coordinates;
};

export type MapRegion = Coordinates & {
  latitudeDelta: number;
  longitudeDelta: number;
};
