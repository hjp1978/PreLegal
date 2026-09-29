import { beforeAll, describe, expect, it } from "vitest";
import { fillNda, escapeMarkdown, type NdaTemplates } from "./fill";
import { defaultNdaData, type NdaFormData } from "./schema";
import { loadNdaTemplates } from "./templates";

let templates: NdaTemplates;
beforeAll(async () => {
  templates = await loadNdaTemplates();
});

function completeData(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return {
    ...defaultNdaData(),
    purpose: "Exploring a joint venture.",
    effectiveDate: "2026-09-29",
    governingLaw: "Delaware",
    jurisdiction: "courts located in New Castle, DE",
    party1: { name: "Ada Lovelace", title: "CEO", company: "Acme Inc", noticeAddress: "ada@acme.test" },
    party2: { name: "Alan Turing", title: "CTO", company: "Globex", noticeAddress: "1 Main St\nSpringfield" },
    ...overrides,
  };
}

describe("fillNda", () => {
  it("fills every cover page field and leaves no template placeholders", () => {
    const { coverPage } = fillNda(templates, completeData());

    expect(coverPage).toContain("Exploring a joint venture\\.");
    expect(coverPage).toContain("September 29, 2026");
    expect(coverPage).toContain("Governing Law: Delaware");
    expect(coverPage).toContain("Jurisdiction: courts located in New Castle, DE");
    expect(coverPage).toContain("| Print Name | Ada Lovelace | Alan Turing |");
    expect(coverPage).toContain("| Company | Acme Inc | Globex |");
    expect(coverPage).not.toMatch(/\[Fill in|\[Today|\[Evaluating|1 year\(s\)|<label>/);
  });

  it("leaves signature and date lines blank for signing", () => {
    const { coverPage } = fillNda(templates, completeData());
    expect(coverPage).toContain("| Signature |  |  |");
    expect(coverPage).toContain("| Date |  |  |");
  });

  it("joins multi-line notice addresses onto one table line", () => {
    const { coverPage } = fillNda(templates, completeData());
    expect(coverPage).toContain("| Notice Address | ada@acme\\.test | 1 Main St, Springfield |");
  });

  it("checks the chosen term options", () => {
    const years = fillNda(templates, completeData({ mndaTerm: { kind: "years", years: 2 } })).coverPage;
    expect(years).toContain("- [x] Expires 2 years from Effective Date.");
    expect(years).toContain("- [ ] Continues until terminated");

    const oneYear = fillNda(templates, completeData({ confidentialityTerm: { kind: "years", years: 1 } })).coverPage;
    expect(oneYear).toContain("- [x] 1 year from Effective Date, but in the case of trade secrets");

    const open = fillNda(
      templates,
      completeData({ mndaTerm: { kind: "untilTerminated" }, confidentialityTerm: { kind: "perpetual" } }),
    ).coverPage;
    expect(open).toContain("- [ ] Expires \\[\\_\\_\\] year(s) from Effective Date.");
    expect(open).toContain("- [x] Continues until terminated");
    expect(open).toContain("- [x] In perpetuity.");
  });

  it("uses 'None.' when there are no modifications and keeps paragraphs otherwise", () => {
    expect(fillNda(templates, completeData()).coverPage).toContain("### MNDA Modifications\nNone.");
    const withMods = fillNda(templates, completeData({ modifications: "First change\n\nSecond change" })).coverPage;
    expect(withMods).toContain("First change\n\nSecond change");
  });

  it("shows placeholders for empty fields so the preview still reads", () => {
    const { coverPage } = fillNda(templates, defaultNdaData());
    expect(coverPage).toContain("[Effective Date]");
    expect(coverPage).toContain("Governing Law: \\[Governing law\\]");
  });

  it("returns the standard terms unchanged", () => {
    expect(fillNda(templates, completeData()).standardTerms).toBe(templates.standardTerms);
  });

  it("escapes user input so it cannot inject Markdown or HTML", () => {
    const { coverPage } = fillNda(
      templates,
      completeData({ governingLaw: "<script>alert(1)</script> **bold** [x](http://evil)" }),
    );
    expect(coverPage).not.toContain("<script>");
    expect(coverPage).not.toContain("**bold**");
    expect(coverPage).not.toContain("[x](");
  });
});

describe("escapeMarkdown", () => {
  it("escapes Markdown and HTML punctuation", () => {
    expect(escapeMarkdown("a*b_c<d>|e")).toBe("a\\*b\\_c\\<d\\>\\|e");
  });
});
