import apiClient from "@api/client";
import type {
  Appointment,
  AppointmentStatus,
  BranchEarnings,
  Diary,
  EarningsDay,
  EarningsRun,
} from "@shared/types";

export async function fetchDiary(date?: string): Promise<Diary> {
  const { data } = await apiClient.get<Diary>("/staff/diary", {
    params: { date },
  });

  return data;
}

export async function updateAppointmentStatus(input: {
  id: string;
  status: AppointmentStatus;
  reason?: string;
}): Promise<Appointment> {
  const { data } = await apiClient.put<{ data: Appointment }>(
    `/staff/appointments/${input.id}/status`,
    { status: input.status, reason: input.reason },
  );

  return data.data;
}

export async function fetchEarningsToday(): Promise<{
  data: EarningsDay;
  rate: number;
}> {
  const { data } = await apiClient.get<{ data: EarningsDay; rate: number }>(
    "/staff/earnings/today",
  );

  return data;
}

export async function fetchEarningsRun(params?: {
  from?: string;
  to?: string;
}): Promise<EarningsRun> {
  const { data } = await apiClient.get<EarningsRun>("/staff/earnings", {
    params,
  });

  return data;
}

export async function fetchBranchEarnings(
  date?: string,
): Promise<BranchEarnings> {
  const { data } = await apiClient.get<BranchEarnings>(
    "/staff/earnings/branch",
    {
      params: { date },
    },
  );

  return data;
}

export async function fetchAppointment(id: string): Promise<Appointment> {
  const { data } = await apiClient.get<{ data: Appointment }>(
    `/staff/appointments/${id}`,
  );

  return data.data;
}

/** One tap. The clock it starts is what blocks the chair if the cut runs on. */
export async function startCut(id: string): Promise<Appointment> {
  const { data } = await apiClient.put<{ data: Appointment }>(
    `/staff/appointments/${id}/start`,
  );

  return data.data;
}

export async function finishCut(id: string): Promise<Appointment> {
  const { data } = await apiClient.put<{ data: Appointment }>(
    `/staff/appointments/${id}/finish`,
  );

  return data.data;
}

export async function saveStaffNote(
  id: string,
  staffNote: string,
): Promise<Appointment> {
  const { data } = await apiClient.put<{ data: Appointment }>(
    `/staff/appointments/${id}/note`,
    { staff_note: staffNote },
  );

  return data.data;
}

/** The till. Cash and card confirm on the spot; mobile money waits a check. */
export async function takePayment(input: {
  id: string;
  method: string;
  amount_cents: number;
  reference?: string;
}): Promise<{ outstanding: { cents: number; formatted: string } }> {
  const { data } = await apiClient.post<{
    outstanding: { cents: number; formatted: string };
  }>(`/staff/appointments/${input.id}/payments`, {
    method: input.method,
    amount_cents: input.amount_cents,
    reference: input.reference,
  });

  return data;
}

/**
 * Find whoever is standing at the desk.
 *
 * Not bound to a date, so a client who booked Thursday and walked in on
 * Wednesday still comes up. `claimable` is the subset this barber may take
 * onto themselves, worked out by the server so the screen does not have to
 * guess at the rules.
 */
export async function lookupVisits(
  q: string,
): Promise<{ data: Appointment[]; claimable: string[] }> {
  const { data } = await apiClient.get<{
    data: Appointment[];
    meta: { claimable: string[] };
  }>("/staff/lookup", { params: { q } });

  return { data: data.data, claimable: data.meta?.claimable ?? [] };
}

/**
 * Take the booking and start it, in one tap.
 *
 * For when nobody is on the desk: the client is waiting and the barber
 * standing there is not the one the booking was auto-assigned to. Claiming
 * moves the commission too, so the right barber is paid.
 */
export async function claimCut(id: string): Promise<Appointment> {
  const { data } = await apiClient.put<{ data: Appointment }>(
    `/staff/appointments/${id}/claim`,
  );

  return data.data;
}
