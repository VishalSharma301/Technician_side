import { Job, JobStatus, PaymentStatus } from "../constants/jobTypes";

export const dummyJob: Job = {
  _id: "696b8d6bb3a63602119fef9f",

  service: {
    _id: "service_ac_installation",
    name: "AC Installation",
    category: {
      _id: "category_ac",
      name: "Air Conditioner",
      icon: "ac-icon.png",
    },
    icon: "ac-service.png",
    basePrice: 1500,
    description: "Split AC installation service",
    estimatedTime: "2 hours",
  },

  user: {
    _id: "user_001",
    name: "Rahul Sharma",
    phoneNumber: "9463786657",
    email: "rahul.sharma@example.com",
    address: {
      street: "Sector 7",
      city: "New Delhi",
      state: "Delhi",
      zipcode: "110059",
    },
    profilePicture: "https://example.com/profile.jpg",
  },

  provider: {
    _id: "provider_001",
    name: "Amit Kumar",
    companyName: "CoolAir Services",
    phoneNumber: "9876543210",
  },

  selectedOption: {
    optionId: "option_premium",
    name: "Premium Installation",
    price: 500,
  },

  selectedSubServices: [
    {
      subServiceId: "sub_wall_drilling",
      name: "Wall Drilling",
      price: 300,
    },
    {
      subServiceId: "sub_extra_pipe",
      name: "Extra Copper Pipe",
      price: 200,
    },
  ],

  selectedBrand: {
    brandId: {
      _id: "brand_lg",
      name: "LG",
      logo: "lg-logo.png",
    },
    name: "LG",
  },

  quantity: 1,

  status: JobStatus.TECHNICIAN_ASSIGNED,

  scheduledDate: "2026-01-22",
  scheduledTimeSlot: "10:00 AM - 12:00 PM",

  zipcode: "110059",

  address: {
    street: "Sector 7",
    city: "New Delhi",
    state: "Delhi",
    zipcode: "110059",
    coordinates: {
      lat: 28.6139,
      lon: 77.2090,
    },
  },

  finalPrice: 2500,

  notes: "Please call before arriving",
  specialInstructions: "Parking available inside the society",

  completionPin: "4821",
  pinVerified: false,

  technicianAssignedAt: "2026-01-21T09:30:00.000Z",

  paymentStatus: PaymentStatus.PENDING,

  createdAt: "2026-01-21T08:45:00.000Z",
  updatedAt: "2026-01-21T09:00:00.000Z",
};
