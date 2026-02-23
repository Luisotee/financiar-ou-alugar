"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  actions?: React.ReactNode;
}

export function Header({ actions }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-[var(--header-height)] max-w-[1440px] items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-lg font-bold tracking-tight sm:text-xl">
            Financiar ou Alugar?
          </h1>
          <p className="text-xs text-muted-foreground">
            Compare patrimônio: alugar, comprar à vista ou financiar
          </p>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Alternar tema"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </header>
  );
}
