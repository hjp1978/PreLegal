import { describe, expect, it } from "vitest";
import { defaultNdaData, toIsoDate, validateNda, type NdaFormData } from "./schema";

const party = { name: "Ada", title: "CEO", company: "Acme", noticeAddress: "ada@acme.test" };
const valid: NdaFormData = {
  ...defaultNdaData(),
  effectiveDate: "2026-09-29",
  governingLaw: "Delaware",
  jurisdiction: "courts located in New Castle, DE",
  party1: party,
  party2: party,
};

describe("validateNda", () => {
  it("accepts complete data", () => {
    expect(validateNda(valid)).toEqual({});
  });

  it("reports required fields by path", () => {
    const errors = validateNda(defaultNdaData());
    expect(errors).toMatchObject({
      effectiveDate: "Enter a valid date",
      governingLaw: "Governing law is required",
      jurisdiction: "Jurisdiction is required",
      "party1.name": "Name is required",
      "party2.noticeAddress": "Notice address is required",
    });
    expect(errors.purpose).toBeUndefined();
    expect(errors.modifications).toBeUndefined();
  });

  it("treats whitespace-only values as missing", () => {
    expect(validateNda({ ...valid, governingLaw: "   " }).governingLaw).toBe("Governing law is required");
  });

  it.each([
    [0, "Must be at least 1 year"],
    [1.5, "Use a whole number of years"],
    [100, "Must be 99 years or fewer"],
    [Number.NaN, "Enter a number of years"],
  ])("rejects %s years", (years, message) => {
    expect(validateNda({ ...valid, mndaTerm: { kind: "years", years } })["mndaTerm.years"]).toBe(message);
  });

  it("rejects impossible dates", () => {
    expect(validateNda({ ...valid, effectiveDate: "2026-02-30" }).effectiveDate).toBe("Enter a valid date");
  });

  it("does not require years for open-ended terms", () => {
    const data: NdaFormData = {
      ...valid,
      mndaTerm: { kind: "untilTerminated" },
      confidentialityTerm: { kind: "perpetual" },
    };
    expect(validateNda(data)).toEqual({});
  });
});

describe("toIsoDate", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
