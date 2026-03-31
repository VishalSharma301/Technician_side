import { Address } from "./types";

export interface Provider {
  _id: string;
  id: string;
  name: string;
  companyName: string;
  fullAddress: string;
}

export interface Technician {
  _id: string;
  name: string;
  phoneNumber: string;
}
export interface ServiceInfo {
  _id: string;
  name: string;
  icon: string;
}
export interface InspectionTotals {
  originalService: number;
  parts: number;
  additionalServices: number;
  grandTotal: number;
}
export type WorkshopCompletionTime =
  | "same_day"
  | "1-2_days"
  | "3-5_days"
  | "within_week"
  | "custom";

export interface WorkshopDetails {
  itemDescription: string;
  repairRequired: string;
  estimatedCost: number;
  estimatedCompletionTime: WorkshopCompletionTime;
  customCompletionDate: string | null;
  expectedReturnDate: string;
  droppedOffAt: string;
  beforeRepairPhotos: string[];
  afterRepairPhotos: string[];
  notes?: string;
}
export interface PartsPending {
  itemDescription: string;
  repairRequired: string;
  estimatedCost: number;
  estimatedCompletionTime: WorkshopCompletionTime;
  customCompletionDate: string | null;
  expectedReturnDate: string;
  droppedOffAt: string;
  beforeRepairPhotos: string[];
  afterRepairPhotos: string[];
  notes?: string;
}
export type InspectionCompletionType =
  | "standard"
  | "parts_pending"
  | "workshop_required";

export interface Inspection {
  status: "in_progress" | "completed";
  startedAt: string;
  findings: string;

  completionType: InspectionCompletionType;

  verificationRequested: boolean;
  verificationRequestedAt?: string;
  userVerified: boolean;
  userVerificationRejected: boolean;

  usedParts: any[]; // you can type this later
  additionalServices: any[]; // same here

  totals: InspectionTotals;

  workshopDetails?: WorkshopDetails;
  partsPending?: PartsPending;
}
export interface StatusHistoryItem {
  _id: string;
  status: string;
  notes: string;
  timestamp: string;
  changedBy: {
    userType: "technician" | "system" | "user";
    userId: string;
  };
}
export interface JobSummary {
  title: string;
  description: string;
  returnDate: string;
  status: "pending_approval" | "approved" | "rejected";
}
export interface JobType {
  _id: string;

  address: Address;

  service: ServiceInfo;
  selectedOption: {
    name: string;
  };
  selectedSubServices: any[];

  provider: Provider;
  technician: Technician;

  quantity: number;

  basePrice: number;
  optionPrice: number;
  subServicesPrice: number;
  finalPrice: number;

  paymentMethod: "cash" | "online";
  paymentStatus: "paid" | "unpaid";

  completionPin?: string;
  pinVerified: boolean;

  inspection: Inspection;
  summary: JobSummary;

  status: string;
  notes: string;

  bookedAt: string;
  requestSubmittedAt: string;
  technicianAssignedAt: string;
  serviceStartedAt?: string;
  serviceCompletedAt?: string;

  onWayAt?: string;

  maxReschedules: number;
  rescheduleCount: number;
  schedulingHistory: any[];

  statusHistory: StatusHistoryItem[];

  user: User;
  zipcode: string;

  createdAt: string;
  updatedAt: string;

  __v: number;
}

export interface InventoryItem {
  _id: string;
  productName: string;
  productCode: string;
  description: string;
  price: number;
  gst: number;
  isActive: boolean;
  provider: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
export interface InvoicePartItem {
  _id: string;

  productName: string;
  productCode: string;

  quantity: number;
  unitPrice: number;

  gst: number;
  gstAmount: number;

  totalWithoutGst: number;
  totalWithGst: number;

  isCustom: boolean;

  addedAt: string;

  inventoryItem?: InventoryItem;
}
export interface InvoiceParts {
  items: InvoicePartItem[];
  total: number;
}
export interface InvoiceOriginalService {
  name: string;
  amount: number;
}
export interface InvoiceTotals {
  originalService: number;
  parts: number;
  additionalServices: number;
  grandTotal: number;
}
export interface JobInvoiceDetails {
  originalService: InvoiceOriginalService;
  parts: InvoiceParts;
  additionalServices: InvoiceAdditionalServices | null;
  totals: InvoiceTotals;
}

export interface Service {
  _id: string;
  name: string;
  icon: string;
}
export interface InvoiceAdditionalServiceItem {
  _id: string;

  service: Service;
  serviceName: string;

  quantity: number;
  unitPrice: number;
  totalPrice: number;

  isCustom: boolean;

  selectedBrand: string | null;
  selectedOption: string | null;

  addedAt: string; // ISO date
}
export interface InvoiceAdditionalServices {
  items: InvoiceAdditionalServiceItem[];
  total: number;
}

export interface JobDetails {
  jobInfo: JobInfo;
  completionType: "parts_pending" | "completed" | "workshop_required";
  invoice: JobInvoiceDetails;
  technicianFindings: string;
  partsPending?: PartsPending;
  workshopDetails?: WorkshopDetailss;
}

export interface JobInfo {
  jobId: string;
  bookingDate: string; // ISO date string
  verificationRequestedAt?: string; // ISO date string

  address: Address;
  provider: Provider;
  technician: Technician;
}
export interface PartsPending {
  availability: PartsAvailability;
  requiredParts: RequiredPart[];
  timeline: string;
}
export interface PartsAvailability {
  estimate: "within_week" | "within_days" | "custom";
  expectedReturnDate: string; // ISO date string
  customDate: string | null;
}
export interface RequiredPart {
  partName: string;
  quantity: number;
  estimatedCost: number;
  supplier: string;
  notes?: string;
  total: number;
}
export interface WorkshopDetailss {
  itemDescription: string;
  repairRequired: string;
  estimatedCost: number;

  completionTime: WorkshopCompletionTimes;

  photos: WorkshopPhotos;

  timeline: string;
  notes?: string;
}
export interface WorkshopPhotos {
  before: string[]; // image URLs
  after: string[]; // image URLs
}
export interface WorkshopCompletionTimes {
  estimate: "1-2_days" | "3-5_days" | "within_week" | "custom";
  expectedReturnDate: string; // ISO date string
  customDate: string | null;
}

export interface User {
  _id:string;
  name: string;
  phoneNumber:string;
  email: string;
}
