# Area04-Frontend

Frontend da Área 04 (Administrativa) da Plura — Next.js (export estático) em Cloudflare Pages.

Painel interno da equipe: indicadores agregados, monitorar contas, fila de
moderação, aprovação/reprovação de Certificado de Acessibilidade.
Acesso restrito — protegido também por Cloudflare Access (Fase 2 do plano).

## Deploy
O workflow `.github/workflows/deploy.yml` publica em Cloudflare Pages a cada push.
Precisa dos secrets do repositório: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
