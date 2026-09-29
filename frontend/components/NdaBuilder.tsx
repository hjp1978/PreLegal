"use client";

import { useEffect, useMemo, useState } from "react";
import { downloadNdaPdf, ndaFileName } from "@/lib/nda/download";
import { fillNda, type NdaTemplates } from "@/lib/nda/fill";
import { defaultNdaData, toIsoDate, validateNda, type NdaErrors } from "@/lib/nda/schema";
import { NdaForm } from "./NdaForm";
import { NdaPreview } from "./NdaPreview";

type Status = "idle" | "generating" | "failed";

export function NdaBuilder({ templates }: { templates: NdaTemplates }) {
  const [data, setData] = useState(defaultNdaData);
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  // Default the effective date to the user's today (not the build date).
  useEffect(() => {
    setData((d) => (d.effectiveDate ? d : { ...d, effectiveDate: toIsoDate() }));
  }, []);

  const errors = useMemo(() => validateNda(data), [data]);
  const doc = useMemo(() => fillNda(templates, data), [templates, data]);
  const errorCount = Object.keys(errors).length;

  // Only show a field's error once the user has left it or tried to download.
  const visibleErrors: NdaErrors = submitted
    ? errors
    : Object.fromEntries(Object.entries(errors).filter(([name]) => touched.has(name)));

  async function handleDownload() {
    setSubmitted(true);
    if (errorCount > 0) {
      document.querySelector<HTMLElement>(`[name="${Object.keys(errors)[0]}"]`)?.focus();
      return;
    }
    setStatus("generating");
    try {
      await downloadNdaPdf(doc, ndaFileName(data));
      setStatus("idle");
    } catch (error) {
      console.error("Failed to generate NDA PDF", error);
      setStatus("failed");
    }
  }

  return (
    <div className="builder">
      <div className="builder__form">
        <NdaForm
          data={data}
          errors={visibleErrors}
          onChange={setData}
          onFieldBlur={(name) => setTouched((t) => (t.has(name) ? t : new Set(t).add(name)))}
        />
        <div className="builder__actions">
          <button type="button" onClick={handleDownload} disabled={status === "generating"}>
            {status === "generating" ? "Generating PDF…" : "Download PDF"}
          </button>
          {submitted && errorCount > 0 && (
            <p className="field__error" role="alert">
              Fix {errorCount === 1 ? "1 field" : `${errorCount} fields`} before downloading.
            </p>
          )}
          {status === "failed" && (
            <p className="field__error" role="alert">
              Sorry, the PDF couldn’t be generated. Please try again.
            </p>
          )}
        </div>
      </div>
      <div className="builder__preview">
        <NdaPreview doc={doc} />
      </div>
    </div>
  );
}
