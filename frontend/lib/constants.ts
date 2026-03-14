/**
 * Application constants. No hardcoded addresses - use config.
 */

export const ROUTES = {
  HOME: "/",
  GROUPS: "/groups",
  CREATE_GROUP: "/groups/create",
  GROUP: (id: string) => `/groups/${id}`,
  JOIN: (id: string) => `/join/${id}`,
} as const;

export const ANIMATION = {
  DURATION_FAST: 0.15,
  DURATION_NORMAL: 0.25,
  DURATION_SLOW: 0.4,
  STAGGER_DELAY: 0.05,
} as const;

export const TOKEN_DECIMALS = 6;
