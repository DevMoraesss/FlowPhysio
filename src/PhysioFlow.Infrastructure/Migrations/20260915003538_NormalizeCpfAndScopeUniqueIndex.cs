using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhysioFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeCpfAndScopeUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Parte 1: limpar os dados que já estão no banco ──────────────────
            // Antes desta versão, CPF de responsável e de fisioterapeuta era gravado
            // com máscara ("123.456.789-00"), enquanto o de paciente era gravado só
            // com dígitos. Isso tornava o índice único inútil, porque os dois textos
            // são diferentes para o PostgreSQL.
            //
            // A limpeza roda ANTES de recriar o índice, para o índice novo já nascer
            // sobre dados consistentes.

            // 1a. String vazia vira null. O índice único trata '' como um valor real,
            //     então duas linhas com '' colidiriam — mas "não informado" deve ser null.
            migrationBuilder.Sql(@"
                UPDATE ""Patients""  SET ""Cpf"" = NULL WHERE btrim(""Cpf"") = '';
                UPDATE ""Guardians"" SET ""Cpf"" = NULL WHERE btrim(""Cpf"") = '';
                UPDATE ""Users""     SET ""Cpf"" = NULL WHERE btrim(""Cpf"") = '';
            ");

            // 1b. Remover a máscara, deixando só os dígitos.
            //
            //     O NOT EXISTS é a trava de segurança: só normaliza a linha se NENHUMA
            //     outra linha da tabela terminar com o mesmo CPF normalizado. Se duas
            //     linhas fossem virar o mesmo valor, as DUAS são puladas e continuam
            //     com a máscara — assim a migration nunca viola o índice único e nunca
            //     derruba o deploy. As linhas puladas ficam para resolução manual.
            //
            //     Em Patients a comparação é feita dentro do mesmo PhysioId, porque é
            //     esse o escopo do índice único novo.
            migrationBuilder.Sql(@"
                UPDATE ""Patients"" p
                SET ""Cpf"" = regexp_replace(p.""Cpf"", '[^0-9]', '', 'g')
                WHERE p.""Cpf"" IS NOT NULL
                  AND p.""Cpf"" <> regexp_replace(p.""Cpf"", '[^0-9]', '', 'g')
                  AND NOT EXISTS (
                      SELECT 1 FROM ""Patients"" o
                      WHERE o.""Id"" <> p.""Id""
                        AND o.""PhysioId"" = p.""PhysioId""
                        AND o.""Cpf"" IS NOT NULL
                        AND regexp_replace(o.""Cpf"", '[^0-9]', '', 'g')
                            = regexp_replace(p.""Cpf"", '[^0-9]', '', 'g')
                  );
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Guardians"" g
                SET ""Cpf"" = regexp_replace(g.""Cpf"", '[^0-9]', '', 'g')
                WHERE g.""Cpf"" IS NOT NULL
                  AND g.""Cpf"" <> regexp_replace(g.""Cpf"", '[^0-9]', '', 'g')
                  AND NOT EXISTS (
                      SELECT 1 FROM ""Guardians"" o
                      WHERE o.""Id"" <> g.""Id""
                        AND o.""Cpf"" IS NOT NULL
                        AND regexp_replace(o.""Cpf"", '[^0-9]', '', 'g')
                            = regexp_replace(g.""Cpf"", '[^0-9]', '', 'g')
                  );
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Users"" u
                SET ""Cpf"" = regexp_replace(u.""Cpf"", '[^0-9]', '', 'g')
                WHERE u.""Cpf"" IS NOT NULL
                  AND u.""Cpf"" <> regexp_replace(u.""Cpf"", '[^0-9]', '', 'g')
                  AND NOT EXISTS (
                      SELECT 1 FROM ""Users"" o
                      WHERE o.""Id"" <> u.""Id""
                        AND o.""Cpf"" IS NOT NULL
                        AND regexp_replace(o.""Cpf"", '[^0-9]', '', 'g')
                            = regexp_replace(u.""Cpf"", '[^0-9]', '', 'g')
                  );
            ");

            // ── Parte 2: trocar o escopo do índice único de paciente ────────────
            // Era único no mundo inteiro; passa a ser único por fisioterapeuta.
            // Motivo: a mesma pessoa pode ser paciente de duas profissionais, e a
            // aplicação já validava por fisioterapeuta — o banco é que discordava,
            // devolvendo erro 500 em vez de uma mensagem clara.
            migrationBuilder.DropIndex(
                name: "IX_Patients_Cpf",
                table: "Patients");

            // O índice de PhysioId sozinho é redundante: o índice composto
            // (PhysioId, Cpf) já atende buscas que filtram só por PhysioId,
            // porque PhysioId é a primeira coluna dele.
            migrationBuilder.DropIndex(
                name: "IX_Patients_PhysioId",
                table: "Patients");

            migrationBuilder.CreateIndex(
                name: "IX_Patients_PhysioId_Cpf",
                table: "Patients",
                columns: new[] { "PhysioId", "Cpf" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Só os índices voltam ao estado anterior. A limpeza de máscara NÃO é
            // desfeita de propósito: recolocar pontos e traços seria inventar dado,
            // e o formato sem máscara é o correto de qualquer forma.
            migrationBuilder.DropIndex(
                name: "IX_Patients_PhysioId_Cpf",
                table: "Patients");

            migrationBuilder.CreateIndex(
                name: "IX_Patients_Cpf",
                table: "Patients",
                column: "Cpf",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Patients_PhysioId",
                table: "Patients",
                column: "PhysioId");
        }
    }
}
