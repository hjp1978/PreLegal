"use client";

import { marked } from "marked";
import { useMemo } from "react";
import type { NdaDocument } from "@/lib/nda/fill";

/**
 * Shows the filled NDA as it will appear in the PDF. The HTML comes from the
 * trusted templates plus user input that fillNda has already escaped.
 */
export function NdaPreview({ doc }: { doc: NdaDocument }) {
  const coverPage = useMemo(() => marked.parse(doc.coverPage, { async: false }), [doc.coverPage]);
  const standardTerms = useMemo(() => marked.parse(doc.standardTerms, { async: false }), [doc.standardTerms]);

  return (
    <article className="nda-preview" aria-label="Document preview">
      <section className="nda-preview__page" dangerouslySetInnerHTML={{ __html: coverPage }} />
      <section className="nda-preview__page" dangerouslySetInnerHTML={{ __html: standardTerms }} />
    </article>
  );
}
