/**
 * Arkesel SMS utility — server-only.
 * All functions must only be called from Server Components, Route Handlers,
 * or Server Actions. Never import in Client Components.
 */

const ARKESEL_BASE_URL = 'https://sms.arkesel.com/api/v2';

interface ArkeselSMSPayload {
  sender: string;
  message: string;
  recipients: string[]; // +233XXXXXXXXX format
}

interface ArkeselResponse {
  status: string;
  data?: unknown;
  message?: string;
}

export async function sendSMS(payload: ArkeselSMSPayload): Promise<ArkeselResponse> {
  const apiKey = process.env.ARKESEL_API_KEY;
  if (!apiKey) throw new Error('ARKESEL_API_KEY is not set');

  const res = await fetch(`${ARKESEL_BASE_URL}/sms/send`, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Arkesel SMS failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<ArkeselResponse>;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(phone: string): Promise<string> {
  const otp = generateOTP();
  const message = `Your CampusConnect UCC verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;

  await sendSMS({
    sender: 'CampusUCC',
    message,
    recipients: [phone],
  });

  return otp;
}

export async function sendRideRequestSMS(
  driverPhone: string,
  pickupAddress: string,
  fareAmount: string
): Promise<void> {
  await sendSMS({
    sender: 'CampusUCC',
    message: `New ride request! Pickup: ${pickupAddress}. Fare: ${fareAmount}. Open the app within 30 seconds to accept.`,
    recipients: [driverPhone],
  });
}
