"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/landing/adm/components/PageHeader";
import { SettingsForm } from "@/landing/adm/telas/SettingsForm";
import { getSettings, listPages } from "@/landing/adm/lib/acoes";
import { SITE_URL } from "@/landing/adm/lib/navegacao";
import type { SiteSettings } from "@/landing/shared/types";
import { Carregando, Falha, PainelLanding, useParametros } from "@/landing/adm/Painel";

function Conteudo() {
  const params = useParametros();
  const [d, setD] = useState<{ s: SiteSettings; pages: { title: string; slug: string; kind: string }[] } | null>(null);
  const [erro, setErro] = useState("");
  useEffect(() => {
    Promise.all([getSettings(), listPages()])
      .then(([s, pages]) => setD({ s, pages: pages.filter((p) => p.kind !== "home").map((p) => ({ title: p.title, slug: p.slug, kind: p.kind })) }))
      .catch((e) => setErro(e instanceof Error ? e.message : "Não foi possível carregar as configurações."));
  }, []);
  return (
    <>
      <PageHeader title="Configurações do site" description="Informações do site, identidade visual, menu e rodapé. As mudanças valem para a landing page toda." />
      {erro ? <Falha texto={erro} /> : !d || !params ? <Carregando /> : (
        <SettingsForm initial={d.s} tab={params.aba || "geral"} pages={d.pages} siteUrl={SITE_URL} />
      )}
    </>
  );
}

export default function SettingsPage() {
  return <PainelLanding titulo="Configurações"><Conteudo /></PainelLanding>;
}
