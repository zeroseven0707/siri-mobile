export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'driver' | 'admin';
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  photo_url?: string | null;
  driver_profile?: DriverProfile;
  created_at: string;
}

export interface DriverProfile {
  id: string;
  vehicle_type: 'motor' | 'mobil';
  license_plate: string;
  status: 'online' | 'offline';
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  icon: string;
  base_price: number;
  description?: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  is_open: boolean;
  food_items?: FoodItem[];
}

export interface FoodItem {
  id: string;
  store_id: string;
  store?: Store;
  name: string;
  price: number;
  description: string | null;
  image: string | null;
  is_available: boolean;
}

export interface Order {
  id: string;
  status: 'pending' | 'accepted' | 'on_progress' | 'completed' | 'cancelled';
  pickup_location: string;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  destination_location: string;
  destination_lat?: number | null;
  destination_lng?: number | null;
  price: number;
  delivery_fee: number;
  notes: string | null;
  completion_token?: string | null;
  service?: Service;
  user?: User;
  driver?: User;
  food_items?: FoodOrderItem[];
  created_at: string;
}

export interface FoodOrderItem {
  id: string;
  food_item?: FoodItem;
  qty: number;
  price: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'payment' | 'refund';
  status: 'pending' | 'success' | 'failed';
  reference: string | null;
  order_id: string | null;
  created_at: string;
}

export interface HomeSection {
  id: string;
  title: string;
  key: string;
  type: 'banner' | 'store_list' | 'food_list' | 'service_list' | 'promo' | 'custom';
  order: number;
  is_active: boolean;
  items: HomeSectionItem[];
}

export interface HomeSectionItem {
  id: string;
  title: string | null;
  subtitle: string | null;
  image: string | null;
  action_type: string | null;
  action_value: string | null;
  order: number;
}

export interface PostUser {
  id: string;
  name: string;
  profile_picture: string | null;
}

export interface Post {
  id: string;
  caption: string | null;
  images: string[];
  likes_count: number;
  comments_count: number;
  saves_count: number;
  is_liked: boolean;
  is_saved: boolean;
  created_at: string;
  user: PostUser;
}

export interface PostComment {
  id: string;
  body: string;
  created_at: string;
  user: PostUser;
  replies: PostComment[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
