"use client";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, Container } from "@/landing/adm/components/PageHeader";
import { PagesList, type PageRow } from "@/landing/adm/telas/PagesList";
import { ensureHome, listPages } from "@/landing/adm/lib/acoes";
import { SITE_URL, useRecarregar } from "@/landing/adm/lib/navegacao";
import { Carregando, Falha, PainelLanding } from "@/landing/adm/Painel";

function Conteudo() {
  const [pages, setPages] = useState<PageRow[] | null>(null);
  const [erro, setErro] = useState("");
  const carregar = useCallback(async () => {
    try {
      await ensureHome();
      const rows = await listPages();
      setPages(rows.map((r) => ({ ...r, editor: r.updated_by, pending: r.tem_rascunho })));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar as páginas.");
    }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);
  useRecarregar(carregar);
  return (
    <>
      <PageHeader title="Páginas e eventos" description="Cada página de evento aparece automaticamente no menu “Eventos” do site quando publicada." />
      {erro ? <Falha texto={erro} /> : !pages ? <Carregando /> : (
        <Container>
          <PagesList pages={pages} isAdmin siteUrl={SITE_URL} />
        </Container>
      )}
    </>
  );
}

export default function PagesPage() {
  return <PainelLanding titulo="Páginas e eventos"><Conteudo /></PainelLanding>;
}
