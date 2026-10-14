"use client";
import { useEffect } from "react";

// Substitui o useRouter do Next nas telas copiadas do Festival: lá router.refresh()
// recarregava os dados do servidor; aqui as telas buscam pela API e escutam este aviso.
const EVENTO = "landing:recarregar";

export const SITE_URL = "https://plura.app.br";

export function useRouter() {
  return {
    refresh: () => window.dispatchEvent(new Event(EVENTO)),
    push: (url: string) => { window.location.href = url; },
  };
}

export function useRecarregar(fn: () => void) {
  useEffect(() => {
    window.addEventListener(EVENTO, fn);
    return () => window.removeEventListener(EVENTO, fn);
  }, [fn]);
}

/** Endereço do editor de uma página no ADM da Plura */
export const editorHref = (id: string) => `/landing/editor?id=${id}`;
