'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, ExternalLink, Users, Loader, Eye, Zap, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';

interface Person {
  id?: string; // Existing person has ID
  name: string;
  title: string;
  linkedinUrl: string;
  manualText?: string;
  role: 'recruiter' | 'headhunter' | 'hiring_manager' | 'peer' | 'other';
  searchFirmName?: string; // For headhunter role
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
  const [optimizing, setOptimizing] = useState<string | null>(null); // personId being optimized
  const [editingPerson, setEditingPerson] = useState<{id: string, name: string, currentText: string} | null>(null);
  
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
  
  const updatePersonLinkedInText = async (personId: string, newText: string) => {
    setError(null);
    try {
      console.log(`📝 Updating LinkedIn text for person ${personId}...`);
      
      const res = await fetch(`/api/jobs/${jobId}/people/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId, rawText: newText, isOptimized: 0 })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }
      
      console.log('✅ LinkedIn text updated');
      
      // Refresh people list to show updated status
      await loadExistingPeople();
    } catch (error: any) {
      console.error('❌ Update error:', error);
      setError(`Failed to update profile: ${error.message}`);
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
      
      // Refresh people list to show optimized status
      await loadExistingPeople();
    } catch (error: any) {
      console.error('❌ Optimization error:', error);
      setError(`Failed to optimize profile: ${error.message}`);
    } finally {
      setOptimizing(null);
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
            recruiterType: person.role === 'headhunter' ? 'headhunter' : person.role === 'recruiter' ? 'company' : null,
            searchFirmName: person.role === 'headhunter' ? person.searchFirmName : null,
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
      
      // Close modal after successful save
      onClose();
      
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
                {existingPeople.map((person) => {
                  const isOptimized = person.isOptimized === 1;
                  const isOptimizing = optimizing === person.personId;
                  const extracted = isOptimized && person.summary 
                    ? JSON.parse(person.summary) 
                    : null;

                  return (
                    <div 
                      key={person.personId}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {extracted?.name || person.name}
                        </p>
                        {extracted?.currentTitle && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {extracted.currentTitle}
                            {extracted.currentCompany && ` at ${extracted.currentCompany}`}
                          </p>
                        )}
                        {person.title && !extracted && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">{person.title}</p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-cyan-600 dark:text-cyan-400">
                            {person.relType === 'recruiter' ? 'Recruiter' :
                             person.relType === 'hiring_manager' ? 'Hiring Manager' :
                             person.relType === 'peer' ? 'Peer/Panel' :
                             'Other'}
                          </p>
                          
                          {/* Optimization Status */}
                          {!isOptimized && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                              <AlertCircle size={12} />
                              {person.rawText ? 'Not optimized' : 'Needs LinkedIn text'}
                            </span>
                          )}
                          {isOptimized && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <CheckCircle2 size={12} />
                              Optimized
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Optimize Button (only if not optimized) */}
                        {!isOptimized && (
                          <button
                            onClick={() => {
                              // For existing profiles without rawText, show message to add LinkedIn text first
                              if (!person.rawText) {
                                alert(
                                  'This profile needs LinkedIn text to optimize. Please add LinkedIn text when editing the profile, or delete and re-add with the full LinkedIn profile content.'
                                );
                                return;
                              }
                              optimizePerson(person.personId, person.rawText);
                            }}
                            disabled={isOptimizing}
                            className="p-2 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded transition-colors disabled:opacity-50"
                            title={person.rawText ? "Optimize profile (AI extraction)" : "Add LinkedIn text first to optimize"}
                          >
                            {isOptimizing ? (
                              <Loader className="animate-spin" size={16} />
                            ) : (
                              <Zap size={16} className={person.rawText ? "text-cyan-600 dark:text-cyan-400" : "text-gray-400 dark:text-gray-500"} />
                            )}
                          </button>
                        )}

                        {/* Edit LinkedIn Text */}
                        <button
                          onClick={() => {
                            setEditingPerson({
                              id: person.personId,
                              name: person.name,
                              currentText: person.rawText || ''
                            });
                          }}
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="Edit LinkedIn profile text"
                        >
                          <Edit3 size={16} className="text-blue-600 dark:text-blue-400" />
                        </button>

                        {/* View Profile Data (Always Show) */}
                        <button
                          onClick={() => {
                            if (isOptimized && extracted) {
                              // Show extracted data - format nicely
                              const display = `OPTIMIZED PROFILE\n\n` +
                                `Name: ${extracted.name}\n` +
                                `Title: ${extracted.currentTitle || 'N/A'}\n` +
                                `Company: ${extracted.currentCompany || 'N/A'}\n` +
                                `Location: ${extracted.location || 'N/A'}\n\n` +
                                `About:\n${extracted.aboutMe || 'N/A'}\n\n` +
                                `Work: ${extracted.workExperiences?.length || 0} roles\n` +
                                `Education: ${extracted.education?.length || 0} degrees\n` +
                                `Skills: ${extracted.skills?.length || 0} listed\n\n` +
                                `(Full JSON available in console)`;
                              
                              console.log('📋 Full extracted data:', extracted);
                              alert(display);
                            } else if (person.rawText) {
                              // Show raw pasted text
                              const display = `RAW PROFILE DATA\n\n` +
                                `Name: ${person.name}\n` +
                                `Title: ${person.title || 'N/A'}\n\n` +
                                `LinkedIn Text:\n${person.rawText.slice(0, 500)}${person.rawText.length > 500 ? '...\n\n(Truncated - full text in console)' : ''}`;
                              
                              console.log('📋 Full raw text:', person.rawText);
                              alert(display);
                            } else {
                              // No data available
                              alert(
                                `PROFILE: ${person.name}\n\n` +
                                `Title: ${person.title || 'N/A'}\n` +
                                `Role: ${person.relType}\n\n` +
                                `No LinkedIn text available.\n` +
                                `Click the Edit button to add LinkedIn profile text.`
                              );
                            }
                          }}
                          className="p-2 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded transition-colors"
                          title={isOptimized ? "View optimized data" : person.rawText ? "View raw LinkedIn text" : "View profile info"}
                        >
                          <Eye size={16} className="text-cyan-600 dark:text-cyan-400" />
                        </button>
                        
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
                          disabled={isOptimizing}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                          title="Remove from job"
                        >
                          <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                    
                    {/* LinkedIn Profile - Manual Input (MVP) */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                        <span>LinkedIn Profile Text</span>
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-[10px] font-semibold">
                          🔮 Auto-fetch coming in v2
                        </span>
                      </label>
                      <textarea
                        value={person.manualText || ''}
                        onChange={(e) => updatePerson(idx, 'manualText', e.target.value)}
                        placeholder="Paste profile text from LinkedIn (name, title, summary, experience)... Our AI will extract key details."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Tip: Copy profile text from LinkedIn. AI will clean it up automatically.
                      </p>
                    </div>
                    
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
                        <option value="recruiter">Recruiter (Company)</option>
                        <option value="headhunter">Headhunter (Executive Search)</option>
                        <option value="hiring_manager">Hiring Manager</option>
                        <option value="peer">Peer/Panel</option>
                        <option value="other">Other</option>
                      </select>
                      {person.role === 'headhunter' && (
                        <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                          🎯 Executive search firm - we'll tailor interview prep for long-term relationship building
                        </p>
                      )}
                    </div>
                    
                    {/* Search Firm (if headhunter) */}
                    {person.role === 'headhunter' && (
                      <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <label className="block text-xs font-medium text-purple-900 dark:text-purple-100 mb-1">
                          Search Firm Name
                        </label>
                        <select
                          value={(person as any).searchFirmName || ''}
                          onChange={(e) => updatePerson(idx, 'searchFirmName', e.target.value)}
                          className="w-full px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                        >
                          <option value="">Select firm...</option>
                          <option value="Korn Ferry">Korn Ferry</option>
                          <option value="Heidrick & Struggles">Heidrick & Struggles</option>
                          <option value="Egon Zehnder">Egon Zehnder</option>
                          <option value="Spencer Stuart">Spencer Stuart</option>
                          <option value="Russell Reynolds">Russell Reynolds</option>
                          <option value="DHR Global">DHR Global</option>
                          <option value="Boyden">Boyden</option>
                          <option value="other">Other (will extract from profile)</option>
                        </select>
                      </div>
                    )}
                    
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

      {/* Edit LinkedIn Text Modal */}
      {editingPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Edit LinkedIn Profile Text - {editingPerson.name}
              </h3>
              <button
                onClick={() => setEditingPerson(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  LinkedIn Profile Content
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Copy and paste the full LinkedIn profile content here. Include name, title, about section, work experience, education, skills, etc.
                </p>
                <textarea
                  value={editingPerson.currentText}
                  onChange={(e) => setEditingPerson({
                    ...editingPerson,
                    currentText: e.target.value
                  })}
                  placeholder="Paste the complete LinkedIn profile text here..."
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {editingPerson.currentText.length} characters
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingPerson(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (editingPerson.currentText.trim()) {
                      await updatePersonLinkedInText(editingPerson.id, editingPerson.currentText.trim());
                      setEditingPerson(null);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

