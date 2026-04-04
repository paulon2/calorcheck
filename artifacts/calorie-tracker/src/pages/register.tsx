import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Salad, ChevronLeft, ChevronRight, Info, Check } from "lucide-react";

const GOAL_OPTIONS = [
  { value: "lose_strong", label: "Emagrecimento forte", description: "Deficit alto (\u201125%)" },
  { value: "lose_moderate", label: "Emagrecimento moderado", description: "Deficit moderado (\u201115%)" },
  { value: "lose_light", label: "Emagrecimento leve", description: "Deficit leve (\u201110%)" },
  { value: "maintain", label: "Manter o peso", description: "Equilibrio calórico" },
  { value: "gain_light", label: "Ganho de massa leve", description: "Superavit leve (+10%)" },
  { value: "gain", label: "Ganho de massa", description: "Superavit moderado (+20%)" },
];

const schema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail invalido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  confirmPassword: z.string(),
  sex: z.enum(["M", "F"]).optional(),
  birthYear: z.coerce.number().int().min(1920).max(new Date().getFullYear() - 10).optional().or(z.literal("")),
  weightKg: z.coerce.number().int().min(20).max(300).optional().or(z.literal("")),
  heightCm: z.coerce.number().int().min(100).max(250).optional().or(z.literal("")),
  goalType: z.enum(["lose_strong", "lose_moderate", "lose_light", "maintain", "gain_light", "gain"]).optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: "As senhas nao conferem",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

interface RegisterProps {
  onGoLogin: () => void;
}

export default function Register({ onGoLogin }: RegisterProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { sex: undefined, goalType: undefined },
  });

  const selectedSex = watch("sex");
  const selectedGoal = watch("goalType");

  const goToStep2 = async () => {
    const valid = await trigger(["name", "email", "password", "confirmPassword"]);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        password: data.password,
      };
      if (data.sex) body.sex = data.sex;
      if (data.birthYear && data.birthYear !== "") body.birthYear = Number(data.birthYear);
      if (data.weightKg && data.weightKg !== "") body.weightKg = Number(data.weightKg);
      if (data.heightCm && data.heightCm !== "") body.heightCm = Number(data.heightCm);
      if (data.goalType) body.goalType = data.goalType;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const resBody = await res.json();
      if (!res.ok) {
        setServerError(resBody.error ?? "Erro ao cadastrar");
        return;
      }
      // Show success screen instead of auto-login, so user sees confirmation
      setRegistered(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10 max-w-md mx-auto">
        <div className="w-full">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <Salad size={28} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold">CalorCheck</h1>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check size={30} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Cadastro realizado!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sua conta foi criada com sucesso. Faca login para comecar a usar o CalorCheck.
              </p>
            </div>
            <Button className="w-full" onClick={onGoLogin}>
              Fazer login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start px-6 py-8 max-w-md mx-auto">
      <div className="w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
            <Salad size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold">CalorCheck</h1>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="p-1 rounded-full hover:bg-muted">
                <ChevronLeft size={18} />
              </button>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold">
                {step === 1 ? "Criar sua conta" : "Perfil e objetivo"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {step === 1 ? "Passo 1 de 2" : "Passo 2 de 2 — opcional"}
              </p>
            </div>
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full ${step === 1 ? "bg-primary" : "bg-primary/30"}`} />
              <div className={`w-2 h-2 rounded-full ${step === 2 ? "bg-primary" : "bg-primary/30"}`} />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" placeholder="Maria Silva" autoComplete="name" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="voce@email.com" autoComplete="email" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" placeholder="Minimo 6 caracteres" autoComplete="new-password" {...register("password")} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <Input id="confirmPassword" type="password" placeholder="Repita a senha" autoComplete="new-password" {...register("confirmPassword")} />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>
                <Button type="button" onClick={goToStep2} className="w-full gap-1">
                  Continuar <ChevronRight size={16} />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 flex gap-2">
                  <Info size={15} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Esses dados sao opcionais e usados para calcular sua meta calórica personalizada. Voce pode pular e ajustar depois.
                  </p>
                </div>

                <div>
                  <Label className="mb-2 block">Sexo</Label>
                  <div className="flex gap-2">
                    {[{ value: "F", label: "Feminino" }, { value: "M", label: "Masculino" }].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setValue("sex", opt.value as "M" | "F")}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                          selectedSex === opt.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="birthYear">Ano nasc.</Label>
                    <Input id="birthYear" type="number" placeholder="1990" {...register("birthYear")} />
                    {errors.birthYear && <p className="text-xs text-destructive">{errors.birthYear.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="weightKg">Peso (kg)</Label>
                    <Input id="weightKg" type="number" placeholder="70" {...register("weightKg")} />
                    {errors.weightKg && <p className="text-xs text-destructive">{errors.weightKg.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="heightCm">Altura (cm)</Label>
                    <Input id="heightCm" type="number" placeholder="165" {...register("heightCm")} />
                    {errors.heightCm && <p className="text-xs text-destructive">{errors.heightCm.message}</p>}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Objetivo</Label>
                  <div className="space-y-2">
                    {GOAL_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setValue("goalType", opt.value as FormData["goalType"])}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
                          selectedGoal === opt.value
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:border-primary/30"
                        }`}
                      >
                        <p className={`text-sm font-semibold ${selectedGoal === opt.value ? "text-primary" : "text-foreground"}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{opt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {serverError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    <p className="text-sm text-destructive">{serverError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    variant="outline"
                    className="flex-1"
                    disabled={isLoading}
                    onClick={() => setValue("goalType", undefined)}
                  >
                    {isLoading ? "..." : "Pular"}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? "Criando..." : "Criar conta"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Ja tem uma conta?{" "}
          <button onClick={onGoLogin} className="text-primary font-semibold hover:underline">
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}
