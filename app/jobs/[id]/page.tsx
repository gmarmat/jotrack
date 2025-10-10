"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusSelect from '@/app/components/StatusSelect';
import StatusBadge from '@/app/components/StatusBadge';
import AttachmentsPanel from '@/app/components/AttachmentsPanel';
import JobDetailsPanel from '@/app/components/JobDetailsPanel';
import JobActionsBar from '@/app/components/JobActionsBar';
import TrashPanel from '@/app/components/attachments/TrashPanel';
import { type JobStatus } from '@/lib/status';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [showTrash, setShowTrash] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const id = params.id;

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data = await res.json();
        setJob(data);
        // Fetch attachment count
        const attRes = await fetch(`/api/jobs/${id}/attachments`);
        const attData = await attRes.json();
        setAttachmentCount(attData.attachments?.filter((a: any) => !a.deletedAt).length ?? 0);
      } catch (error) {
        console.error('Failed to fetch job:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center text-gray-600">Loading...</div>
        </div>
      </main>
    );
  }

  if (!job) return null;

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
                <JobActionsBar job={job} attachmentCount={attachmentCount} />
              </div>
              <p className="text-lg text-gray-600 mt-1" data-testid="job-company">{job.company}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTrash(true)}
                className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium"
                data-testid="open-trash"
              >
                🗑️ Trash
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">Status:</span>
                <StatusSelect jobId={job.id} initialStatus={currentStatus} />
              </div>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-sm">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to list
          </Link>
        </div>

               {/* Details section - full width */}
               <JobDetailsPanel job={job} currentStatus={currentStatus} />

        {/* Attachments section - full width */}
        <section id="attachments" className="bg-white rounded-xl border shadow p-6 scroll-mt-24 max-w-screen-lg mx-auto" data-testid="attachments-section">
          <h2 className="font-semibold text-lg mb-4 text-gray-900">Attachments</h2>
          <AttachmentsPanel jobId={job.id} />
        </section>

      </div>

      {/* Trash Panel */}
      {showTrash && (
        <TrashPanel jobId={job.id} onClose={() => setShowTrash(false)} />
      )}
    </main>
  );
}

