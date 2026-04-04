import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { Salad, Copy, Check, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("E-mail invalido"),
  password: z.string().min(1, "Informe a senha"),
});
type LoginData = z.infer<typeof loginSchema>;

const forgotSchema = z.object({
  email: z.string().email("E-mail invalido"),
});
type ForgotData = z.infer<typeof forgotSchema>;

interface LoginProps {
  onGoRegister: () => void;
}

export default function Login({ onGoRegister }: LoginProps) {
  const { refetch } = useAuth();
  const [view, setView] = useState<"login" | "forgot" | "reset-link">("login");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const forgotForm = useForm<ForgotData>({ resolver: zodResolver(forgotSchema) });

  const onLogin = async (data: LoginData) => {
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

  const onForgot = async (data: ForgotData) => {
    setServerError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Erro ao processar solicitacao");
        return;
      }
      setResetUrl(body.resetUrl ?? null);
      setView("reset-link");
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    if (!resetUrl) return;
    await navigator.clipboard.writeText(resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {/* ── LOGIN ── */}
        {view === "login" && (
          <>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-5">Entrar na sua conta</h2>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="voce@email.com"
                    autoComplete="email"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <button
                      type="button"
                      onClick={() => { setServerError(null); setView("forgot"); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
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
              <button onClick={onGoRegister} className="text-primary font-semibold hover:underline">
                Cadastre-se gratuitamente
              </button>
            </p>
          </>
        )}

        {/* ── ESQUECI A SENHA ── */}
        {view === "forgot" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <button
              onClick={() => { setServerError(null); setView("login"); }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft size={14} /> Voltar ao login
            </button>
            <h2 className="text-xl font-bold mb-1">Recuperar senha</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Informe seu e-mail para gerar o link de redefinicao de senha.
            </p>
            <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="forgot-email">E-mail cadastrado</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  {...forgotForm.register("email")}
                />
                {forgotForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>
                )}
              </div>
              {serverError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  <p className="text-sm text-destructive">{serverError}</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Gerando link..." : "Gerar link de recuperacao"}
              </Button>
            </form>
          </div>
        )}

        {/* ── LINK GERADO ── */}
        {view === "reset-link" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check size={22} className="text-green-600" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold">Link de recuperacao gerado</h2>
              {resetUrl ? (
                <p className="text-sm text-muted-foreground mt-1">
                  Copie o link abaixo e abra no navegador para redefinir sua senha.
                  O link expira em 30 minutos.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Se o e-mail existir em nossa base, as instrucoes foram enviadas.
                </p>
              )}
            </div>

            {resetUrl && (
              <div className="bg-muted rounded-xl p-3 space-y-2">
                <p className="text-xs text-muted-foreground break-all font-mono leading-relaxed">{resetUrl}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={copyLink}
                >
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  {copied ? "Copiado!" : "Copiar link"}
                </Button>
              </div>
            )}

            <Button
              className="w-full"
              variant="ghost"
              onClick={() => { setView("login"); setResetUrl(null); }}
            >
              Voltar ao login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
