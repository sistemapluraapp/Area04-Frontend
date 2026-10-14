"use client";
import { PageHeader, Container } from "@/landing/adm/components/PageHeader";
import { MediaLibrary } from "@/landing/adm/components/MediaLibrary";
import { PainelLanding } from "@/landing/adm/Painel";

export default function MediaPage() {
  return (
    <PainelLanding titulo="Mídia">
      <PageHeader title="Biblioteca de mídia" description="Imagens, vídeos, PDFs e fontes usados no site. Clique em um arquivo para editar o texto alternativo, mudar de pasta ou excluir." />
      <Container>
        <div className="adm-card p-5">
          <MediaLibrary />
        </div>
      </Container>
    </PainelLanding>
  );
}
