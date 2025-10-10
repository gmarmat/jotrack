"use client";
import { useEffect, useRef, useState } from "react";
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from "pdfjs-dist";

// Set worker source
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export default function PdfViewer({ url }: { url: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const pdf: PDFDocumentProxy = await getDocument({ url }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.25 });
        const canvas = ref.current!;
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport } as any).promise;
      } catch (err) {
        console.error('PDF render error:', err);
        setError('Failed to render PDF');
      }
    })();
  }, [url]);

  if (error) {
    return <div className="text-sm text-red-600" data-testid="pdf-error">{error}</div>;
  }

  return <canvas ref={ref} className="max-h-[80vh] w-auto" data-testid="pdf-canvas" />;
}

