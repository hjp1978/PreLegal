import type { DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import type { NdaDocument } from "./fill";
import type { NdaFormData } from "./schema";

/**
 * Generates the NDA PDF in the browser and saves it. The PDF library is
 * loaded on demand so it doesn't slow down the first page load.
 */
export async function downloadNdaPdf(doc: NdaDocument, fileName: string): Promise<void> {
  const [{ pdf }, { NdaPdf }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./pdf"),
  ]);
  // NdaPdf renders a <Document>, which is what pdf() expects.
  const element = createElement(NdaPdf, { doc }) as unknown as ReactElement<DocumentProps>;
  const blob = await pdf(element).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // Revoking straight away can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** e.g. "Mutual-NDA-Acme-Inc-Globex.pdf" */
export function ndaFileName(data: NdaFormData): string {
  const slug = (s: string) => s.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const parts = [slug(data.party1.company), slug(data.party2.company)].filter(Boolean);
  return ["Mutual-NDA", ...parts].join("-") + ".pdf";
}
