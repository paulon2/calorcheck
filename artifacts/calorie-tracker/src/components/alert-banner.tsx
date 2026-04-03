import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type Status = "on_track" | "warning" | "over_goal";

const config = {
  on_track: {
    icon: CheckCircle,
    text: "Voce esta no caminho certo! Continue assim.",
    className: "bg-green-50 border-green-200 text-green-800",
    iconColor: "text-green-500",
  },
  warning: {
    icon: AlertTriangle,
    text: "Atencao! Voce esta se aproximando da sua meta diaria.",
    className: "bg-amber-50 border-amber-200 text-amber-800",
    iconColor: "text-amber-500",
  },
  over_goal: {
    icon: XCircle,
    text: "Voce ultrapassou sua meta de calorias de hoje.",
    className: "bg-red-50 border-red-200 text-red-800",
    iconColor: "text-red-500",
  },
};

export function AlertBanner({ status }: { status: Status }) {
  const { icon: Icon, text, className, iconColor } = config[status];

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${className}`}>
      <Icon size={18} className={`mt-0.5 shrink-0 ${iconColor}`} />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
