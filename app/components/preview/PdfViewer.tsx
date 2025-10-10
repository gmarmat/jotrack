"use client";

/**
 * Simple, reliable PDF viewer using native browser PDF rendering
 * No external dependencies, no worker issues
 */
export default function PdfViewer({ url }: { url: string }) {
  return (
    <object
      data={url}
      type="application/pdf"
      className="w-full h-full min-h-[600px]"
      data-testid="pdf-canvas"
    >
      <embed
        src={url}
        type="application/pdf"
        className="w-full h-full min-h-[600px]"
      />
      <p className="text-sm text-gray-600 p-4">
        Your browser doesn't support embedded PDFs. 
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">
          Open in new tab
        </a>
      </p>
    </object>
  );
}

