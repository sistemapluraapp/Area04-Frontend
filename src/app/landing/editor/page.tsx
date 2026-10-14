"use client";
import { useEffect, useState } from "react";
import { mergeSettings } from "@/landing/shared/theme";
import { normalizeContent } from "@/landing/shared/blocks";
import type { EventSummary, PageContent, SiteSettings } from "@/landing/shared/types";
import { Editor, type EditorPage } from "@/landing/adm/components/editor/Editor";
import { loadEditor } from "@/landing/adm/lib/acoes";
import { SITE_URL } from "@/landing/adm/lib/navegacao";
import { useTituloPagina } from "@/lib/useTituloPagina";
import { SemPermissao, useAcessoLanding, useParametros } from "@/landing/adm/Painel";
import "@/landing/adm/landing-adm.css";

type Dados = { page: EditorPage; content: PageContent; publishedJson: string; settings: SiteSettings; events: EventSummary[] };

export default function EditPage() {
  useTituloPagina("Editor · Landing page");
  const { pronto, permitido } = useAcessoLanding();
  const params = useParametros();
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!pronto || !permitido || !params) return;
    if (!params.id) return setErro("Página não encontrada.");
    loadEditor(params.id)
      .then(({ page, draft, settings, events }) => {
        const published = normalizeContent(page.content);
        const content = draft ? normalizeContent(draft) : published;
        setDados({
          page: {
            id: page.id, title: page.title, slug: page.slug, kind: page.kind, status: page.status, publish_at: page.publish_at, published_at: page.published_at,
            category: page.category, starts_at: page.starts_at, ends_at: page.ends_at, location: page.location, cover_url: page.cover_url, show_in_nav: page.show_in_nav, seo: page.seo ?? {},
          },
          content,
          publishedJson: page.published_at ? JSON.stringify(published) : "",
          settings: mergeSettings(settings),
          events: events ?? [],
        });
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Não foi possível abrir a página."));
  }, [pronto, permitido, params]);

  if (!pronto) return null;
  if (!permitido) return <SemPermissao />;
  if (erro) {
    return (
      <div className="fp-adm flex items-center justify-center p-6">
        <div className="adm-card max-w-md p-6 text-center">
          <p className="text-sm text-red-700">{erro}</p>
          <a href="/landing/paginas" className="adm-btn-secondary mt-4">Voltar às páginas</a>
        </div>
      </div>
    );
  }
  if (!dados) return <div className="fp-adm"><p className="p-6 text-sm text-zinc-500">Abrindo o editor…</p></div>;
  return (
    <div className="fp-adm">
      <Editor page={dados.page} initialContent={dados.content} publishedJson={dados.publishedJson} settings={dados.settings} events={dados.events} siteUrl={SITE_URL} />
    </div>
  );
}
