const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async get(path: string) {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async post(path: string, body?: any) {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async put(path: string, body?: any) {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async patch(path: string, body?: any) {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async delete(path: string) {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }
}

export const api = new ApiClient(API_URL);
