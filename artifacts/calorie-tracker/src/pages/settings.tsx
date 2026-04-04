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
import { Target, ExternalLink } from "lucide-react";

const schema = z.object({
  dailyGoal: z.coerce
    .number()
    .min(500, "Minimo de 500 kcal")
    .max(10000, "Maximo de 10000 kcal"),
});
type FormData = z.infer<typeof schema>;

interface GoalPreset {
  label: string;
  description: string;
  value: number;
  color: string;
}

const goalPresets: GoalPreset[] = [
  {
    label: "Emagrecimento forte",
    description: "Deficit calórico alto. Consulte um profissional.",
    value: 1200,
    color: "border-red-200 bg-red-50 text-red-700 hover:border-red-300",
  },
  {
    label: "Emagrecimento moderado",
    description: "Perda de peso gradual e sustentável.",
    value: 1500,
    color: "border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300",
  },
  {
    label: "Emagrecimento leve",
    description: "Pequeno deficit, resultado mais lento.",
    value: 1800,
    color: "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300",
  },
  {
    label: "Manutenção do peso",
    description: "Equilíbrio entre consumo e gasto.",
    value: 2000,
    color: "border-green-200 bg-green-50 text-green-700 hover:border-green-300",
  },
  {
    label: "Ganho de massa leve",
    description: "Superávit pequeno para ganho magro.",
    value: 2300,
    color: "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300",
  },
  {
    label: "Ganho de massa",
    description: "Superávit calórico para hipertrofia.",
    value: 2700,
    color: "border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-300",
  },
];

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
    <div className="px-4 pt-8 pb-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Target size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Meta diaria</h1>
          <p className="text-muted-foreground text-sm">Configure seu objetivo calórico</p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <Label htmlFor="dailyGoal" className="text-base font-semibold">
              Meta personalizada (kcal/dia)
            </Label>
            <Input
              id="dailyGoal"
              type="number"
              className="text-2xl font-bold h-14 text-center"
              {...register("dailyGoal")}
            />
            {errors.dailyGoal && (
              <p className="text-xs text-destructive">{errors.dailyGoal.message}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? "Salvando..." : "Salvar meta"}
            </Button>
          </div>
        </form>
      )}

      <div>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Sugestoes por objetivo
        </p>
        <div className="space-y-2">
          {goalPresets.map((preset) => {
            const active = Number(currentGoal) === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setValue("dailyGoal", preset.value);
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                  active
                    ? preset.color + " ring-2 ring-offset-1 ring-primary/30"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold text-sm ${active ? "" : "text-foreground"}`}>
                      {preset.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                  </div>
                  <span className={`text-lg font-bold tabular-nums ${active ? "" : "text-muted-foreground"}`}>
                    {preset.value}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-accent/30 border border-accent rounded-2xl p-4">
        <p className="text-sm font-medium text-accent-foreground mb-1">Aviso importante</p>
        <p className="text-xs text-muted-foreground">
          As metas acima sao sugestoes gerais. Consulte um nutricionista ou medico para uma recomendacao personalizada de acordo com seu perfil.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold mb-2">Ebook de receitas saudaveis</p>
        <p className="text-xs text-muted-foreground mb-3">
          Acesse o ebook exclusivo com receitas saborosas e saudaveis para complementar seu controle calórico.
        </p>
        <a
          href="https://saudavelarteculinaria.com.br/codigo-doce-livre"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ExternalLink size={14} />
          Acessar ebook (senha: docesemculpa2026)
        </a>
      </div>
    </div>
  );
}
