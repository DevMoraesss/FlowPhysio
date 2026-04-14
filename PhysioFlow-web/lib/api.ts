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

    // Token expirado ou inválido → redireciona para login
    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('physioflow_token');
            localStorage.removeItem('physioflow_user');
            document.cookie = 'physioflow_token=; path=/; max-age=0';
            window.location.href = '/login';
        }
        throw new Error('Sessão expirada. Faça login novamente.');
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
