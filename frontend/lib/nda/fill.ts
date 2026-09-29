import type { NdaFormData, Party } from "./schema";

export interface NdaTemplates {
  coverPage: string;
  standardTerms: string;
}

export interface NdaDocument {
  coverPage: string;
  standardTerms: string;
}

/**
 * Fills the Common Paper Mutual NDA cover page with the user's details.
 *
 * The standard terms are returned unchanged: they refer to cover page fields
 * ("Purpose", "Governing Law", ...) as defined terms, so the values only need
 * to appear on the cover page. Signature and date lines are left blank for
 * the parties to sign.
 *
 * Works on partially completed data so it can drive a live preview; empty
 * fields are shown as bracketed placeholders.
 */
export function fillNda(templates: NdaTemplates, data: NdaFormData): NdaDocument {
  return {
    coverPage: fillCoverPage(templates.coverPage, data),
    standardTerms: templates.standardTerms,
  };
}

function fillCoverPage(template: string, data: NdaFormData): string {
  let md = stripLabels(template);

  md = replaceOnce(
    md,
    "[Evaluating whether to enter into a business relationship with the other party.]",
    inline(data.purpose, "Purpose"),
  );
  md = replaceOnce(md, "[Today’s date]", formatDate(data.effectiveDate));

  md = replaceOnce(
    md,
    "- [x]     Expires [1 year(s)] from Effective Date.\n" +
      "- [ ]     Continues until terminated in accordance with the terms of the MNDA.",
    [
      checkbox(data.mndaTerm.kind === "years") +
        `Expires ${yearsText(data.mndaTerm)} from Effective Date.`,
      checkbox(data.mndaTerm.kind === "untilTerminated") +
        "Continues until terminated in accordance with the terms of the MNDA.",
    ].join("\n"),
  );

  md = replaceOnce(
    md,
    "- [x]     [1 year(s)] from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.\n" +
      "- [ ]     In perpetuity.",
    [
      checkbox(data.confidentialityTerm.kind === "years") +
        `${capitalize(yearsText(data.confidentialityTerm))} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`,
      checkbox(data.confidentialityTerm.kind === "perpetual") + "In perpetuity.",
    ].join("\n"),
  );

  md = replaceOnce(md, "[Fill in state]", inline(data.governingLaw, "Governing law"));
  md = replaceOnce(
    md,
    "[Fill in city or county and state, i.e. “courts located in New Castle, DE”]",
    inline(data.jurisdiction, "Jurisdiction"),
  );
  md = replaceOnce(md, "List any modifications to the MNDA", modificationsText(data.modifications));

  return fillSignatureTable(md, data.party1, data.party2);
}

/** Removes the template's `<label>` form hints, which are not part of the agreement. */
function stripLabels(md: string): string {
  return md
    .replace(/^[ \t]*<label>.*?<\/label>[ \t]*\n/gm, "")
    .replace(/[ \t]*<label>.*?<\/label>/g, "");
}

const TABLE_ROWS: Array<[label: string, value: (party: Party) => string]> = [
  ["Signature", () => ""],
  ["Print Name", (p) => tableCell(p.name)],
  ["Title", (p) => tableCell(p.title)],
  ["Company", (p) => tableCell(p.company)],
  ["Notice Address", (p) => tableCell(p.noticeAddress)],
  ["Date", () => ""],
];

function fillSignatureTable(md: string, party1: Party, party2: Party): string {
  for (const [label, value] of TABLE_ROWS) {
    const row = new RegExp(`^\\| ${label} \\|.*$`, "m");
    if (!row.test(md)) throw new Error(`Cover page template is missing the "${label}" row`);
    md = md.replace(row, () => `| ${label} | ${value(party1)} | ${value(party2)} |`);
  }
  return md;
}

function replaceOnce(md: string, search: string, replacement: string): string {
  const index = md.indexOf(search);
  if (index === -1) throw new Error(`Cover page template is missing: ${search}`);
  return md.slice(0, index) + replacement + md.slice(index + search.length);
}

const checkbox = (checked: boolean) => (checked ? "- [x] " : "- [ ] ");

type Term = NdaFormData["mndaTerm"] | NdaFormData["confidentialityTerm"];

function yearsText(term: Term): string {
  if (term.kind !== "years") return "\\[\\_\\_\\] year(s)";
  if (!Number.isFinite(term.years)) return "\\[number of\\] years";
  return term.years === 1 ? "1 year" : `${term.years} years`;
}

function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) || Number.isNaN(date.getTime())) {
    return "[Effective Date]";
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function modificationsText(value: string): string {
  const paragraphs = value
    .split(/\n\s*\n/)
    .map((p) => escapeMarkdown(p.replace(/\s+/g, " ").trim()))
    .filter(Boolean);
  return paragraphs.length ? paragraphs.join("\n\n") : "None.";
}

/** A single-line field value, or a bracketed placeholder while it is empty. */
function inline(value: string, placeholder: string): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text ? escapeMarkdown(text) : `\\[${placeholder}\\]`;
}

/** Table cells must stay on one line, so multi-line values are joined with commas. */
function tableCell(value: string): string {
  return escapeMarkdown(
    value
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join(", "),
  );
}

/** Backslash-escapes characters so user input is always rendered as literal text. */
export function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!|<>~&]/g, "\\$&");
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
