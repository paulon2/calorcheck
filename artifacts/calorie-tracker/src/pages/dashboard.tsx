import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGetDailySummary, getGetDailySummaryQueryKey, useListFoodEntries, getListFoodEntriesQueryKey } from "@workspace/api-client-react";
import { CalorieRing } from "@/components/calorie-ring";
import { AddFoodDialog } from "@/components/add-food-dialog";
import { FoodEntryItem } from "@/components/food-entry-item";
import { AlertBanner } from "@/components/alert-banner";
import { Skeleton } from "@/components/ui/skeleton";

const mealLabels: Record<string, string> = {
  breakfast: "Cafe da manha",
  lunch: "Almoco",
  dinner: "Jantar",
  snack: "Lanche",
};

const mealColors: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-700",
  lunch: "bg-green-100 text-green-700",
  dinner: "bg-blue-100 text-blue-700",
  snack: "bg-purple-100 text-purple-700",
};

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = format(currentDate, "yyyy-MM-dd");
  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");

  const { data: summary, isLoading: summaryLoading } = useGetDailySummary(
    { date: dateStr },
    { query: { queryKey: getGetDailySummaryQueryKey({ date: dateStr }) } }
  );

  const { data: entries, isLoading: entriesLoading } = useListFoodEntries(
    { date: dateStr },
    { query: { queryKey: getListFoodEntriesQueryKey({ date: dateStr }) } }
  );

  const mealGroups = entries
    ? (["breakfast", "lunch", "dinner", "snack"] as const).reduce(
        (acc, meal) => {
          acc[meal] = entries.filter((e) => e.meal === meal);
          return acc;
        },
        {} as Record<string, typeof entries>
      )
    : null;

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-gradient-to-b from-primary/10 to-transparent px-4 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentDate((d) => subDays(d, 1))}
            className="p-2 rounded-full hover:bg-muted/60 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {isToday ? "Hoje" : ""}
            </p>
            <p className="font-semibold text-foreground capitalize">
              {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <button
            onClick={() => setCurrentDate((d) => addDays(d, 1))}
            disabled={isToday}
            className="p-2 rounded-full hover:bg-muted/60 transition-colors disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {summaryLoading ? (
          <div className="flex justify-center py-8">
            <Skeleton className="w-48 h-48 rounded-full" />
          </div>
        ) : summary ? (
          <div className="flex justify-center">
            <CalorieRing
              consumed={summary.totalCalories}
              goal={summary.dailyGoal}
              size={190}
            />
          </div>
        ) : null}

        {summary && summary.status !== "on_track" && (
          <div className="mt-4">
            <AlertBanner status={summary.status as "on_track" | "warning" | "over_goal"} />
          </div>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-2 px-4 mb-4">
          {(["breakfast", "lunch", "dinner", "snack"] as const).map((meal) => (
            <div key={meal} className={`rounded-xl p-2 text-center ${mealColors[meal]}`}>
              <p className="text-xs font-medium leading-tight">{mealLabels[meal].split(" ")[0]}</p>
              <p className="text-sm font-bold">{summary.breakdownByMeal[meal]}</p>
              <p className="text-xs opacity-70">kcal</p>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 space-y-4 flex-1">
        {entriesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : mealGroups ? (
          <>
            {(["breakfast", "lunch", "dinner", "snack"] as const).map((meal) => {
              const group = mealGroups[meal];
              if (!group || group.length === 0) return null;
              return (
                <div key={meal}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {mealLabels[meal]}
                  </h3>
                  <div className="space-y-2">
                    {group.map((entry) => (
                      <FoodEntryItem
                        key={entry.id}
                        id={entry.id}
                        name={entry.name}
                        calories={entry.calories}
                        quantity={entry.quantity}
                        date={dateStr}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {entries && entries.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">Nenhum alimento registrado</p>
                <p className="text-sm mt-1">Adicione sua primeira refeicao do dia!</p>
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className="flex justify-center py-6">
        <AddFoodDialog date={dateStr} />
      </div>
    </div>
  );
}
