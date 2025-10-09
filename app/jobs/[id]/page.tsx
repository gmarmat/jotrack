import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db/client';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import StatusSelect from '@/app/components/StatusSelect';
import StatusBadge from '@/app/components/StatusBadge';
import { STATUS_LABELS, type JobStatus } from '@/lib/status';

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return notFound();

  const currentStatus = (job.status as JobStatus) ?? 'ON_RADAR';

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900" data-testid="job-title">{job.title}</h1>
                <StatusBadge status={currentStatus} />
              </div>
              <p className="text-lg text-gray-600 mt-1" data-testid="job-company">{job.company}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Status:</span>
              <StatusSelect jobId={job.id} initialStatus={currentStatus} onStatusChange={() => {}} />
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-sm">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to list
          </Link>
        </div>

        {/* Shell for future panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl border shadow p-6">
            <h2 className="font-semibold text-lg mb-4 text-gray-900">Details</h2>
            <dl className="text-sm space-y-3">
              <div>
                <dt className="text-gray-500 font-medium">Current Status</dt>
                <dd className="text-gray-900 mt-1">{STATUS_LABELS[currentStatus]}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Created</dt>
                <dd className="text-gray-900 mt-1">{new Date(job.createdAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Last Updated</dt>
                <dd className="text-gray-900 mt-1">{new Date(job.updatedAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Notes</dt>
                <dd className="text-gray-900 mt-1 whitespace-pre-wrap">{job.notes || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="bg-white rounded-xl border shadow p-6">
            <h2 className="font-semibold text-lg mb-4 text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-600">
              Future panels: Attachments, Timeline, Interview Notes
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

