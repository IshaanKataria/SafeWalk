export interface LatLng {
  lat: number;
  lng: number;
}

export interface ScoredSegment {
  path: LatLng[];
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

export type ReportCategory = "lighting" | "crime" | "harassment" | "other";

export interface CommunityReport {
  id: string;
  lat: number;
  lng: number;
  category: ReportCategory;
  description: string | null;
  created_at: string;
}

export interface CommunityReportCreate {
  lat: number;
  lng: number;
  category: ReportCategory;
  description?: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  score: number;
}

export interface HeatmapResponse {
  points: HeatmapPoint[];
  time_of_day: number;
  grid_spacing_m: number;
}
