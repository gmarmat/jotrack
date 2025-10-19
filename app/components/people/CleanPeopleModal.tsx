'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Zap, Eye, CheckCircle2, AlertCircle, Loader, Edit3 } from 'lucide-react';

interface Person {
  id?: string;
  name: string;
  title: string;
  role: 'recruiter' | 'hiring_manager' | 'peer' | 'other';
  linkedinText: string;
}

interface CleanPeopleModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function CleanPeopleModal({ jobId, isOpen, onClose, onSave }: CleanPeopleModalProps) {
  const [existingPeople, setExistingPeople] = useState<any[]>([]);
  const [newPerson, setNewPerson] = useState<Person>({
    name: '',
    title: '',
    role: 'recruiter',
    linkedinText: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<{id: string, name: string, currentRole: string} | null>(null);

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
        console.log('📊 Loaded people:', data.people?.length || 0);
      }
    } catch (err) {
      console.error('Failed to load people:', err);
    }
  };

  const optimizePerson = async (personId: string, rawText: string) => {
    setOptimizing(personId);
    setError(null);
    try {
      console.log(`🔍 Optimizing profile ${personId}...`);
      
      const res = await fetch(`/api/jobs/${jobId}/people/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId, pastedText: rawText })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Optimization failed');
      }
      
      const data = await res.json();
      console.log('✅ Profile optimized:', {
        name: data.extracted?.name,
        fields: Object.keys(data.extracted || {})
      });
      
      // Refresh people list
      await loadExistingPeople();
    } catch (error: any) {
      console.error('❌ Optimization error:', error);
      setError(`Failed to optimize profile: ${error.message}`);
    } finally {
      setOptimizing(null);
    }
  };

  const saveNewPerson = async () => {
    if (!newPerson.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}/people/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPerson.name.trim(),
          title: newPerson.title.trim(),
          relType: newPerson.role,
          manualText: newPerson.linkedinText.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save person');
      }

      console.log('✅ Person saved');
      
      // Reset form
      setNewPerson({
        name: '',
        title: '',
        role: 'recruiter',
        linkedinText: ''
      });

      // Refresh list
      await loadExistingPeople();
    } catch (error: any) {
      console.error('❌ Save error:', error);
      setError(`Failed to save person: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const editRole = async (personId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/people/update-role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId, relType: newRole })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update role');
      }

      console.log('✅ Role updated');
      await loadExistingPeople();
    } catch (error: any) {
      console.error('❌ Update role error:', error);
      setError(`Failed to update role: ${error.message}`);
    }
  };

  const deletePerson = async (personId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/people/manage`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete person');
      }

      console.log('✅ Person deleted');
      await loadExistingPeople();
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      setError(`Failed to delete person: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Manage Interview Team
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Current Team */}
          {existingPeople.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Current Team ({existingPeople.length})
              </h3>
              <div className="space-y-3">
                {existingPeople.map((person) => {
                  const isOptimized = person.isOptimized === 1;
                  const isOptimizing = optimizing === person.personId;
                  const extracted = isOptimized && person.summary 
                    ? JSON.parse(person.summary) 
                    : null;

                  return (
                    <div 
                      key={person.personId}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {extracted?.name || person.name}
                            </h4>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
                              {person.relType === 'recruiter' ? 'Recruiter' :
                               person.relType === 'hiring_manager' ? 'Hiring Manager' :
                               person.relType === 'peer' ? 'Peer/Panel' : 'Other'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {extracted?.currentTitle || person.title || 'No title'}
                            {extracted?.currentCompany && ` at ${extracted.currentCompany}`}
                          </p>

                          {/* Status */}
                          <div className="flex items-center gap-2">
                            {!isOptimized ? (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                <AlertCircle size={12} />
                                {person.rawText ? 'Not optimized' : 'Needs LinkedIn text'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle2 size={12} />
                                Optimized
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {/* Edit Role Button */}
                          <button
                            onClick={() => {
                              setEditingRole({
                                id: person.personId,
                                name: person.name,
                                currentRole: person.relType
                              });
                            }}
                            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="Edit role (Recruiter/Hiring Manager/Peer/Other)"
                          >
                            <Edit3 className="text-blue-600 dark:text-blue-400" size={16} />
                          </button>

                          {/* Zap Button */}
                          {!isOptimized && person.rawText && (
                            <button
                              onClick={() => optimizePerson(person.personId, person.rawText)}
                              disabled={isOptimizing}
                              className="p-2 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded transition-colors disabled:opacity-50"
                              title="Optimize profile (AI extraction)"
                            >
                              {isOptimizing ? (
                                <Loader className="animate-spin text-cyan-600 dark:text-cyan-400" size={16} />
                              ) : (
                                <Zap className="text-cyan-600 dark:text-cyan-400" size={16} />
                              )}
                            </button>
                          )}

                          {/* Eye Button */}
                          <button
                            onClick={() => {
                              if (isOptimized && extracted) {
                                const display = `OPTIMIZED PROFILE\n\n` +
                                  `Name: ${extracted.name}\n` +
                                  `Title: ${extracted.currentTitle || 'N/A'}\n` +
                                  `Company: ${extracted.currentCompany || 'N/A'}\n` +
                                  `Location: ${extracted.location || 'N/A'}\n\n` +
                                  `About:\n${extracted.aboutMe || 'N/A'}\n\n` +
                                  `Work: ${extracted.workExperiences?.length || 0} roles\n` +
                                  `Education: ${extracted.education?.length || 0} degrees\n` +
                                  `Skills: ${extracted.skills?.length || 0} listed\n\n` +
                                  `(Full JSON in console)`;
                                
                                console.log('📋 Full extracted data:', extracted);
                                alert(display);
                              } else if (person.rawText) {
                                const display = `RAW LINKEDIN TEXT\n\n` +
                                  `${person.rawText.slice(0, 500)}${person.rawText.length > 500 ? '...\n\n(Truncated)' : ''}`;
                                
                                console.log('📋 Full raw text:', person.rawText);
                                alert(display);
                              } else {
                                alert(`Profile: ${person.name}\n\nNo LinkedIn text available.`);
                              }
                            }}
                            className="p-2 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded transition-colors"
                            title="View profile data"
                          >
                            <Eye className="text-cyan-600 dark:text-cyan-400" size={16} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => deletePerson(person.personId)}
                            disabled={isOptimizing}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                            title="Delete person"
                          >
                            <Trash2 className="text-red-600 dark:text-red-400" size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add New Person */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Add New Person
            </h3>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newPerson.name}
                  onChange={(e) => setNewPerson({...newPerson, name: e.target.value})}
                  placeholder="e.g., Jane Smith"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={newPerson.title}
                  onChange={(e) => setNewPerson({...newPerson, title: e.target.value})}
                  placeholder="e.g., Senior Technical Recruiter"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role *
                </label>
                <select
                  value={newPerson.role}
                  onChange={(e) => setNewPerson({...newPerson, role: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="recruiter">Recruiter</option>
                  <option value="hiring_manager">Hiring Manager</option>
                  <option value="peer">Peer/Panel Interviewer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* LinkedIn Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  LinkedIn Profile Text *
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Copy and paste the complete LinkedIn profile content here
                </p>
                <textarea
                  value={newPerson.linkedinText}
                  onChange={(e) => setNewPerson({...newPerson, linkedinText: e.target.value})}
                  placeholder="Paste the complete LinkedIn profile text here (name, title, about section, work experience, education, skills, etc.)..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {newPerson.linkedinText.length} characters
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={saveNewPerson}
                disabled={isSaving || !newPerson.name.trim() || !newPerson.linkedinText.trim()}
                className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Add Person'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Edit Role - {editingRole.name}
              </h3>
              <button
                onClick={() => setEditingRole(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Role
                </label>
                <select
                  value={editingRole.currentRole}
                  onChange={(e) => setEditingRole({...editingRole, currentRole: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="recruiter">Recruiter</option>
                  <option value="hiring_manager">Hiring Manager</option>
                  <option value="peer">Peer/Panel Interviewer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingRole(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await editRole(editingRole.id, editingRole.currentRole);
                    setEditingRole(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
