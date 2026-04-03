import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGetWeeklyStats } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

function StatusDot({ percent }: { percent: number }) {
  const color =
    percent > 100
      ? "bg-red-400"
      : percent >= 80
      ? "bg-amber-400"
      : "bg-green-400";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

export default function History() {
  const { data: stats, isLoading } = useGetWeeklyStats();

  const chartData = stats
    ? [...stats]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((s) => ({
          date: s.date,
          label: format(parseISO(s.date), "EEE", { locale: ptBR }),
          calories: s.totalCalories,
          goal: s.dailyGoal,
        }))
    : [];

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const goal = stats && stats.length > 0 ? stats[0].dailyGoal : 2000;

  return (
    <div className="px-4 pt-8 pb-4">
      <h1 className="text-2xl font-bold mb-1">Ultimos 7 dias</h1>
      <p className="text-muted-foreground text-sm mb-6">Acompanhe sua evolucao semanal</p>

      {isLoading ? (
        <Skeleton className="h-52 rounded-2xl mb-6" />
      ) : (
        <div className="bg-card rounded-2xl border border-border p-4 mb-6 shadow-sm">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={28} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", textTransform: "capitalize" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value} kcal`, "Consumido"]}
                labelFormatter={(label) => label}
              />
              <ReferenceLine y={goal} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.6} />
              <Bar
                dataKey="calories"
                fill="hsl(var(--primary))"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Linha tracejada = meta diaria de {goal} kcal
          </p>
        </div>
      )}

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Detalhes por dia</h2>
      <div className="space-y-2">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)
        ) : stats && stats.length > 0 ? (
          [...stats]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((s) => {
              const percent = s.dailyGoal > 0 ? Math.round((s.totalCalories / s.dailyGoal) * 100) : 0;
              const isToday = s.date === todayStr;
              return (
                <div
                  key={s.date}
                  className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <StatusDot percent={percent} />
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {isToday ? "Hoje" : format(parseISO(s.date), "EEEE, dd/MM", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">{percent}% da meta</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold tabular-nums">{s.totalCalories}</p>
                    <p className="text-xs text-muted-foreground">de {s.dailyGoal} kcal</p>
                  </div>
                </div>
              );
            })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum dado disponivel ainda.</p>
            <p className="text-sm mt-1">Comece registrando alimentos na aba Hoje.</p>
          </div>
        )}
      </div>
    </div>
  );
}
