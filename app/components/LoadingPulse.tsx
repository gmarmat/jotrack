import { Loader2 } from 'lucide-react';

interface LoadingPulseProps {
  size?: number;
  className?: string;
  text?: string;
}

export default function LoadingPulse({ size = 20, className = '', text }: LoadingPulseProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin text-blue-600`} size={size} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}

export function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex gap-1 ${className}`}>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
}

