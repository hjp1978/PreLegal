import { z } from "zod";

const required = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

const years = z
  .number({ error: "Enter a number of years" })
  .int("Use a whole number of years")
  .min(1, "Must be at least 1 year")
  .max(99, "Must be 99 years or fewer");

const partySchema = z.object({
  name: required("Name"),
  title: required("Title"),
  company: required("Company"),
  noticeAddress: required("Notice address"),
});

export const ndaSchema = z.object({
  purpose: required("Purpose"),
  effectiveDate: z.iso.date("Enter a valid date"),
  mndaTerm: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("years"), years }),
    z.object({ kind: z.literal("untilTerminated") }),
  ]),
  confidentialityTerm: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("years"), years }),
    z.object({ kind: z.literal("perpetual") }),
  ]),
  governingLaw: required("Governing law"),
  jurisdiction: required("Jurisdiction"),
  modifications: z.string(),
  party1: partySchema,
  party2: partySchema,
});

export type NdaFormData = z.infer<typeof ndaSchema>;
export type Party = NdaFormData["party1"];

/** Field path (e.g. "party1.name") -> first error message for that field. */
export type NdaErrors = Record<string, string>;

export function validateNda(data: NdaFormData): NdaErrors {
  const result = ndaSchema.safeParse(data);
  if (result.success) return {};
  const errors: NdaErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}

const emptyParty: Party = { name: "", title: "", company: "", noticeAddress: "" };

/**
 * Starting values for the form. The effective date is left empty because the
 * page is pre-rendered at build time; the browser fills in today's date.
 */
export function defaultNdaData(): NdaFormData {
  return {
    purpose:
      "Evaluating whether to enter into a business relationship with the other party.",
    effectiveDate: "",
    mndaTerm: { kind: "years", years: 1 },
    confidentialityTerm: { kind: "years", years: 1 },
    governingLaw: "",
    jurisdiction: "",
    modifications: "",
    party1: { ...emptyParty },
    party2: { ...emptyParty },
  };
}

/** The given date (default: today) as YYYY-MM-DD in local time. */
export function toIsoDate(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
