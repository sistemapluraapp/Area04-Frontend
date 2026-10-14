import DOMPurify from "dompurify";

// Mesma lista do Festival (sanitize-html), com DOMPurify (já usado na Plura).
// Na Plura a página é montada no navegador, então o DOM está sempre disponível.
const TAGS = ["p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "span", "mark", "hr", "code"];
const ESTILOS: Record<string, RegExp[]> = {
  color: [/^#[0-9a-f]{3,8}$/i, /^rgb\([\d\s,.%]+\)$/i, /^var\(--fp-[a-z]+\)$/],
  "text-align": [/^(left|right|center|justify)$/],
  "font-size": [/^\d+(px|em|rem|%)$/],
};

function limparEstilo(estilo: string) {
  return estilo
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .filter((d) => {
      const [prop, ...resto] = d.split(":");
      const valor = resto.join(":").trim();
      return ESTILOS[prop.trim().toLowerCase()]?.some((r) => r.test(valor));
    })
    .join("; ");
}

let configurado = false;
function configurar() {
  if (configurado) return;
  configurado = true;
  DOMPurify.addHook("afterSanitizeAttributes", (no) => {
    if (no.tagName === "A") {
      no.setAttribute("rel", "noopener noreferrer");
      const href = no.getAttribute("href") ?? "";
      if (href && !/^(https?:|mailto:|tel:|\/|#)/i.test(href)) no.removeAttribute("href");
    }
    if (no.hasAttribute("style")) {
      const limpo = limparEstilo(no.getAttribute("style") ?? "");
      if (limpo && ["SPAN", "P", "H2", "H3", "H4", "MARK"].includes(no.tagName)) no.setAttribute("style", limpo);
      else no.removeAttribute("style");
    }
  });
}

export function cleanHtml(html: string) {
  if (typeof window === "undefined") return "";
  configurar();
  return DOMPurify.sanitize(html ?? "", { ALLOWED_TAGS: TAGS, ALLOWED_ATTR: ["href", "target", "rel", "style"] }) as string;
}
