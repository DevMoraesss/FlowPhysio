using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhysioFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientRegistrationStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateOnly>(
                name: "BirthDate",
                table: "Patients",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date");

            // defaultValue 2 = Complete, NÃO 0.
            // O EF gera 0 por padrão para int, mas 0 não existe no enum
            // RegistrationStatus (1 = Draft, 2 = Complete) - os enums do projeto
            // começam em 1 justamente para "não preenchido" ser distinguível.
            // Todo paciente que já existe foi criado pelo cadastro completo,
            // então entra como Complete.
            migrationBuilder.AddColumn<int>(
                name: "RegistrationStatus",
                table: "Patients",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            // Cinto e suspensório: garante que nenhuma linha antiga fique com 0,
            // caso a coluna já existisse de alguma tentativa anterior.
            migrationBuilder.Sql(@"
                UPDATE ""Patients"" SET ""RegistrationStatus"" = 2
                WHERE ""RegistrationStatus"" NOT IN (1, 2);
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Patients_PhysioId_Phone",
                table: "Patients",
                columns: new[] { "PhysioId", "Phone" });
        }

        /// <inheritdoc />
        // ATENÇÃO ao reverter: se existirem pré-cadastros (sem data de nascimento),
        // voltar a coluna para NOT NULL preenche esses registros com 0001-01-01.
        // Antes de reverter em produção, complete ou remova os pré-cadastros.
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Patients_PhysioId_Phone",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "RegistrationStatus",
                table: "Patients");

            migrationBuilder.AlterColumn<DateOnly>(
                name: "BirthDate",
                table: "Patients",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1),
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);
        }
    }
}
