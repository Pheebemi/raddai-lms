/**
 * Admissions API.
 *
 * The public calls here are deliberately unauthenticated — an applicant never
 * gets an account. Access to a single application is gated on the reference,
 * or on email/phone plus the applicant's date of birth.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface AdmissionLevel {
  value: number;
  label: string;
  fee: number;
}

export interface AdmissionInfo {
  is_open: boolean;
  academic_year?: string;
  closes_on?: string | null;
  instructions: string;
  levels: AdmissionLevel[];
}

export interface StartedApplication {
  reference: string;
  status: string;
  fee_amount: number;
  full_name: string;
  level_display: string;
  contact_email: string;
  contact_phone: string;
}

export interface LookupResult {
  reference: string;
  full_name: string;
  level_display: string;
  status: string;
  status_display: string;
  is_paid: boolean;
  fee_amount: number;
  missing_fields: string[];
  can_print: boolean;
}

export interface Application {
  id: number;
  reference: string;
  status: string;
  status_display: string;
  full_name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  level: number;
  level_display: string;
  academic_year_name: string;
  date_of_birth: string;
  contact_email: string;
  contact_phone: string;
  fee_amount: string;
  amount_paid: string | null;
  paid_at: string | null;
  gender: string;
  nationality: string;
  state_of_origin: string;
  lga: string;
  religion: string;
  home_address: string;
  blood_group: string;
  genotype: string;
  medical_info: string;
  previous_school: string;
  previous_class: string;
  reason_for_leaving: string;
  guardian_name: string;
  guardian_relationship: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_occupation: string;
  guardian_address: string;
  father_phone: string;
  mother_phone: string;
  agrees_to_school_authority: boolean;
  confirms_rules_read: boolean;
  passport_photo: string | null;
  missing_fields: string[];
  submitted_at: string | null;
  created_at: string;
  decision_note: string;
  decided_by_name: string | null;
  decided_at: string | null;
}

/** Turns a DRF error body into something worth showing a parent. */
const readError = async (response: Response): Promise<string> => {
  const body = await response.json().catch(() => null);
  if (!body) return `Something went wrong (${response.status}).`;
  if (typeof body.error === 'string') return body.error;
  if (Array.isArray(body.non_field_errors)) return body.non_field_errors.join(' ');

  const firstField = Object.entries(body).find(([, value]) => Array.isArray(value));
  if (firstField) return (firstField[1] as string[]).join(' ');

  return `Something went wrong (${response.status}).`;
};

const publicRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
};

const authHeaders = () => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('edumanage_token')
    : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const managementRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: authHeaders(),
    ...init,
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
};

// --- public ---

export const admissionsApi = {
  info: () => publicRequest<AdmissionInfo>('/admissions/info/'),

  start: (payload: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    contact_email?: string;
    contact_phone: string;
    level: number;
  }) => publicRequest<StartedApplication>('/admissions/start/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  verifyPayment: (transaction_id: string | number, reference: string) =>
    publicRequest<Application>('/admissions/verify-payment/', {
      method: 'POST',
      body: JSON.stringify({ transaction_id, reference }),
    }),

  lookup: (identifier: string, date_of_birth: string) =>
    publicRequest<{ applications: LookupResult[] }>('/admissions/lookup/', {
      method: 'POST',
      body: JSON.stringify({ identifier, date_of_birth }),
    }),

  get: (reference: string) =>
    publicRequest<Application>(`/admissions/${reference}/`),

  save: (reference: string, fields: Record<string, string | boolean>) =>
    publicRequest<{ saved_at: string; missing_fields: string[] }>(
      `/admissions/${reference}/save/`,
      { method: 'PATCH', body: JSON.stringify(fields) },
    ),

  /** Passport photo goes up on its own — multipart, so no JSON content-type. */
  uploadPhoto: async (reference: string, file: File) => {
    const form = new FormData();
    form.append('passport_photo', file);
    const response = await fetch(`${API_BASE_URL}/admissions/${reference}/save/`, {
      method: 'PATCH',
      body: form,
    });
    if (!response.ok) throw new Error(await readError(response));
    return response.json();
  },

  submit: (reference: string) =>
    publicRequest<Application>(`/admissions/${reference}/submit/`, { method: 'POST' }),
};

// --- management ---

export interface AdmissionStats {
  total: number;
  by_status: Record<string, number>;
  total_collected: number;
}

export interface AdmissionSetting {
  id: number;
  academic_year: number;
  academic_year_name: string;
  is_open: boolean;
  closes_on: string | null;
  instructions: string;
  accepting_applications: boolean;
  fees: { id: number; level: number; level_display: string; amount: string }[];
}

const unwrapList = <T>(body: unknown): T[] =>
  Array.isArray(body) ? body : ((body as { results?: T[] })?.results ?? []);

export const admissionsManagementApi = {
  list: async (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    const body = await managementRequest<unknown>(
      `/applications/${query ? `?${query}` : ''}`,
    );
    return unwrapList<Application>(body);
  },

  get: (id: number) => managementRequest<Application>(`/applications/${id}/`),

  stats: () => managementRequest<AdmissionStats>('/applications/stats/'),

  decide: (id: number, decision: string, note = '') =>
    managementRequest<Application>(`/applications/${id}/decision/`, {
      method: 'POST',
      body: JSON.stringify({ decision, note }),
    }),

  settings: async () => {
    const body = await managementRequest<unknown>('/admission-settings/');
    return unwrapList<AdmissionSetting>(body);
  },

  createSetting: (academic_year: number) =>
    managementRequest<AdmissionSetting>('/admission-settings/', {
      method: 'POST',
      body: JSON.stringify({ academic_year, is_open: false }),
    }),

  updateSetting: (id: number, payload: Partial<AdmissionSetting>) =>
    managementRequest<AdmissionSetting>(`/admission-settings/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  replaceFees: (id: number, fees: { level: number; amount: number }[]) =>
    managementRequest<AdmissionSetting>(`/admission-settings/${id}/fees/`, {
      method: 'PUT',
      body: JSON.stringify({ fees }),
    }),
};
