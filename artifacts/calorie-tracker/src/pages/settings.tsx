import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Target } from "lucide-react";

const schema = z.object({
  dailyGoal: z.coerce
    .number()
    .min(500, "Minimo de 500 kcal")
    .max(10000, "Maximo de 10000 kcal"),
});
type FormData = z.infer<typeof schema>;

const presets = [1200, 1500, 1800, 2000, 2200, 2500];

export default function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { dailyGoal: 2000 },
  });

  useEffect(() => {
    if (settings) {
      reset({ dailyGoal: settings.dailyGoal });
    }
  }, [settings, reset]);

  const currentGoal = watch("dailyGoal");

  const onSubmit = (data: FormData) => {
    updateSettings.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast({ title: "Meta atualizada com sucesso!" });
        },
        onError: () => {
          toast({ title: "Erro ao salvar meta", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="px-4 pt-8 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Target size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Meta diaria</h1>
          <p className="text-muted-foreground text-sm">Configure sua meta de calorias</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="dailyGoal" className="text-base font-semibold">
                Meta de calorias (kcal/dia)
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="dailyGoal"
                  type="number"
                  className="text-2xl font-bold h-14 text-center"
                  {...register("dailyGoal")}
                />
              </div>
              {errors.dailyGoal && (
                <p className="text-xs text-destructive">{errors.dailyGoal.message}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Sugestoes rapidas:</p>
              <div className="grid grid-cols-3 gap-2">
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue("dailyGoal", p)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all duration-150 ${
                      Number(currentGoal) === p
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:border-primary/40 text-foreground"
                    }`}
                  >
                    {p} kcal
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-accent/30 border border-accent rounded-2xl p-4">
            <p className="text-sm font-medium text-accent-foreground mb-1">Dica</p>
            <p className="text-xs text-muted-foreground">
              A necessidade calorica varia por pessoa. Uma media de 2000 kcal e indicada para adultos sedentarios.
              Consulte um profissional de saude para uma recomendacao personalizada.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? "Salvando..." : "Salvar meta"}
          </Button>
        </form>
      )}
    </div>
  );
}
