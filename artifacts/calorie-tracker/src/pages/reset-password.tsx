import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Salad, Check, AlertCircle } from "lucide-react";

const schema = z.object({
  newPassword: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "As senhas nao conferem",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

interface ResetPasswordProps {
  onGoLogin: () => void;
}

export default function ResetPassword({ onGoLogin }: ResetPasswordProps) {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"form" | "success" | "invalid">("form");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
    } else {
      setStatus("invalid");
    }
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    setServerError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, newPassword: data.newPassword }),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Erro ao redefinir senha");
        return;
      }
      setStatus("success");
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
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {status === "invalid" && (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle size={22} className="text-destructive" />
              </div>
              <h2 className="text-lg font-bold">Link invalido</h2>
              <p className="text-sm text-muted-foreground">
                Este link de recuperacao e invalido ou expirou. Solicite um novo na tela de login.
              </p>
              <Button className="w-full" onClick={onGoLogin}>Ir para o login</Button>
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check size={22} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold">Senha redefinida!</h2>
              <p className="text-sm text-muted-foreground">
                Sua senha foi alterada com sucesso. Faca login com a nova senha.
              </p>
              <Button className="w-full" onClick={onGoLogin}>Ir para o login</Button>
            </div>
          )}

          {status === "form" && (
            <>
              <h2 className="text-xl font-bold mb-1">Nova senha</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Escolha uma nova senha para sua conta.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Minimo 6 caracteres"
                    autoComplete="new-password"
                    {...register("newPassword")}
                  />
                  {errors.newPassword && (
                    <p className="text-xs text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
                {serverError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    <p className="text-sm text-destructive">{serverError}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Redefinir senha"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
