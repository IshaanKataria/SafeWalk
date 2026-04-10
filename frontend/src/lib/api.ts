import { RouteRequest, RouteResponse } from "@/types";

const API_BASE = "/api";

export async function fetchRoutes(request: RouteRequest): Promise<RouteResponse> {
  const res = await fetch(`${API_BASE}/routes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch routes: ${res.status}`);
  }

  return res.json();
}
