export const STATUS_LABELS = {
  ON_RADAR: "On Radar",
  APPLIED: "Applied",
  PHONE_SCREEN: "Phone Screen",
  ONSITE: "Onsite",
  OFFER: "Offer",
  REJECTED: "Rejected",
} as const;

export type JobStatus = keyof typeof STATUS_LABELS;

export const ORDERED_STATUSES: JobStatus[] = [
  "ON_RADAR",
  "APPLIED",
  "PHONE_SCREEN",
  "ONSITE",
  "OFFER",
  "REJECTED",
];

export function isJobStatus(value: any): value is JobStatus {
  return typeof value === "string" && value in STATUS_LABELS;
}

