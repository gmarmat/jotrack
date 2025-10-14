'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import StatusSelect from './components/StatusSelect';
import StatusBadge from './components/StatusBadge';
import HistoryModal from './components/HistoryModal';
import AttachmentsButton from './components/AttachmentsButton';
import AttachmentPresence from './components/AttachmentPresence';
import AttachmentQuickPreview from './components/AttachmentQuickPreview';
import BackupRestorePanel from './components/BackupRestorePanel';
import FilterChips from './components/FilterChips';
import { SelectionBar } from './components/SelectionBar';
import ReloadDataButton from './components/ReloadDataButton';
import GlobalSettingsModal from './components/GlobalSettingsModal';
import GlobalSettingsButton from './components/GlobalSettingsButton';
import PaginationControls from './components/PaginationControls';
import { LoadingShimmerTable } from './components/LoadingShimmer';
import { ORDERED_STATUSES, STATUS_LABELS, type JobStatus, isJobStatus } from '@/lib/status';

interface Job {
  id: string;
  title: string;
  company: string;
  status: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
  attachmentSummary?: Record<string, { count: number; latest: number | null }>;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    status: 'APPLIED' as JobStatus,
    notes: '',
  });
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean; jobId: string; jobTitle: string }>({
    isOpen: false,
    jobId: '',
    jobTitle: '',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [trashJobs, setTrashJobs] = useState<Job[]>([]);
  const [archivedJobs, setArchivedJobs] = useState<Job[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Client-side filtering based on status URL param
  const filteredJobs = useMemo(() => {
    const statusParam = searchParams.get('status');
    if (!statusParam || !isJobStatus(statusParam)) {
      return jobs;
    }
    return jobs.filter((job) => job.status === statusParam);
  }, [jobs, searchParams]);

  // Paginated jobs
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredJobs.slice(startIndex, endIndex);
  }, [filteredJobs, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredJobs.length / rowsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams, searchQuery]);

  const fetchJobs = async (query = '') => {
    try {
      const url = query ? `/api/jobs?q=${encodeURIComponent(query)}` : '/api/jobs';
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrash = async () => {
    try {
      const response = await fetch('/api/jobs/trash');
      const data = await response.json();
      if (data.success) {
        setTrashJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching trash:', error);
    }
  };

  const fetchArchived = async () => {
    try {
      const response = await fetch('/api/jobs/archived');
      const data = await response.json();
      if (data.success) {
        setArchivedJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching archived:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(searchQuery);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFormData({ title: '', company: '', status: 'APPLIED', notes: '' });
        fetchJobs();
      } else {
        alert(data.message || 'Failed to create job');
      }
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job');
    }
  };

  const handleStatusChange = (jobId: string, newStatus: string) => {
    // Optimistically update the job in the list
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === jobId ? { ...job, status: newStatus, updatedAt: Date.now() } : job
      )
    );
  };

  const handleOpenHistory = (jobId: string, jobTitle: string) => {
    setHistoryModal({ isOpen: true, jobId, jobTitle });
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Move this job to trash? It will be automatically deleted after 5 days unless restored.')) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/delete`, { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        fetchJobs(); // Refresh list
      } else {
        alert('Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job');
    }
  };

  const handleArchive = async (jobId: string) => {
    if (!confirm('Archive this job? It will be hidden from the main list but can be restored anytime.')) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive: true }),
      });
      const data = await response.json();
      
      if (data.success) {
        fetchJobs(); // Refresh list
      } else {
        alert('Failed to archive job');
      }
    } catch (error) {
      console.error('Error archiving job:', error);
      alert('Failed to archive job');
    }
  };

  const handleCloseHistory = () => {
    setHistoryModal({ isOpen: false, jobId: '', jobTitle: '' });
  };

  const toggleSelection = (jobId: string, event?: React.MouseEvent, index?: number) => {
    if (event?.shiftKey && lastClickedIndex !== null && index !== undefined) {
      // Shift+Click: select range
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      const rangeIds = paginatedJobs.slice(start, end + 1).map(job => job.id);
      
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        rangeIds.forEach(id => newSet.add(id));
        return Array.from(newSet);
      });
      setLastClickedIndex(index);
    } else {
      // Regular click: toggle single
      setSelectedIds((prev) =>
        prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
      );
      if (index !== undefined) {
        setLastClickedIndex(index);
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredJobs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredJobs.map((job) => job.id));
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      {/* Global Settings Button */}
      <GlobalSettingsButton />
      
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex-1"></div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">🎯 Jotrack</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Track your job applications</p>
          </div>
          <div className="flex-1"></div>
        </header>

        {/* Create Job Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Add New Job Application</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., Senior React Developer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., TechCorp"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as JobStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {ORDERED_STATUSES.map((key) => (
                  <option key={key} value={key}>{STATUS_LABELS[key]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Add Job Application
            </button>
          </form>
        </div>

        {/* Search and List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Your Applications</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowArchived(true);
                    fetchArchived();
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
                  data-testid="view-archived-btn"
                >
                  📁 Archived
                </button>
                <button
                  onClick={() => {
                    setShowTrash(true);
                    fetchTrash();
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
                  data-testid="view-trash-btn"
                >
                  🗑️ Trash
                </button>
                <ReloadDataButton onReload={() => fetchJobs()} />
              </div>
            </div>
            
            {/* Status Filter Chips */}
            <Suspense fallback={<div className="h-8 mb-4" />}>
              <FilterChips />
            </Suspense>
            
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs by title, company, or notes..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors font-medium"
              >
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    fetchJobs();
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          {selectedIds.length > 0 && (
            <SelectionBar selectedIds={selectedIds} clearSelection={() => setSelectedIds([])} />
          )}

          {isLoading ? (
            <div className="py-4">
              <LoadingShimmerTable rows={5} />
            </div>
          ) : filteredJobs.length === 0 ? (
            <p className="text-center text-gray-500">
              {jobs.length === 0 ? 'No job applications yet. Add one above!' : 'No jobs match the selected filter.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredJobs.length && filteredJobs.length > 0}
                        onChange={toggleSelectAll}
                        className="cursor-pointer"
                        data-testid="row-select-all"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Updated</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Attachments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedJobs.map((job, index) => (
                    <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" data-testid="job-row">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(job.id)}
                          onChange={(e) => toggleSelection(job.id, e as any, index)}
                          className="cursor-pointer"
                          data-testid={`row-select-${job.id}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/jobs/${job.id}`} 
                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            data-testid={`job-link-${job.id}`}
                          >
                            {job.title}
                          </Link>
                          <StatusBadge status={job.status} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{job.company}</td>
                      <td className="px-4 py-3">
                        <StatusSelect
                          jobId={job.id}
                          initialStatus={job.status}
                          onStatusChange={handleStatusChange}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(job.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenHistory(job.id, job.title)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            data-testid={`history-btn-${job.id}`}
                          >
                            History
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleArchive(job.id)}
                            className="text-sm text-yellow-600 hover:text-yellow-800 font-medium"
                            data-testid={`archive-btn-${job.id}`}
                            title="Archive job"
                          >
                            Archive
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDelete(job.id)}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                            data-testid={`delete-btn-${job.id}`}
                            title="Move to trash"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <AttachmentQuickPreview
                            jobId={job.id}
                            attachmentSummary={job.attachmentSummary || {}}
                          />
                          <AttachmentPresence 
                            summary={job.attachmentSummary || {}} 
                            jobId={job.id} 
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                rowsPerPage={rowsPerPage}
                totalItems={filteredJobs.length}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={(rows) => {
                  setRowsPerPage(rows);
                  setCurrentPage(1); // Reset to first page when changing rows per page
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* History Modal */}
      <HistoryModal
        jobId={historyModal.jobId}
        jobTitle={historyModal.jobTitle}
        isOpen={historyModal.isOpen}
        onClose={handleCloseHistory}
      />

      {/* Trash Modal */}
      {showTrash && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" data-testid="trash-modal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">🗑️ Trash</h2>
              <button
                onClick={() => setShowTrash(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {trashJobs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Trash is empty</p>
              ) : (
                <div className="space-y-4">
                  {trashJobs.map((job: any) => (
                    <div key={job.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.company}</p>
                          {job.daysUntilPurge !== null && job.daysUntilPurge >= 0 && (
                            <p className="text-xs text-red-600 mt-2">
                              ⏰ Auto-delete in {job.daysUntilPurge} day{job.daysUntilPurge !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const response = await fetch(`/api/jobs/${job.id}/restore`, { method: 'POST' });
                              if (response.ok) {
                                fetchTrash();
                                fetchJobs();
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            data-testid={`restore-btn-${job.id}`}
                          >
                            Restore
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Permanently delete this job and all its attachments? This cannot be undone.')) {
                                const response = await fetch(`/api/jobs/${job.id}/purge`, { method: 'POST' });
                                if (response.ok) {
                                  fetchTrash();
                                }
                              }
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            data-testid={`purge-btn-${job.id}`}
                          >
                            Delete Forever
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Archived Modal */}
      {showArchived && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" data-testid="archived-modal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">📁 Archived Jobs</h2>
              <button
                onClick={() => setShowArchived(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {archivedJobs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No archived jobs</p>
              ) : (
                <div className="space-y-4">
                  {archivedJobs.map((job: any) => (
                    <div key={job.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.company}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Archived {new Date(job.archivedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const response = await fetch(`/api/jobs/${job.id}/archive`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ archive: false }),
                              });
                              if (response.ok) {
                                fetchArchived();
                                fetchJobs();
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            data-testid={`unarchive-btn-${job.id}`}
                          >
                            Unarchive
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 flex items-center justify-center"><p className="text-gray-600">Loading...</p></div>}>
      <HomeContent />
    </Suspense>
  );
}

