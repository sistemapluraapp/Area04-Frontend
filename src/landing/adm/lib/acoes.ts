"use client";
// Na Plura o ADM é estático (Cloudflare Pages): as "server actions" do Festival viraram chamadas ao backend da Área 04.
// Os nomes das funções e o formato das respostas são os mesmos do Festival.
import { ApiError, BASE_URL, request } from "@/lib/api";
import { PAGE_TEMPLATES, defaultHomeContent, normalizeContent } from "@/landing/shared/blocks";
import { mergeSettings } from "@/landing/shared/theme";
import type { EventSummary, PageContent, PageKind, PageStatus, SiteSettings, SubmissionStatus } from "@/landing/shared/types";
import type { Metrics } from "./metrics";
import type { Submission, SubmissionFilters } from "./submissions";

type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

async function tentar<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado." };
  }
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

// ===== Páginas =====

export interface PageMeta {
  title: string;
  slug: string;
  kind: PageKind;
  category: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  cover_url: string | null;
  show_in_nav: boolean;
  seo: { title?: string; description?: string; image?: string };
}

export interface PageListRow {
  id: string;
  kind: PageKind;
  slug: string;
  title: string;
  status: PageStatus;
  publish_at: string | null;
  category: string | null;
  starts_at: string | null;
  show_in_nav: boolean;
  sort_order: number;
  published_at: string | null;
  updated_at: string;
  updated_by: string | null;
  tem_rascunho: boolean;
}

export async function ensureHome() {
  const r = await request<{ id: string }>("/landing/paginas/inicio", json("POST", { content: defaultHomeContent() }));
  return r.id;
}

export async function listPages() {
  const r = await request<{ paginas: PageListRow[] }>("/landing/paginas");
  return r.paginas;
}

export async function createPage(input: { title: string; kind: PageKind; template: string }): Promise<Result<string>> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Informe um título." };
  if (input.kind === "home") return { ok: false, error: "A página inicial já existe." };
  const tpl = PAGE_TEMPLATES.find((t) => t.id === input.template) ?? PAGE_TEMPLATES[0];
  return tentar(async () => (await request<{ id: string }>("/landing/paginas", json("POST", { title, kind: input.kind, content: tpl.build(title) }))).id);
}

export async function duplicatePage(id: string): Promise<Result<string>> {
  return tentar(async () => (await request<{ id: string }>(`/landing/paginas/${id}/duplicar`, json("POST"))).id);
}

export async function deletePage(id: string): Promise<Result> {
  return tentar(() => request(`/landing/paginas/${id}`, json("DELETE")));
}

export async function reorderPages(ids: string[]): Promise<Result> {
  return tentar(() => request("/landing/paginas/ordem", json("PUT", { ids })));
}

export async function setStatus(id: string, status: "draft" | "published"): Promise<Result> {
  return tentar(() => request(`/landing/paginas/${id}/status`, json("PATCH", { status })));
}

export async function saveDraft(id: string, content: PageContent): Promise<Result<string>> {
  return tentar(async () => (await request<{ savedAt: string }>(`/landing/paginas/${id}/rascunho`, json("PUT", { content: normalizeContent(content) }))).savedAt);
}

/** Publica o rascunho agora (ou agenda para `at`). Guarda uma versão no histórico. */
export async function publishPage(id: string, content: PageContent, at?: string | null): Promise<Result> {
  return tentar(() => request(`/landing/paginas/${id}/publicar`, json("POST", { content: normalizeContent(content), at: at || null })));
}

export async function updatePageMeta(id: string, meta: PageMeta): Promise<Result<string>> {
  if (!meta.title.trim()) return { ok: false, error: "Informe um título." };
  return tentar(async () => (await request<{ slug: string }>(`/landing/paginas/${id}`, json("PATCH", meta))).slug);
}

export async function listVersions(id: string) {
  const r = await request<{ versoes: { id: string; created_at: string; author: string }[] }>(`/landing/paginas/${id}/versoes`);
  return r.versoes;
}

export async function getVersion(versionId: string): Promise<PageContent | null> {
  try {
    const r = await request<{ content: unknown }>(`/landing/versoes/${versionId}`);
    return normalizeContent(r.content);
  } catch {
    return null;
  }
}

export interface EditorData {
  page: PageMeta & { id: string; status: PageStatus; publish_at: string | null; published_at: string | null; content: unknown };
  draft: unknown;
  settings: Partial<SiteSettings> | null;
  events: EventSummary[];
}

export async function loadEditor(id: string) {
  return request<EditorData>(`/landing/paginas/${id}`);
}

// ===== Configurações =====

export async function getSettings(): Promise<SiteSettings> {
  return mergeSettings(await request<Partial<SiteSettings> | null>("/landing/configuracoes"));
}

export async function updateSettings(patch: Partial<SiteSettings>): Promise<Result> {
  return tentar(() => request("/landing/configuracoes", json("PATCH", patch)));
}

// ===== Inscritos =====

function query(f: SubmissionFilters) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function listSubmissions(f: SubmissionFilters) {
  return request<{ inscritos: Submission[]; total: number; novos: number; por_status: Record<string, number>; paginas: { id: string; title: string }[] }>(`/landing/inscritos${query(f)}`);
}

export async function updateSubmission(id: string, patch: { status?: SubmissionStatus; notes?: string | null }): Promise<Result> {
  return tentar(() => request(`/landing/inscritos/${id}`, json("PATCH", patch)));
}

export async function deleteSubmission(id: string): Promise<Result> {
  return tentar(() => request(`/landing/inscritos/${id}`, json("DELETE")));
}

/** Baixa a planilha (CSV) com os mesmos filtros da tela. */
export async function downloadSubmissionsCsv(f: SubmissionFilters) {
  const res = await comToken(`/landing/inscritos/csv${query(f)}`, {});
  if (!res.ok) throw new ApiError("Não foi possível gerar a planilha.");
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "inscritos-plura.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ===== Métricas e painel =====

export async function getMetrics(from: Date, to: Date): Promise<Metrics | null> {
  const dia = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  try {
    return await request<Metrics>(`/landing/metricas?de=${dia(from)}&ate=${dia(to)}`);
  } catch {
    return null;
  }
}

export async function getSummary() {
  return request<{ novos: number; paginas: { total: number; publicadas: number }; visitas_7d: number; pessoas_7d: number }>("/landing/resumo");
}

// ===== Envio de arquivos (multipart, sem Content-Type JSON) =====

export async function comToken(path: string, init: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("plura_admin_token") : null;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (res.status === 401) {
    // Sessão expirada: uma chamada comum renova o token; depois repete o envio
    await request("/me").catch(() => null);
    const novo = localStorage.getItem("plura_admin_token");
    if (novo && novo !== token) {
      headers.set("Authorization", `Bearer ${novo}`);
      res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
    }
  }
  return res;
}
