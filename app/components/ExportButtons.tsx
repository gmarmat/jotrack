"use client";

import { Download, FileArchive } from "lucide-react";

interface ExportButtonsProps {
  jobId?: string; // If provided, export single job
}

export default function ExportButtons({ jobId }: ExportButtonsProps) {
  const handleCSVExport = async () => {
    try {
      const res = await fetch("/api/export/csv");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jotrack-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV export failed:", error);
      alert("Export failed");
    }
  };

  const handleJobZipExport = async () => {
    if (!jobId) return;

    try {
      const res = await fetch(`/api/export/job-zip/${jobId}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `job-export-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Job ZIP export failed:", error);
      alert("Export failed");
    }
  };

  return (
    <div className="flex items-center gap-2" data-testid="export-buttons">
      {jobId && (
        <button
          onClick={handleJobZipExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          data-testid="export-job-zip"
          title="Export this job with attachments as ZIP"
        >
          <FileArchive size={14} />
          Export Job ZIP
        </button>
      )}
      
      <button
        onClick={handleCSVExport}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
        data-testid="export-csv"
        title="Export all jobs as CSV"
      >
        <Download size={14} />
        Export CSV
      </button>
    </div>
  );
}

