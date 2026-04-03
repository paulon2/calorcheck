interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
}

export function CalorieRing({ consumed, goal, size = 200 }: CalorieRingProps) {
  const percent = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const overGoal = consumed > goal;

  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - percent * circumference;
  const center = size / 2;

  const remaining = goal - consumed;
  const isOver = remaining < 0;

  let strokeColor = "#f07050"; // coral primary
  if (overGoal) strokeColor = "#ef4444";
  else if (percent >= 0.8) strokeColor = "#f59e0b";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={12}
            className="text-muted/40"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-4xl font-bold tabular-nums" style={{ color: strokeColor }}>
            {consumed}
          </span>
          <span className="text-xs text-muted-foreground font-medium">kcal consumidas</span>
          <span className="text-sm font-semibold mt-1 text-foreground">
            {isOver ? (
              <span className="text-red-500">+{Math.abs(remaining)} acima</span>
            ) : (
              <span className="text-muted-foreground">faltam {remaining}</span>
            )}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Meta: <span className="font-semibold text-foreground">{goal} kcal</span>
      </p>
    </div>
  );
}
