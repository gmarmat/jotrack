"use client";
import { useEffect, useState } from "react";
import * as mammoth from "mammoth/mammoth.browser";

export default function DocxViewer({ url }: { url: string }) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buf });
        setHtml(result.value || "<p class='text-gray-500'>Empty document</p>");
      } catch (err) {
        console.error('DOCX render error:', err);
        setHtml("<p class='text-red-600'>Failed to render DOCX</p>");
      } finally {
        setLoading(false);
      }
    })();
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-medium text-gray-600">Loading document...</div>
        </div>
      </div>
    );
  }

  return (
    <article
      className="prose prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-li:text-gray-700 prose-code:text-gray-800 prose-code:bg-gray-100"
      dangerouslySetInnerHTML={{ __html: html }}
      data-testid="docx-html"
    />
  );
}

