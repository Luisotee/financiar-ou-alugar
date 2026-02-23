import { cn } from "@/lib/utils";

interface GlassCardProps extends React.ComponentProps<"div"> {
  glow?: "rent" | "buy" | "finance";
}

const glowClasses = {
  rent: "glass-card-glow-rent",
  buy: "glass-card-glow-buy",
  finance: "glass-card-glow-finance",
} as const;

export function GlassCard({ className, glow, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn("glass-card", glow && glowClasses[glow], className)}
      {...props}
    >
      {children}
    </div>
  );
}
