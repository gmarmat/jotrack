"use client";
import { useEffect, useState } from "react";
import * as mammoth from "mammoth/mammoth.browser";

export default function DocxViewer({ url }: { url: string }) {
  const [html, setHtml] = useState<string>("Loading…");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buf });
        setHtml(result.value || "Empty document");
      } catch (err) {
        console.error('DOCX render error:', err);
        setHtml("Failed to render DOCX");
      }
    })();
  }, [url]);

  return (
    <article
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
      data-testid="docx-html"
    />
  );
}

