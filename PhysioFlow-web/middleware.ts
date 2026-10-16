import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lista de rotas que NÃO precisam de login
// Qualquer rota que NÃO esteja aqui vai exigir autenticação
const publicRoutes = ["/login"];

// Área do perfil Administrador (gestão de contas)
const adminArea = "/admin";

// Vale para os dois perfis: é onde a senha provisória vira a senha da pessoa
const changePassword = "/change-password";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Verifica se a rota atual é pública
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // Tenta ler o token e o perfil do cookie
    const token = request.cookies.get("physioflow_token")?.value;
    const isAdmin = request.cookies.get("physioflow_role")?.value === "Administrator";
    const home = isAdmin ? adminArea : "/dashboard";

    // CASO 1: Rota protegida + sem token → manda para o login
    if (!isPublicRoute && !token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // CASO 2: Já está logado e tentou acessar /login → manda para a área do perfil
    if (isPublicRoute && token) {
        return NextResponse.redirect(new URL(home, request.url));
    }

    // CASO 3: Cada perfil na sua área. Isto é só navegação: quem barra de verdade é a API,
    // que responde 403 se o perfil do token não puder abrir aquele recurso.
    if (token && !pathname.startsWith(changePassword)) {
        const inAdminArea = pathname.startsWith(adminArea);
        if (isAdmin !== inAdminArea) {
            return NextResponse.redirect(new URL(home, request.url));
        }
    }

    // CASO 4: Tudo certo → deixa passar
    return NextResponse.next();
}


export const config = {
    matcher: [
        "/((?!_next|.*\\..*).*)",
    ],
};
