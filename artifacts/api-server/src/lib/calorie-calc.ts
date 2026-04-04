interface UserProfile {
  weightKg: number | null;
  heightCm: number | null;
  birthYear: number | null;
  sex: string | null;
  goalType: string | null;
  customGoal: number | null;
}

const GOAL_MULTIPLIERS: Record<string, number> = {
  lose_strong: 0.75,
  lose_moderate: 0.85,
  lose_light: 0.90,
  maintain: 1.0,
  gain_light: 1.10,
  gain: 1.20,
};

export function calculateDailyGoal(user: UserProfile): number {
  if (user.customGoal) return user.customGoal;

  if (!user.weightKg || !user.heightCm || !user.birthYear || !user.sex) {
    return 2000;
  }

  const age = new Date().getFullYear() - user.birthYear;
  let bmr: number;

  if (user.sex === "M") {
    bmr = 88.362 + 13.397 * user.weightKg + 4.799 * user.heightCm - 5.677 * age;
  } else {
    bmr = 447.593 + 9.247 * user.weightKg + 3.098 * user.heightCm - 4.330 * age;
  }

  const tdee = bmr * 1.2;
  const multiplier = GOAL_MULTIPLIERS[user.goalType ?? "maintain"] ?? 1.0;
  return Math.round(tdee * multiplier);
}
