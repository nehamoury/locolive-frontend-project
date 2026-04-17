/**
 * Utility to determine if a user is currently online based on their last activity.
 */
export const isUserOnline = (
  lastActiveAt: string | Date | undefined,
  isOnlineExplicit?: boolean
): boolean => {
  // If the backend explicitly says the user is online, trust it.
  if (isOnlineExplicit) return true;
  
  if (!lastActiveAt) return false;

  const lastActive = new Date(lastActiveAt);
  const now = new Date();
  
  // A user is considered online if they were active within the last 5 minutes.
  const thresholdMinutes = 5;
  const diffMs = now.getTime() - lastActive.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  return diffMinutes >= 0 && diffMinutes <= thresholdMinutes;
};
