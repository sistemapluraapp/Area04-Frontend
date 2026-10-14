"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, ExternalLink, FileText, Image as ImageIcon, Inbox, LayoutDashboard, Menu, Settings, UserCircle, X } from "lucide-react";
import { BrandIcon } from "@/landing/shared/render/BrandIcon";

const ITEMS = [
  { href: "/landing", label: "Painel", icon: LayoutDashboard },
  { href: "/landing/paginas", label: "Páginas e eventos", icon: FileText },
  { href: "/landing/midia", label: "Mídia", icon: ImageIcon },
  { href: "/landing/inscritos", label: "Inscritos", icon: Inbox, badge: true },
  { href: "/landing/metricas", label: "Métricas", icon: BarChart3 },
  { href: "/landing/configuracoes", label: "Configurações", icon: Settings },
];

// Na Plura quem tem a permissão "comunicacao" cuida da landing inteira (no Festival havia editor e administrador).
// "Usuários" fica em Administradores e logs, no painel da Plura.

export function Sidebar({ name, email, newCount, siteUrl, icon }: { name: string; email: string; newCount: number; siteUrl: string; icon?: string }) {
  const [path, setPath] = useState("");
  useEffect(() => setPath(window.location.pathname.replace(/\/$/, "") || "/"), []);
  const [open, setOpen] = useState(false);
  const items = ITEMS;
  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map((i) => {
        const active = i.href === "/landing" ? path === "/landing" : path.startsWith(i.href);
        const Icon = i.icon;
        return (
          <a key={i.href} href={i.href} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-brand-500 text-white" : "text-zinc-700 hover:bg-zinc-100"}`}>
            <Icon size={18} />
            <span className="flex-1">{i.label}</span>
            {i.badge && newCount > 0 && <span className={`adm-badge ${active ? "bg-white/25 text-white" : "bg-amber-100 text-amber-800"}`}>{newCount}</span>}
          </a>
        );
      })}
      <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100">
        <ExternalLink size={18} /> Ver site
      </a>
    </nav>
  );
  const user = (
    <div className="border-t border-zinc-200 p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <UserCircle size={30} className="text-zinc-400" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{name}</div>
          <div className="truncate text-xs text-zinc-500">{email}</div>
        </div>
      </div>
      <a href="/dashboard" className="adm-btn-ghost mt-1 w-full justify-start text-zinc-500"><ArrowLeft size={16} /> Voltar ao painel da Plura</a>
    </div>
  );
  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:hidden">
        <span className="flex items-center gap-2 font-semibold"><BrandIcon url={icon} className="h-6" /> Plura · Landing page</span>
        <button type="button" aria-label="Menu" onClick={() => setOpen(true)}><Menu /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <span className="flex items-center gap-2 font-semibold"><BrandIcon url={icon} className="h-6" /> Plura · Landing page</span>
              <button type="button" aria-label="Fechar" onClick={() => setOpen(false)}><X /></button>
            </div>
            {nav}
            {user}
          </aside>
        </div>
      )}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-5">
          <BrandIcon url={icon} className="h-8" />
          <div className="leading-tight">
            <div className="text-sm font-semibold">Plura</div>
            <div className="text-xs text-zinc-500">Landing page</div>
          </div>
        </div>
        {nav}
        {user}
      </aside>
    </>
  );
}
