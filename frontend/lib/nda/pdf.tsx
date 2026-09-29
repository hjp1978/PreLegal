import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { marked, type Token, type Tokens } from "marked";
import type { ReactNode } from "react";
import type { NdaDocument } from "./fill";

/**
 * Renders the filled NDA Markdown as a PDF. Supports the Markdown the Common
 * Paper templates use: headings, paragraphs, (task) lists, tables, bold,
 * italics and links. Inline HTML (e.g. the standard terms' cover page link
 * spans) is dropped and its text kept.
 */
export function NdaPdf({ doc }: { doc: NdaDocument }) {
  return (
    <Document title="Mutual Non-Disclosure Agreement" author="PreLegal">
      <Page size="LETTER" style={styles.page}>
        {renderBlocks(marked.lexer(doc.coverPage))}
      </Page>
      <Page size="LETTER" style={styles.page}>
        {renderBlocks(marked.lexer(doc.standardTerms))}
      </Page>
    </Document>
  );
}

function renderBlocks(tokens: Token[]): ReactNode[] {
  return tokens.map((token, i) => renderBlock(token, i));
}

function renderBlock(token: Token, key: number): ReactNode {
  switch (token.type) {
    case "heading": {
      const t = token as Tokens.Heading;
      return (
        <Text key={key} style={styles[`h${Math.min(t.depth, 3)}` as "h1" | "h2" | "h3"]}>
          {renderInline(t.tokens)}
        </Text>
      );
    }
    case "paragraph":
    case "text": {
      const t = token as Tokens.Paragraph | Tokens.Text;
      return (
        <Text key={key} style={styles.paragraph}>
          {t.tokens ? renderInline(t.tokens) : decodeEntities(t.text)}
        </Text>
      );
    }
    case "list":
      return renderList(token as Tokens.List, key);
    case "table":
      return renderTable(token as Tokens.Table, key);
    default:
      // space, hr, html and anything else carry no printable content here.
      return null;
  }
}

function renderList(list: Tokens.List, key: number): ReactNode {
  const start = typeof list.start === "number" ? list.start : 1;
  return (
    <View key={key} style={styles.list}>
      {list.items.map((item, i) => {
        const content = item.tokens.filter((t) => t.type !== "checkbox");
        const marker = item.task ? (
          <View style={styles.checkbox}>{item.checked && <View style={styles.checkboxMark} />}</View>
        ) : (
          <Text>{list.ordered ? `${start + i}.` : "•"}</Text>
        );
        return (
          // Keep each item (e.g. a numbered clause) together rather than
          // leaving its number stranded at the bottom of a page.
          <View key={i} style={styles.listItem} wrap={false}>
            <View style={styles.listMarker}>{marker}</View>
            <View style={styles.listContent}>{renderBlocks(content)}</View>
          </View>
        );
      })}
    </View>
  );
}

function renderTable(table: Tokens.Table, key: number): ReactNode {
  const row = (cells: Tokens.TableCell[], header: boolean, rowKey: number) => (
    <View key={rowKey} style={styles.tableRow} wrap={false}>
      {cells.map((cell, i) => (
        <Text
          key={i}
          style={[styles.tableCell, i === 0 ? styles.tableLabel : styles.tableValue, header ? styles.bold : {}]}
        >
          {renderInline(cell.tokens)}
        </Text>
      ))}
    </View>
  );
  return (
    <View key={key} style={styles.table} wrap={false}>
      {row(table.header, true, -1)}
      {table.rows.map((cells, i) => row(cells, false, i))}
    </View>
  );
}

function renderInline(tokens: Token[]): ReactNode[] {
  return tokens.map((token, i) => {
    switch (token.type) {
      case "strong":
        return (
          <Text key={i} style={styles.bold}>
            {renderInline((token as Tokens.Strong).tokens)}
          </Text>
        );
      case "em":
        return (
          <Text key={i} style={styles.italic}>
            {renderInline((token as Tokens.Em).tokens)}
          </Text>
        );
      case "link": {
        const t = token as Tokens.Link;
        return (
          <Link key={i} src={t.href} style={styles.link}>
            {renderInline(t.tokens)}
          </Link>
        );
      }
      case "br":
        return "\n";
      case "html":
        return null;
      default: {
        const t = token as Tokens.Text;
        return t.tokens ? renderInline(t.tokens) : decodeEntities(t.text);
      }
    }
  });
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

function decodeEntities(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity]);
}

const styles = StyleSheet.create({
  page: { paddingVertical: 44, paddingHorizontal: 56, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.4 },
  h1: { fontFamily: "Helvetica-Bold", fontSize: 16, marginBottom: 8 },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 4, marginBottom: 4 },
  h3: { fontFamily: "Helvetica-Bold", fontSize: 11, marginTop: 6, marginBottom: 2 },
  paragraph: { marginBottom: 5 },
  bold: { fontFamily: "Helvetica-Bold" },
  italic: { fontFamily: "Helvetica-Oblique" },
  link: { color: "#1d4ed8", textDecoration: "none" },
  list: { marginBottom: 6 },
  listItem: { flexDirection: "row" },
  listMarker: { width: 20, paddingTop: 1 },
  listContent: { flex: 1 },
  checkbox: { width: 9, height: 9, marginTop: 2, padding: 1.5, borderWidth: 0.75, borderColor: "#000" },
  checkboxMark: { flex: 1, backgroundColor: "#000" },
  table: { marginTop: 8, marginBottom: 10, borderTopWidth: 0.75, borderLeftWidth: 0.75, borderColor: "#000" },
  tableRow: { flexDirection: "row", minHeight: 24 },
  tableCell: { padding: 5, borderRightWidth: 0.75, borderBottomWidth: 0.75, borderColor: "#000" },
  tableLabel: { width: "28%", fontFamily: "Helvetica-Bold" },
  tableValue: { width: "36%" },
});
