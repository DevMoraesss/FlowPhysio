import { clearSession } from './session';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('physioflow_token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    // Timeout de 15 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
        response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal,
        });
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error('O servidor demorou para responder. Verifique sua conexão.');
        }
        throw new Error('Não foi possível conectar ao servidor.');
    }
    clearTimeout(timeoutId);

    // Token expirado, inválido ou de conta desativada -> volta para o login.
    // No próprio login, 401 é senha errada ou conta desativada: aí a mensagem da API precisa
    // chegar à tela. Antes a página só recarregava, sem dizer nada.
    if (response.status === 401 && !endpoint.startsWith('/auth/')) {
        if (typeof window !== 'undefined') {
            clearSession();
            window.location.href = '/login';
        }
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    // 403 tem dois motivos: senha provisória ainda não trocada (a API manda um código) ou perfil
    // sem acesso, como o administrador numa tela clínica (a API não manda corpo)
    if (response.status === 403) {
        const body = await response.json().catch(() => null);
        if (body?.code === 'password_change_required' && typeof window !== 'undefined') {
            window.location.href = '/change-password';
        }
        throw new Error(body?.message || 'Seu perfil não tem acesso a esta área.');
    }

    if (!response.ok) {
        const text = await response.text();
        let errorData;
        try {
            errorData = JSON.parse(text);
        } catch {
            errorData = { message: text };
        }

        console.error(`API Error [${response.status}]:`, errorData);

        if (errorData.errors) {
            const messages = Object.values(errorData.errors).flat().join('. ');
            throw new Error(messages as string);
        }

        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }
    return response.text();
}
