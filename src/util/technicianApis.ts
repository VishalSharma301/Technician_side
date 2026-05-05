// ─────────────────────────────────────────────
//  technicianApi.js
//  Central API layer — import this in any screen
// ─────────────────────────────────────────────

import { BASE } from "./BASE_URL";

// const BASE_URL = "https://yourapi.com";

/**
 * Shared fetch wrapper.
 * Throws a descriptive Error on non-2xx responses.
 */
async function apiFetch(path, token, options = {}) {
  const url = `${BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `API error ${response.status} on ${path}: ${body}`
    );
  }

  return response.json();
}

// ─── Earnings ────────────────────────────────

/**
 * Fetch the current-week earnings summary, weekly chart,
 * and payout history for the authenticated technician.
 *
 * @param {string} token  Bearer token
 * @returns {Promise<EarningsResponse>}
 */
export async function fetchEarnings(token) {
  return apiFetch("/api/technicians/app/earnings", token);
}

/**
 * Fetch earnings for a specific past month.
 * Only changes the `thisMonth` value in the summary.
 *
 * @param {string} token  Bearer token
 * @param {string} month  "YYYY-MM"  e.g. "2025-03"
 * @returns {Promise<EarningsResponse>}
 */
export async function fetchEarningsByMonth(token, month) {
  return apiFetch(
    `/api/technicians/earnings?month=${encodeURIComponent(month)}`,
    token
  );
}

// ─── Profile ─────────────────────────────────

/**
 * Fetch the full profile-screen payload.
 *
 * @param {string} token  Bearer token
 * @returns {Promise<ProfileResponse>}
 */
export async function fetchProfile(token) {
  return apiFetch("/api/technicians/app/profile-screen", token);
}

// ─── Helpers (shared between screens) ────────

/**
 * Format a raw ₹ number into a compact display string.
 *   18000  → "₹18k"
 *   120000 → "₹1.2L"
 *   500    → "₹500"
 */
export function formatMoney(amount) {
  if (amount == null) return "—";
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000)   return `₹${(amount / 1_000).toFixed(0)}k`;
  return `₹${amount}`;
}

/**
 * Format a raw ₹ number with Indian locale commas.
 *   16040 → "₹16,040"
 */
export function formatMoneyFull(amount) {
  if (amount == null) return "—";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

/*
 * ─── Type hints (JSDoc) ─────────────────────
 *
 * EarningsResponse {
 *   summary: {
 *     totalEarned: number
 *     thisWeek:    number
 *     thisMonth:   number
 *     avgPerJob:   number
 *   }
 *   weeklyChart: Array<{ day: string, date: string, amount: number, jobs: number }>
 *   payoutHistory: Array<{
 *     weekLabel:   string
 *     jobs:        number
 *     totalAmount: number
 *     status:      "pending" | "success"
 *   }>
 * }
 *
 * ProfileResponse {
 *   profile: {
 *     name:           string
 *     phoneNumber:    string
 *     profilePicture: string | null
 *     skills:         string[]
 *     status:         "available" | "on_leave" | "suspended"
 *   }
 *   stats: {
 *     totalJobs:         number
 *     avgRating:         number | null
 *     thisMonthEarnings: number
 *     joinedYear:        number
 *   }
 *   ratings: {
 *     punctuality:  number | null
 *     skill:        number | null
 *     behaviour:    number | null
 *     cleanliness:  number | null
 *     overall:      number | null
 *     totalReviews: number
 *   }
 *   badges: Array<{
 *     id:          string
 *     name:        string
 *     emoji:       string
 *     description: string
 *     earned:      boolean
 *   }>
 * }
 */