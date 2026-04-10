export interface LatLng {
  lat: number;
  lng: number;
}

export interface ScoredSegment {
  start: LatLng;
  end: LatLng;
  safety_score: number;
  color: "green" | "yellow" | "red";
}

export interface ScoredRoute {
  summary: string;
  distance_km: number;
  duration_min: number;
  overall_score: number;
  segments: ScoredSegment[];
}

export interface RouteResponse {
  routes: ScoredRoute[];
}

export interface RouteRequest {
  origin: string;
  destination: string;
  time_of_day: number;
}
