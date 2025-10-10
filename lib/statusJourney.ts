import { JobStatus, STATUS_LABELS } from "./status";

/**
 * Journey Step Metadata
 * Maps status codes to UX journey descriptions
 */

export type JourneyStep = {
  status: JobStatus;
  label: string;
  description: string;
  allowsMultipleInterviewers: boolean;
  journeyPhases: string[];
};

export const JOURNEY_MAPPING: Record<JobStatus, JourneyStep> = {
  ON_RADAR: {
    status: "ON_RADAR",
    label: STATUS_LABELS.ON_RADAR,
    description: "Prepping to apply",
    allowsMultipleInterviewers: false,
    journeyPhases: ["Research company", "Prepare materials", "Review JD"],
  },
  APPLIED: {
    status: "APPLIED",
    label: STATUS_LABELS.APPLIED,
    description: "ATS wait / recruiter reach-out",
    allowsMultipleInterviewers: false,
    journeyPhases: ["Application submitted", "Waiting for response"],
  },
  PHONE_SCREEN: {
    status: "PHONE_SCREEN",
    label: STATUS_LABELS.PHONE_SCREEN,
    description: "Recruiter scheduled → prep → call → debrief",
    allowsMultipleInterviewers: true,
    journeyPhases: [
      "Recruiter scheduled",
      "Prep for phone screen",
      "Phone call",
      "Debrief and follow-up",
    ],
  },
  ONSITE: {
    status: "ONSITE",
    label: STATUS_LABELS.ONSITE,
    description: "Prep for interviews → N interviews",
    allowsMultipleInterviewers: true,
    journeyPhases: [
      "Prep for next interview",
      "Interview 1",
      "Interview 2",
      "Interview N...",
      "Final debrief",
    ],
  },
  OFFER: {
    status: "OFFER",
    label: STATUS_LABELS.OFFER,
    description: "Accepted / Negotiation prep",
    allowsMultipleInterviewers: false,
    journeyPhases: [
      "Offer received",
      "Negotiation preparation",
      "Decision making",
    ],
  },
  REJECTED: {
    status: "REJECTED",
    label: STATUS_LABELS.REJECTED,
    description: "Post-mortem, Lessons learned",
    allowsMultipleInterviewers: false,
    journeyPhases: ["Rejection received", "Post-mortem analysis", "Lessons learned"],
  },
};

/**
 * Get journey step for a status
 */
export function getJourneyStep(status: JobStatus): JourneyStep {
  return JOURNEY_MAPPING[status];
}

/**
 * Check if status allows multiple interviewers
 */
export function allowsMultipleInterviewers(status: JobStatus): boolean {
  return JOURNEY_MAPPING[status].allowsMultipleInterviewers;
}

