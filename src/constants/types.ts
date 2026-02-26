export type Address = {
  label: string;
  address: string;
  phone: string;
};

export type ServiceData = {
  mainType: string;
  subType: string | null;
  isMakingNoise: string | null;
  image: string | undefined | null;
  notes: string | undefined | null;
};

export type CartItemData = {
  name: string;
  mainType: string;
  subType: string | null;
  isMakingNoise: string | null;
  image: string | undefined | null;
  notes: string | undefined | null;
  price: number;
  quantity: number;
};

export interface InventoryPart {
  _id: string;
  productName: string;
  productCode: string;
  description: string;
  price: number;
  gst: number;
  isActive: boolean;
  provider: string;

  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  __v: number;
}

export type WorkshopCompletionTime =
  | "same_day"
  | "1-2_days"
  | "3-5_days"
  | "within_week"
  | "custom";

export interface CreateWorkshopRequest {
  itemDescription: string;
  repairRequired: string;
  estimatedCost: number;
  estimatedCompletionTime: WorkshopCompletionTime;
  expectedReturnDate: string; // YYYY-MM-DD
  beforeRepairPhotos?: string[];
  notes?: string;
}

export interface ServiceProviderService {
  _id: string;
  serviceProvider: string;
  serviceRadius: number;
  certifications: string[];
  completedBookings: number;
  totalBookings: number;
  experienceYears: number;
  rating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;

  selectedOptions: SelectedOption[];
  selectedSubServices: any[]; // change type if structure available
  selectedTiers: any[]; // change type if structure available

  service: Service;
  supportedBrands: SupportedBrand[];
}
export interface SelectedOption {
  _id: string;
  optionId: string;
  name: string;
  customPrice: number;
  isAvailable: boolean;
}
export interface Service {
  _id: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
  estimatedTime: string;

  options: ServiceOption[];
}
export interface ServiceOption {
  _id: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
  estimatedTime: string;
  hasCapacityVariants: boolean;
  capacityVariants: any[]; // define if structure known
  isActive: boolean;
  requirements: any[]; // define if structure known
  providedServices: any[]; // define if structure known
}
export interface SupportedBrand {
  _id: string;
  name: string;
  logo: string;
}
