using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhysioFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChangePaymentDayToInt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Conversão segura de texto livre ("dia 5", "toda sexta", "final do mês")
            // para inteiro: extrai os dígitos; se não houver dígitos ou o valor ficar
            // fora de 1-31, vira NULL. Nunca falha, para não travar o startup em produção.
            migrationBuilder.Sql(@"
ALTER TABLE ""Patients""
ALTER COLUMN ""PaymentDay"" TYPE integer
USING (
    CASE
        WHEN NULLIF(regexp_replace(""PaymentDay"", '\D', '', 'g'), '') ~ '^\d{1,2}$'
             AND NULLIF(regexp_replace(""PaymentDay"", '\D', '', 'g'), '')::int BETWEEN 1 AND 31
        THEN NULLIF(regexp_replace(""PaymentDay"", '\D', '', 'g'), '')::int
        ELSE NULL
    END
);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
ALTER TABLE ""Patients""
ALTER COLUMN ""PaymentDay"" TYPE character varying(50)
USING ""PaymentDay""::varchar;");
        }
    }
}
