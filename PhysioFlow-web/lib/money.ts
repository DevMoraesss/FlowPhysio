const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** R$ 1.234,56, com separador de milhar. As telas antigas usam toFixed e só trocam o ponto. */
export function formatBRL(value: number): string {
    return brl.format(value);
}
