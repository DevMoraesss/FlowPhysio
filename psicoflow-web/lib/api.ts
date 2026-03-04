const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('psicoflow_token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

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
            throw new Error(messages);
        }

        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }
    return response.text();
}
