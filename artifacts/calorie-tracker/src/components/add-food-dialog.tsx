import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateFoodEntry, getListFoodEntriesQueryKey, getGetDailySummaryQueryKey } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  calories: z.coerce.number().min(0, "Deve ser positivo"),
  quantity: z.string().min(1, "Quantidade obrigatória"),
  meal: z.enum(["breakfast", "lunch", "dinner", "snack"]),
});

type FormData = z.infer<typeof schema>;

const mealLabels: Record<string, string> = {
  breakfast: "Cafe da manha",
  lunch: "Almoco",
  dinner: "Jantar",
  snack: "Lanche",
};

interface AddFoodDialogProps {
  date: string;
}

export function AddFoodDialog({ date }: AddFoodDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createEntry = useCreateFoodEntry();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { meal: "lunch" },
  });

  const meal = watch("meal");

  const onSubmit = (data: FormData) => {
    createEntry.mutate(
      { data: { ...data, date } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFoodEntriesQueryKey({ date }) });
          queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date }) });
          toast({ title: "Alimento adicionado!" });
          reset();
          setOpen(false);
        },
        onError: () => {
          toast({ title: "Erro ao adicionar alimento", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-full shadow-lg gap-2">
          <Plus size={20} />
          Adicionar alimento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar alimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="name">Nome do alimento</Label>
            <Input id="name" placeholder="Ex: Arroz integral" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="calories">Calorias (kcal)</Label>
              <Input id="calories" type="number" placeholder="200" {...register("calories")} />
              {errors.calories && <p className="text-xs text-destructive">{errors.calories.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input id="quantity" placeholder="1 porcao" {...register("quantity")} />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Refeicao</Label>
            <Select value={meal} onValueChange={(v) => setValue("meal", v as FormData["meal"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(mealLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={createEntry.isPending}>
            {createEntry.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
