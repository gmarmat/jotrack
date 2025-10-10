"use client";

/**
 * Apple-inspired PDF viewer using native browser rendering
 * Clean, minimal design with proper shadows and spacing
 */
export default function PdfViewer({ url }: { url: string }) {
  return (
    <div className="w-full h-full bg-white rounded-xl shadow-lg overflow-hidden">
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
        <div className="flex items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Your browser doesn't support embedded PDFs
            </p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Open in new tab
            </a>
          </div>
        </div>
      </object>
    </div>
  );
}

