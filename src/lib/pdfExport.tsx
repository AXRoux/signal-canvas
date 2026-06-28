import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import type { BriefData } from "../store/types";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 24,
    borderBottom: "1pt solid #ccc",
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: "#666",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    color: "#333",
  },
  item: {
    marginBottom: 4,
    paddingLeft: 8,
  },
  disclaimer: {
    marginTop: 24,
    padding: 12,
    backgroundColor: "#fff8e6",
    border: "1pt solid #f0d080",
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#999",
    borderTop: "1pt solid #eee",
    paddingTop: 8,
  },
});

function BriefDocument({ data }: { data: BriefData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.meta}>Case ID: {data.caseId}</Text>
          <Text style={styles.meta}>Generated: {data.generatedAt}</Text>
        </View>

        {data.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <Text key={item} style={styles.item}>
                • {item}
              </Text>
            ))}
          </View>
        ))}

        <View style={styles.disclaimer}>
          <Text>{data.reviewerNotes}</Text>
        </View>

        <View style={styles.footer}>
          <Text>
            Signal Canvas · Stratir Institutional Review Console · Human review
            required before action
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function exportBriefPdf(data: BriefData): Promise<boolean> {
  const blob = await pdf(<BriefDocument data={data} />).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  const filePath = await save({
    defaultPath: `signal-canvas-brief-${data.caseId}.pdf`,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });

  if (!filePath) return false;

  await writeFile(filePath, uint8);
  return true;
}

export { BriefDocument };
