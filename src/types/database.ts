export type UserRole = 'student' | 'driver' | 'business_owner' | 'landlord' | 'admin';
export type PostCategory = 'Academic' | 'Events' | 'Lost & Found' | 'General' | 'Urgent';
export type ListingStatus = 'Available' | 'Taken';
export type VehicleType = 'Car' | 'Pragya';
export type RideStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type DriverStatus = 'pending' | 'approved' | 'suspended';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_verified: boolean;
  fcm_token: string | null;
  created_at: string;
}

export interface Driver {
  id: string;
  vehicle_type: VehicleType;
  vehicle_photo: string | null;
  plate_number: string | null;
  status: DriverStatus;
  is_online: boolean;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
  rating: number;
  total_trips: number;
  total_earnings: number;
  commission_owed: number;
}

export interface CommissionPayment {
  id: string;
  driver_id: string;
  amount: number;
  recorded_by: string | null;
  note: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  body: string;
  photo_url: string | null;
  category: PostCategory;
  likes_count: number;
  is_flagged: boolean;
  created_at: string;
}

export interface PostLike {
  post_id: string;
  user_id: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface Accommodation {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price_per_month: number;
  neighbourhood: string;
  photos: string[] | null;
  has_water: boolean;
  has_electricity: boolean;
  has_wifi: boolean;
  has_security: boolean;
  is_self_contained: boolean;
  whatsapp_number: string;
  status: ListingStatus;
  created_at: string;
}

export interface Service {
  id: string;
  user_id: string;
  name: string;
  category: string;
  description: string | null;
  location: string | null;
  phone: string | null;
  whatsapp: string | null;
  opening_hours: string | null;
  photos: string[] | null;
  avg_rating: number;
  review_count: number;
  created_at: string;
}

export interface ServiceReview {
  id: string;
  service_id: string;
  user_id: string;
  rating: number;
  body: string | null;
  created_at: string;
}

export interface FareRate {
  id: string;
  vehicle_type: VehicleType;
  price_per_km: number;
  base_fare: number;
  updated_at: string;
}

export interface Ride {
  id: string;
  student_id: string | null;
  driver_id: string | null;
  vehicle_type: VehicleType;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string | null;
  dest_lat: number;
  dest_lng: number;
  dest_address: string | null;
  distance_km: number | null;
  fare_amount: number | null;
  commission_amount: number | null;
  driver_earnings: number | null;
  payment_method: 'cash' | 'momo';
  status: RideStatus;
  requested_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

// Joined types used in queries
export interface PostWithProfile extends Post {
  profiles: Pick<Profile, 'full_name' | 'avatar_url' | 'is_verified' | 'role'>;
}

export interface RideWithProfiles extends Ride {
  student: Pick<Profile, 'full_name' | 'avatar_url' | 'phone'> | null;
  driver:
    | (Pick<Driver, 'rating' | 'vehicle_type' | 'plate_number'> &
        Pick<Profile, 'full_name' | 'avatar_url' | 'phone'>)
    | null;
}
