import { useQueryClient } from "@tanstack/react-query";
import { useDeleteFoodEntry, getListFoodEntriesQueryKey, getGetDailySummaryQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FoodEntryItemProps {
  id: number;
  name: string;
  calories: number;
  quantity: string;
  date: string;
}

export function FoodEntryItem({ id, name, calories, quantity, date }: FoodEntryItemProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteEntry = useDeleteFoodEntry();

  const handleDelete = () => {
    deleteEntry.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFoodEntriesQueryKey({ date }) });
          queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date }) });
          toast({ title: "Removido com sucesso" });
        },
        onError: () => {
          toast({ title: "Erro ao remover", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-card rounded-xl border border-border hover:shadow-sm transition-shadow duration-200 group">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{quantity}</p>
      </div>
      <div className="flex items-center gap-3 ml-3">
        <span className="font-bold text-primary tabular-nums">{calories} kcal</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          disabled={deleteEntry.isPending}
        >
          <Trash2 size={15} />
        </Button>
      </div>
    </div>
  );
}
