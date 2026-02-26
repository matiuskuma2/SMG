const routeDefs = {
  user: [],
  content: ["/admin"],
  message: [],
  analysis: [],
  portal: [],
  settings: [],
};

export type RouteDefsType = typeof routeDefs;

export const includeCurrent = (path: string, target: keyof RouteDefsType) => {
  const routes = routeDefs[target] as string[];
  return routes.includes(path);
};

/**
 * @see https://github.com/mui/material-ui/blob/master/packages/mui-material/src/styles/createTransitions.js#L35
 */
export const getAutoHeightDuration = (height: number | undefined) => {
  if (!height) return 0;

  const constant = height / 36;

  // https://www.desmos.com/calculator/vbrp3ggqet
  return Math.min(Math.round((4 + 15 * constant ** 0.25 + constant / 5) * 10), 3000);
};
