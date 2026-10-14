"use client";
import { useEffect, useState } from "react";
import { PageHeader, Container } from "@/landing/adm/components/PageHeader";
import { periodRange, type Metrics } from "@/landing/adm/lib/metrics";
import { ensureHome, getMetrics, getSettings, listPages, listSubmissions, type PageListRow } from "@/landing/adm/lib/acoes";
import { editorHref } from "@/landing/adm/lib/navegacao";
import type { Submission } from "@/landing/adm/lib/submissions";
import type { SiteSettings } from "@/landing/shared/types";
import { formatDate, formatDateTime } from "@/landing/shared/format";
import { StatusBadge } from "@/landing/adm/components/StatusBadge";
import { Carregando, Falha, PainelLanding } from "@/landing/adm/Painel";
import { useMeuAcesso } from "@/lib/acesso";
import { ArrowRight, FileText, Image as ImageIcon, Inbox, Palette, Plus } from "lucide-react";

function Stat({ label, value, href, hint }: { label: string; value: string | number; href?: string; hint?: string }) {
  const inner = (
    <>
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
    </>
  );
  return href ? <a href={href} className="adm-card p-5 transition hover:border-brand-500">{inner}</a> : <div className="adm-card p-5">{inner}</div>;
}

type Dados = { list: PageListRow[]; s: SiteSettings; metrics: Metrics | null; recent: Submission[]; newCount: number };

function Dashboard() {
  const acesso = useMeuAcesso();
  const [d, setD] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");
  useEffect(() => {
    const { from, to } = periodRange(7);
    ensureHome()
      .then(() => Promise.all([listPages(), getSettings(), getMetrics(from, to), listSubmissions({})]))
      .then(([pages, s, metrics, subs]) => {
        const list = [...pages].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
        setD({ list, s, metrics, recent: subs.inscritos.slice(0, 6), newCount: subs.novos });
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Não foi possível carregar o painel."));
  }, []);
  if (erro) return <Falha texto={erro} />;
  if (!d) return <Carregando />;
  const { list, s, metrics, recent, newCount } = d;
  const published = list.filter((p) => p.status === "published").length;
  const drafts = list.filter((p) => p.status === "draft").length;
  const checklist = [
    { done: !!s?.brand?.logo_url, label: "Enviar a logo", href: "/landing/configuracoes?aba=identidade" },
    { done: !!s?.brand?.icon_url, label: "Enviar o ícone da marca (PNG sem fundo)", href: "/landing/configuracoes?aba=identidade" },
    { done: !!s?.brand?.hero_cover_url, label: "Enviar a capa da página inicial", href: "/landing/configuracoes?aba=identidade" },
    { done: !!s?.starts_at, label: "Definir datas", href: "/landing/configuracoes?aba=geral" },
    { done: !!s?.location, label: "Definir o local", href: "/landing/configuracoes?aba=geral" },
    { done: list.some((p) => p.kind === "evento" && p.status === "published"), label: "Publicar o primeiro evento", href: "/landing/paginas" },
  ];
  return (
    <>
      <PageHeader title={`Olá, ${acesso?.nome?.split(" ")[0] || "equipe"}!`} description="Resumo da landing page da Plura." actions={<a href="/landing/paginas" className="adm-btn-primary"><Plus size={16} /> Nova página</a>} />
      <Container className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Páginas no ar" value={published} href="/landing/paginas" hint={`${drafts} rascunho(s)`} />
          <Stat label="Novos inscritos" value={newCount ?? 0} href="/landing/inscritos?status=novo" hint="aguardando contato" />
          <Stat label="Visitantes (7 dias)" value={metrics?.totals.visitors ?? 0} href="/landing/metricas?periodo=7" />
          <Stat label="Inscrições (7 dias)" value={metrics?.totals.submissions ?? 0} href="/landing/metricas?periodo=7" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="adm-card p-5 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Editadas recentemente</h2>
              <a href="/landing/paginas" className="text-sm text-brand-600 hover:underline">Ver todas</a>
            </div>
            <ul className="divide-y divide-zinc-100">
              {list.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <a href={editorHref(p.id)} className="flex items-center justify-between gap-3 py-2.5 hover:text-brand-600">
                    <span className="flex items-center gap-2"><FileText size={15} className="text-zinc-400" /> {p.title}</span>
                    <span className="flex items-center gap-3 text-xs text-zinc-500">
                      <StatusBadge status={p.status} publishAt={p.publish_at} />
                      <span className="hidden sm:inline">{formatDateTime(p.updated_at)}</span>
                    </span>
                  </a>
                </li>
              ))}
              {!list.length && <li className="py-4 text-sm text-zinc-500">Nenhuma página ainda.</li>}
            </ul>
          </section>
          <section className="adm-card p-5">
            <h2 className="mb-3 font-semibold">Primeiros passos</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {checklist.map((c) => (
                <li key={c.label}>
                  <a href={c.href} className={`flex items-center gap-2 ${c.done ? "text-zinc-400 line-through" : "text-zinc-800 hover:text-brand-600"}`}>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${c.done ? "border-brand-500 bg-brand-500 text-white" : "border-zinc-300"}`}>{c.done ? "✓" : ""}</span>
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
              <a href="/landing/midia" className="adm-btn-secondary"><ImageIcon size={15} /> Mídia</a>
              <a href="/landing/configuracoes?aba=cores" className="adm-btn-secondary"><Palette size={15} /> Visual</a>
            </div>
          </section>
        </div>
        <section className="adm-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><Inbox size={17} /> Últimos inscritos</h2>
            <a href="/landing/inscritos" className="flex items-center gap-1 text-sm text-brand-600 hover:underline">Ver todos <ArrowRight size={14} /></a>
          </div>
          {recent?.length ? (
            <ul className="divide-y divide-zinc-100 text-sm">
              {recent.map((r) => (
                <li key={r.id} className="flex justify-between py-2">
                  <span>{r.name} {r.city && <span className="text-zinc-500">· {r.city}</span>} {r.status === "novo" && <span className="adm-badge ml-1 bg-amber-100 text-amber-800">novo</span>}</span>
                  <span className="text-xs text-zinc-500">{formatDate(r.created_at, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Ainda ninguém se inscreveu. Adicione o bloco “Formulário de interesse” em alguma página.</p>
          )}
        </section>
      </Container>
    </>
  );
}

export default function LandingPainel() {
  return <PainelLanding titulo="Painel"><Dashboard /></PainelLanding>;
}
