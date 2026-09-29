import { describe, expect, it } from "vitest";
import { ndaFileName } from "./download";
import { defaultNdaData } from "./schema";

describe("ndaFileName", () => {
  it("names the file after both companies", () => {
    const data = defaultNdaData();
    data.party1.company = "Acme, Inc.";
    data.party2.company = " Globex ";
    expect(ndaFileName(data)).toBe("Mutual-NDA-Acme-Inc-Globex.pdf");
  });

  it("falls back to a generic name", () => {
    expect(ndaFileName(defaultNdaData())).toBe("Mutual-NDA.pdf");
  });
});
