'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { normaliseGhanaPhone, isValidGhanaPhone } from '@/lib/utils/phone';
import type { UserRole, OTPStep } from '@/types';

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'student', label: 'Student', desc: 'Book rides, browse listings' },
  { value: 'driver', label: 'Driver', desc: 'Accept ride requests' },
  { value: 'business_owner', label: 'Business', desc: 'List your service' },
  { value: 'landlord', label: 'Landlord', desc: 'Post accommodation' },
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<OTPStep>('phone');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    let normalised: string;
    try {
      normalised = normaliseGhanaPhone(phone);
    } catch {
      setError('Enter a valid Ghana phone number (e.g. 0244 123 456)');
      return;
    }

    if (!isValidGhanaPhone(normalised)) {
      setError('Enter a valid Ghana mobile number.');
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone: normalised,
      options: {
        data: { full_name: fullName.trim(), role },
        channel: 'sms',
      },
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setPhone(normalised);
    setStep('otp');
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });
    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName.trim(),
        phone,
        role,
      });
    }

    router.push('/newsfeed');
  }

  async function handleGoogleSignIn() {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (oauthError) setError(oauthError.message);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#003087] text-xl font-black text-[#FFD700]">
          CC
        </div>
        <h1 className="text-2xl font-bold text-[#003087]">Create account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Join the CampusConnect UCC community
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="full_name" className="text-sm font-medium leading-none">
                Full Name
              </label>
              <input
                id="full_name"
                type="text"
                placeholder="Kwame Mensah"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-sm font-medium leading-none">
                Ghana Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="0244 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                inputMode="tel"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium leading-none">I am a…</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      role === value
                        ? 'border-[#003087] bg-[#003087] text-white'
                        : 'border-border bg-background hover:bg-muted'
                    }`}
                  >
                    <p className="text-sm font-semibold">{label}</p>
                    <p className={`text-xs ${role === value ? 'text-blue-200' : 'text-muted-foreground'}`}>
                      {desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center rounded-md bg-[#003087] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#002070] disabled:opacity-60"
            >
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to <strong>{phone}</strong>
            </p>
            <div className="space-y-1.5">
              <label htmlFor="otp" className="text-sm font-medium leading-none">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                autoComplete="one-time-code"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg font-mono tracking-widest ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center rounded-md bg-[#003087] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#002070] disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Verify & Create Account'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); setError(null); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Change number
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[#003087] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
