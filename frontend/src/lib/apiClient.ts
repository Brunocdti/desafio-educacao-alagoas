const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function tratarResposta<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const corpo = await res.json().catch(() => null);
    const mensagem = corpo?.erro ?? `Erro ${res.status} ao chamar a API`;
    throw new ApiError(mensagem, res.status);
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(caminho: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const query = new URLSearchParams();
  if (params) {
    for (const [chave, valor] of Object.entries(params)) {
      if (valor !== undefined && valor !== '') query.set(chave, String(valor));
    }
  }
  const querystring = query.toString();
  const res = await fetch(`${API_URL}${caminho}${querystring ? `?${querystring}` : ''}`);
  return tratarResposta<T>(res);
}

export async function apiUpload<T>(caminho: string, arquivo: File): Promise<T> {
  const formData = new FormData();
  formData.append('arquivo', arquivo);
  const res = await fetch(`${API_URL}${caminho}`, { method: 'POST', body: formData });
  return tratarResposta<T>(res);
}
