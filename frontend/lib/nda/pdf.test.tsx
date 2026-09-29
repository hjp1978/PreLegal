import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { fillNda } from "./fill";
import { NdaPdf } from "./pdf";
import { defaultNdaData } from "./schema";
import { loadNdaTemplates } from "./templates";

describe("NdaPdf", () => {
  it("renders the filled NDA to a PDF", async () => {
    const data = { ...defaultNdaData(), effectiveDate: "2026-09-29", governingLaw: "Delaware & Co <x>" };
    const doc = fillNda(await loadNdaTemplates(), data);

    const buffer = await renderToBuffer(<NdaPdf doc={doc} />);
    const pdf = buffer.toString("latin1");

    expect(pdf.startsWith("%PDF-")).toBe(true);
    // Cover page plus at least one page of standard terms.
    expect(pdf.match(/\/Type \/Page\b/g)?.length).toBeGreaterThanOrEqual(2);
  }, 30_000);
});
