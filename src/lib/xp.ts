export const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
};

export const getRoleForLevel = (level: number): string => {
  if (level >= 35) return "Legend";
  if (level >= 20) return "Beast";
  if (level >= 10) return "Athlete";
  if (level >= 5) return "Grinder";
  return "Rookie";
};

export const calculateWorkoutXP = (exerciseCount: number): number => {
  return 10 + (exerciseCount * 5);
};
