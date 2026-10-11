import type { AnalysisRecord } from "@/types/analysis";
import { narrativeSections, reportFields } from "./report";
export async function exportReportToPDF(report: AnalysisRecord) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  // A neutral, independent print surface avoids theme colours and unsupported CSS colour functions.
  const surface = document.createElement("article");
  surface.style.cssText =
    "position:absolute;left:-10000px;top:0;width:760px;padding:40px;background:#ffffff;color:#15231f;font:16px/1.65 Arial,sans-serif;";
  const append = (tag: string, text: string, style = "") => {
    const node = document.createElement(tag);
    node.textContent = text;
    node.style.cssText = style;
    surface.append(node);
  };
  append(
    "p",
    "CLIMATERISK / SAVED REPORT",
    "font:12px monospace;color:#235d47;margin-bottom:20px;",
  );
  append(
    "h1",
    report.filename,
    "font:30px Georgia,serif;overflow-wrap:anywhere;margin:0 0 20px;",
  );
  append(
    "p",
    report.provenance === "demo"
      ? "ILLUSTRATIVE SAMPLE — no model was run."
      : "Heuristic index only — not a probability or calibrated confidence.",
    "margin-bottom:20px;",
  );
  for (const [label, value] of reportFields(report))
    append("p", `${label}: ${value}`, "margin:5px 0;overflow-wrap:anywhere;");
  if (report.model_votes)
    append(
      "p",
      Object.entries(report.model_votes)
        .map(([m, v]) => `${m}: ${v}`)
        .join(" · "),
    );
  if (report.description) append("p", report.description, "margin-top:20px;");
  if (report.narrative_reason)
    append("p", report.narrative_reason, "margin-top:20px;");
  if (report.narrative) {
    for (const section of narrativeSections(report.narrative)) {
      append(
        "h2",
        section.heading,
        "font:24px Georgia,serif;margin:25px 0 10px;",
      );
      append(
        "p",
        section.text,
        "white-space:pre-wrap;overflow-wrap:anywhere;margin:0;",
      );
    }
  } else append("p", "Original narrative not recorded.");
  document.body.append(surface);
  try {
    const canvas = await html2canvas(surface, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true,
      }),
      width = 180,
      sliceHeight = Math.floor((267 * canvas.width) / width);
    for (
      let offset = 0, page = 0;
      offset < canvas.height;
      offset += sliceHeight, page++
    ) {
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = Math.min(sliceHeight, canvas.height - offset);
      slice
        .getContext("2d")!
        .drawImage(
          canvas,
          0,
          offset,
          canvas.width,
          slice.height,
          0,
          0,
          canvas.width,
          slice.height,
        );
      if (page) pdf.addPage();
      pdf.addImage(
        slice.toDataURL("image/jpeg", 0.92),
        "JPEG",
        15,
        15,
        width,
        (slice.height * width) / canvas.width,
      );
    }
    pdf.save(
      `climaterisk-${report.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`,
    );
  } finally {
    surface.remove();
  }
}
