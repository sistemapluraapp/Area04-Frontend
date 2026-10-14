"use client";
import "./landing-adm.css";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/components/AdminNav";
import { useMeuAcesso } from "@/lib/acesso";
import { useTituloPagina } from "@/lib/useTituloPagina";
import { Sidebar } from "./components/Sidebar";
import { getSettings, getSummary } from "./lib/acoes";
import { SITE_URL, useRecarregar } from "./lib/navegacao";

// Equivale ao (painel)/layout.tsx do ADM do Festival: exige login e a permissão "comunicacao"
export function useAcessoLanding() {
  const pronto = useRequireAuth();
  const acesso = useMeuAcesso();
  const permitido = !acesso || acesso.permissoes.includes("comunicacao");
  return { pronto, acesso, permitido };
}

export function SemPermissao() {
  return (
    <div className="fp-adm flex items-center justify-center p-6">
      <div className="adm-card max-w-md p-6 text-center">
        <h1 className="text-lg font-semibold">Sem acesso à landing page</h1>
        <p className="mt-2 text-sm text-zinc-500">Peça a um administrador a permissão “E-mails, boas-vindas, termos e landing page”.</p>
        <a href="/dashboard" className="adm-btn-secondary mt-4">Voltar ao painel</a>
      </div>
    </div>
  );
}

export function PainelLanding({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  useTituloPagina(`${titulo} · Landing page`);
  const { pronto, acesso, permitido } = useAcessoLanding();
  const [icon, setIcon] = useState<string | undefined>();
  const [newCount, setNewCount] = useState(0);
  const [versao, setVersao] = useState(0);
  useRecarregar(() => setVersao((v) => v + 1));
  useEffect(() => {
    if (!pronto || !permitido) return;
    getSettings().then((s) => setIcon(s.brand?.icon_url || undefined)).catch(() => {});
    getSummary().then((r) => setNewCount(r.novos)).catch(() => {});
  }, [pronto, permitido, versao]);
  if (!pronto) return null;
  if (!permitido) return <SemPermissao />;
  return (
    <div className="fp-adm flex min-h-screen flex-col lg:flex-row">
      <Sidebar name={acesso?.nome || acesso?.email?.split("@")[0] || ""} email={acesso?.email ?? ""} newCount={newCount} siteUrl={SITE_URL} icon={icon} />
      <main id="conteudo" tabIndex={-1} className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

export function Carregando() {
  return <p className="px-6 py-10 text-sm text-zinc-500 lg:px-8">Carregando…</p>;
}

export function Falha({ texto }: { texto: string }) {
  return <p className="mx-6 my-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 lg:mx-8">{texto}</p>;
}

/** Lê os parâmetros do endereço (o ADM é exportado como site estático) */
export function useParametros() {
  const [p, setP] = useState<Record<string, string> | null>(null);
  useEffect(() => setP(Object.fromEntries(new URLSearchParams(window.location.search))), []);
  return p;
}
