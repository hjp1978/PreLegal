import { NdaBuilder } from "@/components/NdaBuilder";
import { loadNdaTemplates } from "@/lib/nda/templates";

export default async function Home() {
  const templates = await loadNdaTemplates();

  return (
    <main className="page">
      <header className="page__header">
        <h1>Mutual Non-Disclosure Agreement</h1>
        <p>
          Fill in the details below, check the preview, then download the agreement as a PDF ready
          to sign.
        </p>
      </header>
      <NdaBuilder templates={templates} />
      <footer className="page__footer">
        Based on the{" "}
        <a href="https://commonpaper.com/standards/mutual-nda/1.0">Common Paper Mutual NDA</a>{" "}
        (Version 1.0), used under{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. PreLegal is not
        affiliated with Common Paper, and this is not legal advice.
      </footer>
    </main>
  );
}
