const ACUITY_API_BASE = 'https://acuityscheduling.com/api/v1';

function getAuthHeader(): string {
  const userId = import.meta.env.ACUITY_USER_ID;
  const apiKey = import.meta.env.ACUITY_API_KEY;

  if (!userId || !apiKey) {
    throw new Error(
      'Missing ACUITY_USER_ID or ACUITY_API_KEY environment variables'
    );
  }

  return 'Basic ' + btoa(`${userId}:${apiKey}`);
}

async function acuityFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${ACUITY_API_BASE}${endpoint}`, {
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Acuity API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export interface AcuityClassSlot {
  id: number;
  time: string;
  slotsAvailable: number;
  appointmentTypeID: number;
  calendarID: number;
}

export interface AcuityAppointmentType {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: string;
  category: string;
  type: string;
}

export async function getClassAvailability(
  appointmentTypeId: string,
  month: string
): Promise<AcuityClassSlot[]> {
  const params = new URLSearchParams({
    appointmentTypeID: appointmentTypeId,
    month,
    includeUnavailable: 'true',
  });

  return acuityFetch<AcuityClassSlot[]>(
    `/availability/classes?${params.toString()}`
  );
}

export async function getAppointmentType(
  id: string
): Promise<AcuityAppointmentType> {
  const types =
    await acuityFetch<AcuityAppointmentType[]>('/appointment-types');
  const found = types.find((t) => t.id === Number(id));

  if (!found) {
    throw new Error(`Appointment type ${id} not found`);
  }

  return found;
}

export type AvailabilityStatus = 'available' | 'few_spots' | 'sold_out';

export function computeAvailabilityStatus(
  slotsAvailable: number
): AvailabilityStatus {
  if (slotsAvailable <= 0) return 'sold_out';
  if (slotsAvailable <= 3) return 'few_spots';
  return 'available';
}
