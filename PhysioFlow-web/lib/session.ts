/**
 * Sessão no navegador, num lugar só. Antes o login, o menu e o apiFetch repetiam cada um o seu
 * pedaço deste código, e bastava esquecer um para a saída deixar sobra.
 *
 * O token fica no localStorage (é o que o apiFetch manda para a API) e num cookie (é o que o
 * middleware enxerga). O perfil também vai num cookie, para o middleware mandar cada um para a
 * sua área. Nada disso é segurança: quem decide o acesso é a API, pelo perfil dentro do token.
 */
export const ADMIN_ROLE = "Administrator";

const DAY = 60 * 60 * 24;

export function saveSession(data: { accessToken: string; user: { role: string } }) {
    localStorage.setItem("physioflow_token", data.accessToken);
    localStorage.setItem("physioflow_user", JSON.stringify(data.user));
    document.cookie = `physioflow_token=${data.accessToken}; path=/; max-age=${DAY}`;
    document.cookie = `physioflow_role=${data.user.role}; path=/; max-age=${DAY}`;
}

export function clearSession() {
    localStorage.removeItem("physioflow_token");
    localStorage.removeItem("physioflow_user");
    document.cookie = "physioflow_token=; path=/; max-age=0";
    document.cookie = "physioflow_role=; path=/; max-age=0";
}

/** Primeira tela de cada perfil depois do login. */
export function homeFor(role: string | undefined): string {
    return role === ADMIN_ROLE ? "/admin" : "/dashboard";
}
