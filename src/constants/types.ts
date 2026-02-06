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
  name : string;
  mainType: string;
  subType: string | null;
  isMakingNoise: string | null;
  image: string | undefined | null;
  notes: string | undefined | null;
  price : number,
  quantity : number
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
