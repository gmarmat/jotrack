interface LoadingShimmerProps {
  className?: string;
  rows?: number;
  height?: string;
}

export default function LoadingShimmer({ className = '', rows = 3, height = 'h-4' }: LoadingShimmerProps) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`bg-gray-200 rounded ${height}`}></div>
      ))}
    </div>
  );
}

export function LoadingShimmerTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {/* Table Header */}
      <div className="flex gap-4">
        <div className="h-8 bg-gray-300 rounded flex-1"></div>
        <div className="h-8 bg-gray-300 rounded flex-1"></div>
        <div className="h-8 bg-gray-300 rounded flex-1"></div>
      </div>
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-12 bg-gray-200 rounded flex-1"></div>
          <div className="h-12 bg-gray-200 rounded flex-1"></div>
          <div className="h-12 bg-gray-200 rounded flex-1"></div>
        </div>
      ))}
    </div>
  );
}

export function LoadingShimmerCard() {
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 space-y-4 animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
    </div>
  );
}

