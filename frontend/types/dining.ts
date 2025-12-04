export interface DiningLocationsResponse {
  data: DiningLocation[];
  message: string;
  status?: number;
}

export interface DiningLocation {
  name: string;
  mapName: string;
  dbid: string;
  maploc: string;
  geoloc: {
    lat: string;
    long: string;
  };
  building: {
    location_id: string;
    name: string;
  };
  eventsFeedConfig: {
    locationID: string;
    baseURL: string;
    menuURL: string;
  };
  amenities: {
    amenity: Array<{ name: string }> | { name: string };
  };
}

export interface DiningEvent {
  summary: string;
  start: string;
  end: string;
  uid: string;
  description: string;
}

export interface MenuItem {
  apiId: string;
  name: string;
  location: string;
  description: string;
  link: string;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
}
