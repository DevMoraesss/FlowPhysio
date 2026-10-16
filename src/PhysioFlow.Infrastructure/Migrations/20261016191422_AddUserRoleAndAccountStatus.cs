using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhysioFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserRoleAndAccountStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // defaultValue true, NÃO false.
            // O EF gera false por padrão para bool. Com false, toda conta que já existe nasceria
            // desativada, e a fisioterapeuta ficaria sem acesso ao sistema no dia do deploy.
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            // Aqui false está certo: as contas que já existem têm senha escolhida pela própria
            // pessoa, não provisória.
            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // defaultValue 1 = Physiotherapist, NÃO 0.
            // O EF gera 0 para int, mas 0 não existe no enum UserRole, e conta sem perfil não
            // abriria nenhuma tela. Toda conta que já existe é de fisioterapeuta.
            migrationBuilder.AddColumn<int>(
                name: "Role",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");
        }
    }
}
