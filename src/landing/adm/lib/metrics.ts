export interface Metrics {
  totals: { views: number; visitors: number; submissions: number; clicks: number };
  daily: { date: string; views: number; visitors: number; submissions: number }[];
  pages: { page_id: string | null; path: string; title: string | null; views: number; visitors: number; submissions: number }[];
  clicks: { target: string; label: string | null; clicks: number; people: number }[];
  sources: { source: string; visitors: number; views: number }[];
  devices: { device: string; visitors: number }[];
  cities: { city: string; n: number }[];
  heard: { label: string; n: number }[];
}

export function periodRange(days: number) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 86400000);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}
