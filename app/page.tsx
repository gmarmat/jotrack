'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import StatusSelect from './components/StatusSelect';
import StatusBadge from './components/StatusBadge';
import HistoryModal from './components/HistoryModal';
import AttachmentsButton from './components/AttachmentsButton';
import BackupRestorePanel from './components/BackupRestorePanel';
import FilterChips from './components/FilterChips';
import { ORDERED_STATUSES, STATUS_LABELS, type JobStatus, isJobStatus } from '@/lib/status';

interface Job {
  id: string;
  title: string;
  company: string;
  status: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export default function Home() {
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

  // Client-side filtering based on status URL param
  const filteredJobs = useMemo(() => {
    const statusParam = searchParams.get('status');
    if (!statusParam || !isJobStatus(statusParam)) {
      return jobs;
    }
    return jobs.filter((job) => job.status === statusParam);
  }, [jobs, searchParams]);

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

  const handleCloseHistory = () => {
    setHistoryModal({ isOpen: false, jobId: '', jobTitle: '' });
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">🎯 Jotrack</h1>
          <p className="text-gray-600 mt-2">Track your job applications</p>
        </header>

        {/* Backup & Restore Panel */}
        <BackupRestorePanel />

        {/* Create Job Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add New Job Application</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Applications</h2>
            
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

          {isLoading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : filteredJobs.length === 0 ? (
            <p className="text-center text-gray-500">
              {jobs.length === 0 ? 'No job applications yet. Add one above!' : 'No jobs match the selected filter.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Updated</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Attachments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
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
                        <button
                          onClick={() => handleOpenHistory(job.id, job.title)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          data-testid={`history-btn-${job.id}`}
                        >
                          History
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <AttachmentsButton jobId={job.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    </main>
  );
}

