import { api } from "./client";

export interface InventoryQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export async function getInventory(query: InventoryQuery = {}) {
  const res = await api.get("/api/technicians/inventory", {
    params: query,
  });
  return res.data;
}


interface AddPartsPayload {
  inventoryItemId: string;
  quantity: number;
}

export async function addUsedParts(
  jobId: string,
  parts: AddPartsPayload[]
) {
  const res = await api.post(
    `/api/technicians/jobs/${jobId}/parts`,
    { parts }
  );
  return res.data;
}



export async function removeUsedPart(
  jobId: string,
  partId: string
) {
  await api.delete(
    `/api/technicians/jobs/${jobId}/parts/${partId}`
  );
}
