import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { Salad } from "lucide-react";

const schema = z.object({
  email: z.string().email("E-mail invalido"),
  password: z.string().min(1, "Informe a senha"),
});
type FormData = z.infer<typeof schema>;

interface LoginProps {
  onGoRegister: () => void;
}

export default function Login({ onGoRegister }: LoginProps) {
  const { refetch } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Erro ao entrar");
        return;
      }
      await refetch();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10 max-w-md mx-auto">
      <div className="w-full">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Salad size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold">CalorCheck</h1>
          <p className="text-muted-foreground text-sm mt-1">Controle sua alimentacao com facilidade</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-5">Entrar na sua conta</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@email.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Nao tem uma conta?{" "}
          <button
            onClick={onGoRegister}
            className="text-primary font-semibold hover:underline"
          >
            Cadastre-se gratuitamente
          </button>
        </p>
      </div>
    </div>
  );
}
