export * from './database';

export type Coordinates = {
  lat: number;
  lng: number;
};

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export type OTPStep = 'phone' | 'otp';
