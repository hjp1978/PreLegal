import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NdaTemplates } from "./fill";

// The templates live at the repository root, shared with the rest of PreLegal;
// the app runs from frontend/.
const TEMPLATES_DIR = path.join(process.cwd(), "..", "templates");

/** Reads the Mutual NDA templates from `templates/`, the single source of the legal text. */
export async function loadNdaTemplates(): Promise<NdaTemplates> {
  const [coverPage, standardTerms] = await Promise.all([
    readFile(path.join(TEMPLATES_DIR, "Mutual-NDA-coverpage.md"), "utf8"),
    readFile(path.join(TEMPLATES_DIR, "Mutual-NDA.md"), "utf8"),
  ]);
  // Normalise Windows line endings so the cover page placeholders match exactly.
  return {
    coverPage: coverPage.replace(/\r\n/g, "\n"),
    standardTerms: standardTerms.replace(/\r\n/g, "\n"),
  };
}
