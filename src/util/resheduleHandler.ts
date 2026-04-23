// rescheduleHandler.ts

import { createPartsPending, createWorkshop } from "../../src/api/services";

export type RescheduleType = "parts_pending" | "workshop_required";

export interface RescheduleData {
  partName?: string;
  repairRequired?: string;
  estimatedCost?: string;
  expectedReturnDate?: string;
  expectedReturnDateLabel?: string;
}

/**
 * 📅 Generate date based on label
 */
export function getRescheduleDate(label: string) {
  const today = new Date();
  const date = new Date(today);

  if (label === "Tomorrow") {
    date.setDate(today.getDate() + 1);
  }

  if (label === "Within Week") {
    date.setDate(today.getDate() + 7);
  }

  return {
    expectedReturnDate: date.toISOString().split("T")[0],
    expectedReturnDateLabel: label,
  };
}

/**
 * ✅ Validation
 */
export function validateReschedule(data: RescheduleData) {
  if (!data.partName || !data.expectedReturnDate) {
    throw new Error("Part name and return date are required");
  }
}

/**
 * 🚀 MAIN HANDLER
 */
export async function handleRescheduleJob(
  jobId: string,
  type: RescheduleType,
  data: RescheduleData
) {
  validateReschedule(data);

  const {
    partName,
    repairRequired,
    estimatedCost,
    expectedReturnDate,
  } = data;

  // 🔧 CASE 1: PARTS PENDING
  if (type === "parts_pending") {
    return await createPartsPending(jobId, {
      requiredParts: [
        {
          partName,
          quantity: 1,
          estimatedCost: Number(estimatedCost),
          supplier: "Technician will procure",
          notes: repairRequired,
        },
      ],
      estimatedAvailability: "within_week",
      expectedReturnDate,
    });
  }

  // 🏭 CASE 2: WORKSHOP
  if (type === "workshop_required") {
    return await createWorkshop(jobId, {
      itemDescription: partName,
      repairRequired: repairRequired || "Repair Required",
      estimatedCost: Number(estimatedCost),
      estimatedCompletionTime: "3-5_days",
      expectedReturnDate,
      notes: "Workshop Needed",
    });
  }

  throw new Error("Invalid reschedule type");
}