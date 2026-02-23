export function Header() {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Financiar ou Alugar?
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Compare patrimônio: alugar, comprar à vista ou financiar
          </p>
        </div>
      </div>
    </header>
  );
}
