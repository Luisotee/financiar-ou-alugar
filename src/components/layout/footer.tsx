export function Footer() {
  return (
    <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6 space-y-1">
        <p>
          Este simulador é apenas uma ferramenta educacional. Não constitui
          recomendação de investimento.
        </p>
        <p>
          Dados de referência: Tesouro Direto IPCA+, tabela IR regressiva,
          IGPM/IPCA médios.
        </p>
      </div>
    </footer>
  );
}
