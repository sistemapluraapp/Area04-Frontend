"use client";
import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { PageHeader, Container } from "@/landing/adm/components/PageHeader";
import type { Submission, SubmissionFilters } from "@/landing/adm/lib/submissions";
import { SubmissionsTable } from "@/landing/adm/telas/SubmissionsTable";
import { downloadSubmissionsCsv, listSubmissions } from "@/landing/adm/lib/acoes";
import { useRecarregar } from "@/landing/adm/lib/navegacao";
import { Carregando, Falha, PainelLanding, useParametros } from "@/landing/adm/Painel";

type Dados = Awaited<ReturnType<typeof listSubmissions>>;

function Conteudo() {
  const params = useParametros();
  const [d, setD] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");
  const [baixando, setBaixando] = useState(false);
  const f: SubmissionFilters = params ?? {};
  const carregar = useCallback(() => {
    if (!params) return;
    listSubmissions(params).then(setD).catch((e) => setErro(e instanceof Error ? e.message : "Não foi possível carregar os inscritos."));
  }, [params]);
  useEffect(() => { carregar(); }, [carregar]);
  useRecarregar(carregar);
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  const exportar = async () => {
    setBaixando(true);
    try { await downloadSubmissionsCsv(f); } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao exportar."); }
    setBaixando(false);
  };
  return (
    <>
      <PageHeader
        title="Inscritos"
        description="Pessoas que enviaram o formulário de interesse. Os dados ficam só aqui no painel."
        actions={<button type="button" onClick={exportar} disabled={baixando} className="adm-btn-secondary"><Download size={16} /> {baixando ? "Gerando…" : "Exportar planilha (CSV)"}</button>}
      />
      {erro ? <Falha texto={erro} /> : !d ? <Carregando /> : (
        <Container>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["novo", "contatado", "confirmado", "descartado"] as const).map((s) => (
              <a key={s} href={`/landing/inscritos?status=${s}`} className={`adm-card p-4 ${f.status === s ? "ring-2 ring-brand-500" : ""}`}>
                <div className="text-xs uppercase tracking-wide text-zinc-500">{{ novo: "Novos", contatado: "Contatados", confirmado: "Confirmados", descartado: "Descartados" }[s]}</div>
                <div className="mt-1 text-2xl font-semibold">{d.por_status?.[s] ?? 0}</div>
              </a>
            ))}
          </div>
          <form className="adm-card mb-4 flex flex-wrap items-end gap-3 p-4">
            <label className="adm-label min-w-48 flex-1">Buscar<input name="q" defaultValue={f.q} placeholder="Nome, e-mail, cidade, telefone" className="adm-input" /></label>
            <label className="adm-label">Status
              <select name="status" defaultValue={f.status ?? "todos"} className="adm-input">
                <option value="todos">Todos</option>
                <option value="novo">Novo</option>
                <option value="contatado">Contatado</option>
                <option value="confirmado">Confirmado</option>
                <option value="descartado">Descartado</option>
              </select>
            </label>
            <label className="adm-label">Página de origem
              <select name="page" defaultValue={f.page ?? "todas"} className="adm-input">
                <option value="todas">Todas</option>
                {d.paginas.map((p) => (<option key={p.id} value={p.id}>{p.title}</option>))}
                <option value="sem">Sem página</option>
              </select>
            </label>
            <label className="adm-label">De<input type="date" name="de" defaultValue={f.de} className="adm-input" /></label>
            <label className="adm-label">Até<input type="date" name="ate" defaultValue={f.ate} className="adm-input" /></label>
            <button className="adm-btn-primary">Filtrar</button>
            {qs && <a href="/landing/inscritos" className="adm-btn-ghost">Limpar</a>}
          </form>
          <SubmissionsTable rows={d.inscritos as Submission[]} total={d.total} pages={Object.fromEntries(d.paginas.map((p) => [p.id, p.title]))} />
        </Container>
      )}
    </>
  );
}

export default function SubmissionsPage() {
  return <PainelLanding titulo="Inscritos"><Conteudo /></PainelLanding>;
}
