import jsPDF from "jspdf";

export type PdfComponent = { name: string; category: string; qty: number; unit_price: number; notes?: string };
export type PdfResult = {
  cost_min: number; cost_max: number;
  timeline_weeks_min: number; timeline_weeks_max: number;
  complexity_score: number; risk_level: string;
  tech_stack: string[];
  breakdown: { phases: { name: string; cost: number; weeks: number; notes: string }[] };
  components?: PdfComponent[];
  explanation: string;
};

export function downloadEstimationPdf({ title, description, type, result }:
  { title: string; description: string; type: string; result: PdfResult }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;
  let y = 50;
  const peso = (n: number) => "PHP " + Number(n).toLocaleString();
  const line = (h = 14) => { y += h; if (y > 780) { doc.addPage(); y = 50; } };

  doc.setFillColor(15, 23, 42); doc.rect(0, 0, W, 80, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  doc.text("NPAV Tech — Project Estimation", M, 40);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(`Generated ${new Date().toLocaleString()}  |  Cael AI`, M, 60);

  y = 110;
  doc.setTextColor(20); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text(title || "Untitled project", M, y); line(18);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80);
  doc.text(`Type: ${type}`, M, y); line();
  if (description) {
    const descLines = doc.splitTextToSize(description, W - M * 2);
    doc.text(descLines, M, y); y += descLines.length * 12 + 8;
  }

  doc.setDrawColor(220); doc.line(M, y, W - M, y); line(20);

  doc.setTextColor(20); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text("Summary", M, y); line(16);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(`Cost range: ${peso(result.cost_min)} - ${peso(result.cost_max)}`, M, y); line();
  doc.text(`Timeline: ${result.timeline_weeks_min} - ${result.timeline_weeks_max} weeks`, M, y); line();
  doc.text(`Complexity: ${result.complexity_score}/10   |   Risk: ${result.risk_level}`, M, y); line();
  doc.text(`Tech stack: ${(result.tech_stack || []).join(", ")}`, M, y); line(20);

  if (result.explanation) {
    doc.setFont("helvetica", "bold"); doc.text("AI Explanation", M, y); line(14);
    doc.setFont("helvetica", "normal");
    const expLines = doc.splitTextToSize(result.explanation, W - M * 2);
    doc.text(expLines, M, y); y += expLines.length * 12 + 14;
  }

  if (result.breakdown?.phases?.length) {
    doc.setFont("helvetica", "bold"); doc.text("Phase Breakdown", M, y); line(14);
    doc.setFont("helvetica", "normal");
    result.breakdown.phases.forEach((ph) => {
      if (y > 740) { doc.addPage(); y = 50; }
      doc.setFont("helvetica", "bold"); doc.text(`• ${ph.name}`, M, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${peso(ph.cost)} · ${ph.weeks} wk`, W - M, y, { align: "right" });
      line(12);
      const n = doc.splitTextToSize(ph.notes || "", W - M * 2 - 14);
      doc.setTextColor(110); doc.text(n, M + 14, y); y += n.length * 11 + 4; doc.setTextColor(20);
    });
  }

  if (result.components?.length) {
    line(10);
    doc.setFont("helvetica", "bold"); doc.text("Suggested Components & Parts", M, y); line(14);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text("Item", M, y); doc.text("Qty", 340, y); doc.text("Unit", 400, y); doc.text("Subtotal", W - M, y, { align: "right" }); line(12);
    doc.setFont("helvetica", "normal");
    let total = 0;
    result.components.forEach((c) => {
      const sub = Number(c.qty) * Number(c.unit_price); total += sub;
      if (y > 760) { doc.addPage(); y = 50; }
      doc.text(doc.splitTextToSize(c.name, 280), M, y);
      doc.text(String(c.qty), 340, y);
      doc.text(peso(c.unit_price), 400, y);
      doc.text(peso(sub), W - M, y, { align: "right" });
      line(14);
    });
    doc.setFont("helvetica", "bold");
    doc.text("Total", M, y);
    doc.text(peso(total), W - M, y, { align: "right" });
  }

  const safe = (title || "estimation").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  doc.save(`npav_${safe}.pdf`);
}
