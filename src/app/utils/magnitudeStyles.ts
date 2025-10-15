export const getMagnitudeColor = (magnitude: number): string => {
  if (magnitude < 5.0)
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
  if (magnitude < 6.0)
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
  if (magnitude < 7.0)
    return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
  return "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300";
};

export const getMagnitudeRingColor = (magnitude: number): string => {
  if (magnitude < 5.0) return "ring-yellow-200 dark:ring-yellow-500/50";
  if (magnitude < 6.0) return "ring-orange-200 dark:ring-orange-500/50";
  if (magnitude < 7.0) return "ring-red-200 dark:ring-red-500/50";
  return "ring-purple-200 dark:ring-purple-500/50";
};
