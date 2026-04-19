import { differenceInDays, startOfDay } from "date-fns";

export const calculateNewStreak = (lastWorkoutDate: Date | null, currentStreak: number): number => {
  if (!lastWorkoutDate) return 1;

  const today = startOfDay(new Date());
  const lastWorkoutDay = startOfDay(lastWorkoutDate);
  const diffDays = differenceInDays(today, lastWorkoutDay);

  if (diffDays === 0) {
    // Already worked out today
    return currentStreak;
  } else if (diffDays === 1) {
    // Worked out yesterday, streak continues
    return currentStreak + 1;
  } else {
    // Missed a day (ignoring rest day tokens for now in v1)
    return 1;
  }
};
