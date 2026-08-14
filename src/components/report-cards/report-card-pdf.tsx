"use client";

import { useState } from "react";
import { PrinterIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReportRow {
  subject: string;
  mark: number;
  maxMark: number;
  percentage: number;
  grade: string | null;
  points: number;
}

export function ReportCardPdf({
  studentName,
  admissionNumber,
  className,
  examName,
  examType,
  termName,
  rows,
  average,
  totalPoints,
  position,
  schoolName,
}: {
  studentName: string;
  admissionNumber: string;
  className: string;
  examName: string;
  examType: string;
  termName: string;
  rows: ReportRow[];
  average: number;
  totalPoints: number;
  position: number | null;
  schoolName: string;
}) {
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const [{ jsPDF: JSPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new JSPDF();
      doc.setFontSize(18);
      doc.text(schoolName || "Mazikor Schools", 14, 20);
      doc.setFontSize(11);
      doc.text("Report Card", 14, 27);
      doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text(
        `${examName} (${examType})${termName ? ` · ${termName}` : ""}`,
        14,
        32
      );
      doc.setTextColor(0);

      autoTable(doc, {
        startY: 38,
        head: [["Subject", "Mark", "Max", "%", "Grade", "Points"]],
        body: rows.map((r) => [
          r.subject,
          String(r.mark),
          String(r.maxMark),
          `${r.percentage}%`,
          r.grade ?? "—",
          String(r.points),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [29, 78, 216] },
      });

      const after = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
      doc.setFontSize(10);
      doc.text(`Average: ${average.toFixed(1)}%`, 14, after);
      doc.text(`Total points: ${totalPoints}`, 14, after + 5);
      doc.text(position ? `Position: #${position}` : "Position: —", 14, after + 10);
      doc.text(`Student: ${studentName} (${admissionNumber})`, 14, after + 16);
      doc.text(`Class: ${className}`, 14, after + 21);
      doc.save(`report-card-${admissionNumber}.pdf`);
      toast.success("Report card downloaded");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={generate} variant="outline" disabled={loading}>
      {loading ? <Loader2Icon className="size-4 animate-spin" /> : <PrinterIcon />}
      {loading ? "Generating…" : "Download PDF"}
    </Button>
  );
}
