type RouteLike = {
  path?: string
}

export function useCurrentRouteGuard(route: RouteLike, paths: string | string[]) {
  const allowedPaths = Array.isArray(paths) ? paths : [paths]

  return function isCurrentRoute() {
    return allowedPaths.some((path) => route.path === path)
  }
}
