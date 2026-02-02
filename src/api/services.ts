import { api } from "./client";

export async function getProviderServices(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const res = await api.get("/api/technicians/services", {
    params,
  });
  return res.data;
}


export async function addAdditionalService(
  jobId: string,
  payload: {
    providerOfferedServiceId: string;
    selectedOptionId?: string;
    selectedBrandId?: string;
    quantity: number;
    notes?: string;
  }
) {
  const res = await api.post(
    `/api/technicians/jobs/${jobId}/additional-services`,
    payload
  );
  return res.data;
}


export async function removeAdditionalService(
  jobId: string,
  serviceId: string
) {
  await api.delete(
    `/api/technicians/jobs/${jobId}/additional-services/${serviceId}`
  );
}


export async function addCustomPart(
  jobId: string,
  payload: {
    productName: string;
    productCode?: string;
    quantity: number;
    unitPrice: number;
    gst: number;
    description?: string;
  }
) {
  const res = await api.post(
    `/api/technicians/jobs/${jobId}/parts/custom`,
    payload
  );
  return res.data;
}



export async function addCustomService(
  jobId: string,
  payload: {
    serviceName: string;
    quantity: number;
    unitPrice: number;
    description?: string;
    notes?: string;
  }
) {
  const res = await api.post(
    `/api/technicians/jobs/${jobId}/additional-services/custom`,
    payload
  );
  return res.data;
}


export async function requestVerification(
  jobId: string,
 
) {
  const res = await api.post(
    `/api/technicians/jobs/${jobId}/request-verification`
  );
  return res.data;
}


export async function jobComplete(
  jobId: string,
 otp : string,
 completionNotes : 'Service Completed'
) {
  const res = await api.post(
    `/api/technicians/jobs/${jobId}/complete`,{
      otp,
      completionNotes
    }
  );
  return res.data;
}
