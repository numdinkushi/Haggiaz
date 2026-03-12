/**
 * Enums for Haggiaz protocol.
 */

export enum GroupStatus {
  Open = 0,
  Active = 1,
  Completed = 2,
  Cancelled = 3,
}

export const GROUP_STATUS_LABELS: Record<GroupStatus, string> = {
  [GroupStatus.Open]: "Open",
  [GroupStatus.Active]: "Active",
  [GroupStatus.Completed]: "Completed",
  [GroupStatus.Cancelled]: "Cancelled",
};
