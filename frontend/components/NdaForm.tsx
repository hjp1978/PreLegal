"use client";

import type { ChangeEvent, ReactNode } from "react";
import type { NdaErrors, NdaFormData, Party } from "@/lib/nda/schema";

interface NdaFormProps {
  data: NdaFormData;
  errors: NdaErrors;
  onChange: (data: NdaFormData) => void;
  /** Called with a field's name (e.g. "party1.name") when it loses focus. */
  onFieldBlur: (name: string) => void;
}

export function NdaForm({ data, errors, onChange, onFieldBlur }: NdaFormProps) {
  const set = <K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) =>
    onChange({ ...data, [key]: value });
  const setParty = (key: "party1" | "party2", field: keyof Party, value: string) =>
    onChange({ ...data, [key]: { ...data[key], [field]: value } });

  return (
    <form
      className="nda-form"
      noValidate
      onSubmit={(e) => e.preventDefault()}
      onBlur={(e) => {
        const name = (e.target as Element).getAttribute("name");
        if (name) onFieldBlur(name);
      }}
    >
      <fieldset>
        <legend>Agreement</legend>

        <Field name="purpose" label="Purpose" hint="How Confidential Information may be used" error={errors.purpose}>
          <textarea
            id="purpose"
            name="purpose"
            rows={3}
            value={data.purpose}
            onChange={(e) => set("purpose", e.target.value)}
          />
        </Field>

        <Field name="effectiveDate" label="Effective date" error={errors.effectiveDate}>
          <input
            id="effectiveDate"
            name="effectiveDate"
            type="date"
            value={data.effectiveDate}
            onChange={(e) => set("effectiveDate", e.target.value)}
          />
        </Field>

        <TermField
          name="mndaTerm"
          label="MNDA term"
          hint="The length of this MNDA"
          term={data.mndaTerm}
          yearsLabel={(input) => <>Expires {input} year(s) from the effective date</>}
          otherKind="untilTerminated"
          otherLabel="Continues until terminated"
          error={errors["mndaTerm.years"]}
          onChange={(term) => set("mndaTerm", term)}
        />

        <TermField
          name="confidentialityTerm"
          label="Term of confidentiality"
          hint="How long Confidential Information is protected (trade secrets stay protected while they remain trade secrets)"
          term={data.confidentialityTerm}
          yearsLabel={(input) => <>{input} year(s) from the effective date</>}
          otherKind="perpetual"
          otherLabel="In perpetuity"
          error={errors["confidentialityTerm.years"]}
          onChange={(term) => set("confidentialityTerm", term)}
        />

        <Field name="governingLaw" label="Governing law" hint="US state whose laws govern the MNDA" error={errors.governingLaw}>
          <input
            id="governingLaw"
            name="governingLaw"
            placeholder="Delaware"
            value={data.governingLaw}
            onChange={(e) => set("governingLaw", e.target.value)}
          />
        </Field>

        <Field name="jurisdiction" label="Jurisdiction" hint="Courts where disputes are heard" error={errors.jurisdiction}>
          <input
            id="jurisdiction"
            name="jurisdiction"
            placeholder="courts located in New Castle, DE"
            value={data.jurisdiction}
            onChange={(e) => set("jurisdiction", e.target.value)}
          />
        </Field>

        <Field name="modifications" label="MNDA modifications" hint="Optional changes to the standard terms" error={errors.modifications}>
          <textarea
            id="modifications"
            name="modifications"
            rows={3}
            placeholder="None"
            value={data.modifications}
            onChange={(e) => set("modifications", e.target.value)}
          />
        </Field>
      </fieldset>

      {(["party1", "party2"] as const).map((key, i) => (
        <fieldset key={key}>
          <legend>Party {i + 1}</legend>
          <PartyInput name={key} label="Print name" field="name" data={data} errors={errors} onChange={setParty} />
          <PartyInput name={key} label="Title" field="title" data={data} errors={errors} onChange={setParty} />
          <PartyInput name={key} label="Company" field="company" data={data} errors={errors} onChange={setParty} />
          <PartyInput
            name={key}
            label="Notice address"
            hint="Use either email or postal address"
            field="noticeAddress"
            data={data}
            errors={errors}
            onChange={setParty}
            multiline
          />
        </fieldset>
      ))}
    </form>
  );
}

function Field(props: { name: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  const { name, label, hint, error, children } = props;
  return (
    <div className={error ? "field field--invalid" : "field"}>
      <label htmlFor={name}>{label}</label>
      {hint && <p className="field__hint">{hint}</p>}
      {children}
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function PartyInput(props: {
  name: "party1" | "party2";
  field: keyof Party;
  label: string;
  hint?: string;
  multiline?: boolean;
  data: NdaFormData;
  errors: NdaErrors;
  onChange: (key: "party1" | "party2", field: keyof Party, value: string) => void;
}) {
  const { name, field, label, hint, multiline, data, errors, onChange } = props;
  const id = `${name}.${field}`;
  const inputProps = {
    id,
    name: id,
    value: data[name][field],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(name, field, e.target.value),
  };
  return (
    <Field name={id} label={label} hint={hint} error={errors[id]}>
      {multiline ? <textarea rows={2} {...inputProps} /> : <input {...inputProps} />}
    </Field>
  );
}

type YearsTerm = { kind: "years"; years: number };

function TermField<Other extends string>(props: {
  name: string;
  label: string;
  hint: string;
  term: YearsTerm | { kind: Other };
  yearsLabel: (input: ReactNode) => ReactNode;
  otherKind: Other;
  otherLabel: string;
  error?: string;
  onChange: (term: YearsTerm | { kind: Other }) => void;
}) {
  const { name, label, hint, term, yearsLabel, otherKind, otherLabel, error, onChange } = props;
  const years = "years" in term ? term.years : 1;
  const yearsId = `${name}.years`;

  const yearsInput = (
    <input
      id={yearsId}
      name={yearsId}
      className="years-input"
      type="number"
      min={1}
      max={99}
      aria-label={`${label} in years`}
      disabled={term.kind !== "years"}
      value={Number.isFinite(years) ? years : ""}
      onChange={(e) =>
        onChange({ kind: "years", years: e.target.value === "" ? Number.NaN : Number(e.target.value) })
      }
    />
  );

  return (
    <fieldset className={error ? "field field--invalid term" : "field term"}>
      <legend>{label}</legend>
      <p className="field__hint">{hint}</p>
      <label className="choice">
        <input
          type="radio"
          name={name}
          checked={term.kind === "years"}
          onChange={() => onChange({ kind: "years", years: Number.isFinite(years) ? years : 1 })}
        />
        <span>{yearsLabel(yearsInput)}</span>
      </label>
      <label className="choice">
        <input
          type="radio"
          name={name}
          checked={term.kind === otherKind}
          onChange={() => onChange({ kind: otherKind })}
        />
        <span>{otherLabel}</span>
      </label>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
