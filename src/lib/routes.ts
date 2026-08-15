export const WORKOUT_DASHBOARD_PATH = "/dashboard";

export function roomIdFromPath(pathname: string) {
  const match = pathname.match(/^\/c\/([^/]+)$/);
  return match?.[1];
}

export function isWorkoutDashboardPath(pathname: string) {
  return pathname === WORKOUT_DASHBOARD_PATH;
}

export function replaceUrl(path: string) {
  window.history.pushState(null, "", path);
}
