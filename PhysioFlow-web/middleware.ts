import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lista de rotas que NÃO precisam de login
// Qualquer rota que NÃO esteja aqui vai exigir autenticação
const publicRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Verifica se a rota atual é pública (login ou register)
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // Tenta ler o token do cookie
    const token = request.cookies.get("physioflow_token")?.value;

    // CASO 1: Rota protegida + sem token → manda para o login
    if (!isPublicRoute && !token) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    // CASO 2: Já está logado e tentou acessar /login ou /register → manda para o dashboard
    if (isPublicRoute && token) {
        const dashboardUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(dashboardUrl);
    }

    // CASO 3: Tudo certo → deixa passar
    return NextResponse.next();
}

// Diz ao Next.js em quais rotas o middleware deve rodar
// O "matcher" abaixo exclui arquivos estáticos (imagens, fontes, etc.)
// e rotas internas do Next.js (_next/)
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
    ],
};
