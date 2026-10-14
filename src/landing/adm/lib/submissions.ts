import type { SubmissionStatus } from "@/landing/shared/types";

export interface SubmissionFilters {
  q?: string;
  status?: string;
  page?: string;
  de?: string;
  ate?: string;
}

export interface Submission {
  id: string;
  page_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  interests: string[];
  heard_from: string | null;
  message: string | null;
  consent: boolean;
  newsletter: boolean;
  utm: Record<string, string>;
  referrer: string | null;
  status: SubmissionStatus;
  notes: string | null;
  created_at: string;
}

export const STATUS_LABEL: Record<SubmissionStatus, string> = { novo: "Novo", contatado: "Contatado", confirmado: "Confirmado", descartado: "Descartado" };
