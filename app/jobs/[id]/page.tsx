import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db/client';
import { jobs, attachments } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import StatusSelect from '@/app/components/StatusSelect';
import StatusBadge from '@/app/components/StatusBadge';
import AttachmentsPanel from '@/app/components/AttachmentsPanel';
import JobDetailsPanel from '@/app/components/JobDetailsPanel';
import JobActionsBar from '@/app/components/JobActionsBar';
import { STATUS_LABELS, type JobStatus } from '@/lib/status';

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return notFound();

  const currentStatus = (job.status as JobStatus) ?? 'ON_RADAR';
  
  // Get attachment count for actions bar
  const attachmentRows = await db
    .select({ count: attachments.id })
    .from(attachments)
    .where(and(eq(attachments.jobId, id), isNull(attachments.deletedAt)));
  const attachmentCount = attachmentRows.length;

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
                <JobActionsBar job={job} attachmentCount={attachmentCount} />
              </div>
              <p className="text-lg text-gray-600 mt-1" data-testid="job-company">{job.company}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Status:</span>
              <StatusSelect jobId={job.id} initialStatus={currentStatus} />
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-sm">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to list
          </Link>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Details */}
          <JobDetailsPanel job={job} currentStatus={currentStatus} />
          
          {/* Right column - Attachments */}
          <section id="attachments" className="bg-white rounded-xl border shadow p-6 scroll-mt-20">
            <h2 className="font-semibold text-lg mb-4 text-gray-900">Attachments</h2>
            <AttachmentsPanel jobId={job.id} />
          </section>
        </div>

      </div>
    </main>
  );
}

