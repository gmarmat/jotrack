'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, ExternalLink, Users, Loader } from 'lucide-react';

interface Person {
  id?: string; // Existing person has ID
  name: string;
  title: string;
  linkedinUrl: string;
  manualText?: string;
  role: 'recruiter' | 'hiring_manager' | 'peer' | 'other';
  fetchStatus?: 'idle' | 'testing' | 'success' | 'failed';
}

interface ManagePeopleModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Callback to refresh UI
}

export default function ManagePeopleModal({ jobId, isOpen, onClose, onSave }: ManagePeopleModalProps) {
  const [existingPeople, setExistingPeople] = useState<any[]>([]);
  const [newPeople, setNewPeople] = useState<Person[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load existing people when modal opens
  useEffect(() => {
    if (isOpen && jobId) {
      loadExistingPeople();
    }
  }, [isOpen, jobId]);
  
  const loadExistingPeople = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/people/manage`);
      const data = await res.json();
      
      if (data.success) {
        setExistingPeople(data.people || []);
      }
    } catch (err) {
      console.error('Failed to load people:', err);
    }
  };
  
  const addPersonForm = () => {
    setNewPeople([...newPeople, {
      name: '',
      title: '',
      linkedinUrl: '',
      role: 'recruiter',
      fetchStatus: 'idle',
    }]);
  };
  
  const removePersonForm = (idx: number) => {
    setNewPeople(newPeople.filter((_, i) => i !== idx));
  };
  
  const updatePerson = (idx: number, field: string, value: any) => {
    const updated = [...newPeople];
    updated[idx] = { ...updated[idx], [field]: value };
    setNewPeople(updated);
  };
  
  const testLinkedInFetch = async (idx: number) => {
    const person = newPeople[idx];
    if (!person.linkedinUrl) return;
    
    updatePerson(idx, 'fetchStatus', 'testing');
    
    // Simulate LinkedIn fetch (in real impl, use Tavily or proxy service)
    setTimeout(() => {
      // For now, mark as failed to show manual textarea
      // Real implementation would try to fetch and parse LinkedIn HTML
      updatePerson(idx, 'fetchStatus', 'failed');
    }, 1500);
  };
  
  const unlinkExisting = async (personId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/people/manage`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId }),
      });
      
      if (res.ok) {
        // Remove from local state
        setExistingPeople(existingPeople.filter(p => p.personId !== personId));
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to remove person');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove person');
    }
  };
  
  const saveAll = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Save each new person
      for (const person of newPeople) {
        if (!person.name.trim()) continue; // Skip empty forms
        
        const res = await fetch(`/api/jobs/${jobId}/people/manage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: person.name,
            title: person.title,
            linkedinUrl: person.linkedinUrl,
            relType: person.role,
          }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to save person');
        }
      }
      
      // Success! Callback to refresh UI
      onSave();
      
      // Reset new people forms
      setNewPeople([]);
      
      // Reload existing people
      await loadExistingPeople();
      
    } catch (err: any) {
      setError(err.message || 'Failed to save people');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header (per UI_DESIGN_SYSTEM People Profiles gradient) */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-b border-cyan-200 dark:border-cyan-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Manage Interview Team
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg transition-colors"
            title="Close"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Existing People */}
          {existingPeople.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Current Team ({existingPeople.length})
              </h3>
              <div className="space-y-2">
                {existingPeople.map((person) => (
                  <div 
                    key={person.personId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {person.name}
                      </p>
                      {person.title && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">{person.title}</p>
                      )}
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
                        {person.relType === 'recruiter' ? 'Recruiter' :
                         person.relType === 'hiring_manager' ? 'Hiring Manager' :
                         person.relType === 'peer' ? 'Peer/Panel' :
                         'Other'}
                      </p>
                    </div>
                    {person.linkedinUrl && (
                      <a 
                        href={person.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="View LinkedIn"
                      >
                        <ExternalLink size={16} className="text-blue-600 dark:text-blue-400" />
                      </a>
                    )}
                    <button
                      onClick={() => unlinkExisting(person.personId)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors ml-2"
                      title="Remove from job"
                    >
                      <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Add New People */}
          {newPeople.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Add New People
              </h3>
              <div className="space-y-4">
                {newPeople.map((person, idx) => (
                  <div 
                    key={idx}
                    className="border-2 border-cyan-200 dark:border-cyan-800 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800"
                  >
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => updatePerson(idx, 'name', e.target.value)}
                        placeholder="e.g., Jane Smith"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                    
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title (optional)
                      </label>
                      <input
                        type="text"
                        value={person.title}
                        onChange={(e) => updatePerson(idx, 'title', e.target.value)}
                        placeholder="e.g., Senior Technical Recruiter"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                    
                    {/* LinkedIn URL */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        LinkedIn URL (optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={person.linkedinUrl}
                          onChange={(e) => updatePerson(idx, 'linkedinUrl', e.target.value)}
                          placeholder="https://linkedin.com/in/..."
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                        />
                        <button
                          onClick={() => testLinkedInFetch(idx)}
                          disabled={!person.linkedinUrl || person.fetchStatus === 'testing'}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {person.fetchStatus === 'testing' ? (
                            <Loader size={16} className="animate-spin" />
                          ) : (
                            'Test'
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Manual Text Fallback (if fetch failed) */}
                    {person.fetchStatus === 'failed' && (
                      <div>
                        <label className="block text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                          LinkedIn fetch unavailable - Paste profile text manually
                        </label>
                        <textarea
                          value={person.manualText || ''}
                          onChange={(e) => updatePerson(idx, 'manualText', e.target.value)}
                          placeholder="Paste the person's LinkedIn profile text here (bio, experience, skills)..."
                          rows={4}
                          className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-gray-900 dark:text-gray-100 text-sm"
                        />
                      </div>
                    )}
                    
                    {/* Role Selector */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Role *
                      </label>
                      <select
                        value={person.role}
                        onChange={(e) => updatePerson(idx, 'role', e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="recruiter">Recruiter</option>
                        <option value="hiring_manager">Hiring Manager</option>
                        <option value="peer">Peer/Panel</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    {/* Remove Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => removePersonForm(idx)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Add Person Button */}
          <button
            onClick={addPersonForm}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-cyan-300 dark:border-cyan-700 hover:border-cyan-400 dark:hover:border-cyan-600 rounded-lg text-cyan-700 dark:text-cyan-300 font-medium transition-colors"
          >
            <Plus size={18} />
            Add Person
          </button>
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          
          {/* Info Box */}
          <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Tip:</span> Add anyone involved in the interview process. 
              Our AI will analyze their profiles and provide tailored preparation tips.
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveAll}
            disabled={isSaving || newPeople.every(p => !p.name.trim())}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : `Save ${newPeople.filter(p => p.name.trim()).length} ${newPeople.filter(p => p.name.trim()).length === 1 ? 'Person' : 'People'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

