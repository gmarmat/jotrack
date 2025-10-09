import { STATUS_LABELS, type JobStatus } from '@/lib/status';

export default function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'ON_RADAR'
      ? 'bg-amber-100 text-amber-700'
      : status === 'APPLIED'
      ? 'bg-blue-100 text-blue-700'
      : status === 'PHONE_SCREEN'
      ? 'bg-indigo-100 text-indigo-700'
      : status === 'ONSITE'
      ? 'bg-purple-100 text-purple-700'
      : status === 'OFFER'
      ? 'bg-green-100 text-green-700'
      : status === 'REJECTED'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-700';

  const label = STATUS_LABELS[status as JobStatus] || status.replace(/_/g, ' ');

  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${color}`}
      data-testid={`status-badge-${status}`}
    >
      {label}
    </span>
  );
}

