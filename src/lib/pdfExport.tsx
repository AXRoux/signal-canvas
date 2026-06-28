import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { isWeb } from "./platform";
import type { BriefData } from "../store/types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 52,
    paddingBottom: 56,
    paddingHorizontal: 52,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#171717",
    lineHeight: 1.55,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  brand: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: "#737373",
    textTransform: "uppercase",
  },
  reference: {
    fontSize: 9,
    color: "#525252",
    textAlign: "right",
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#0a0a0a",
  },
  summaryBox: {
    marginTop: 18,
    marginBottom: 24,
    padding: 14,
    backgroundColor: "#fafafa",
    borderLeft: "3pt solid #ff6b2c",
  },
  summaryLabel: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#737373",
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 10.5,
    color: "#262626",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#0a0a0a",
    paddingBottom: 4,
    borderBottom: "0.5pt solid #e5e5e5",
  },
  item: {
    marginBottom: 6,
    paddingLeft: 10,
    color: "#404040",
  },
  keywords: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
    marginBottom: 18,
  },
  keyword: {
    fontSize: 8.5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: "#f5f5f5",
    color: "#525252",
    borderRadius: 10,
  },
  disclaimer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#fffbeb",
    border: "0.5pt solid #fde68a",
    fontSize: 8.5,
    color: "#57534e",
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 52,
    right: 52,
    fontSize: 8,
    color: "#a3a3a3",
    borderTop: "0.5pt solid #e5e5e5",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function BriefDocument({ data }: { data: BriefData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Signal Canvas · Stratir.com Applied AI Studio</Text>
          <Text style={styles.reference}>{data.reference}</Text>
        </View>

        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.reference}>Prepared {data.generatedAtDisplay}</Text>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Executive summary</Text>
          <Text style={styles.summaryText}>{data.executiveSummary}</Text>
        </View>

        {data.keywords.length > 0 && (
          <View style={styles.keywords}>
            {data.keywords.map((keyword) => (
              <Text key={keyword} style={styles.keyword}>
                {keyword}
              </Text>
            ))}
          </View>
        )}

        {data.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, index) => (
              <Text key={`${section.title}-${index}`} style={styles.item}>
                • {item}
              </Text>
            ))}
          </View>
        ))}

        <View style={styles.disclaimer}>
          <Text>{data.reviewerNotes}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>Confidential · Human review required</Text>
          <Text>signal-canvas · open source</Text>
        </View>
      </Page>
    </Document>
  );
}

async function savePdfBytes(data: BriefData, uint8: Uint8Array): Promise<boolean> {
  const defaultPath = `Signal-Canvas-Brief-${data.caseId}.pdf`;

  if (isWeb) {
    const blob = new Blob([uint8], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = defaultPath;
    anchor.click();
    URL.revokeObjectURL(url);
    return true;
  }

  const filePath = await save({
    defaultPath,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });

  if (!filePath) return false;

  await invoke("write_export_file", {
    path: filePath,
    contents: Array.from(uint8),
  });
  return true;
}

export async function exportBriefPdf(data: BriefData): Promise<boolean> {
  const blob = await pdf(<BriefDocument data={data} />).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  return savePdfBytes(data, uint8);
}

export { BriefDocument };
