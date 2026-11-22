import React, { useState } from 'react';
import { 
  RundownProfile, 
  ProfileCategory, 
  CATEGORY_LABELS, 
  DEFAULT_PROFILES, 
  ProfileStorage 
} from '../utils/profileStorage';
import { formatTime } from '../utils/timeFormat';
import { 
  FolderKanban, 
  Plus, 
  Copy, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  Check, 
  X, 
  Search, 
  Radio, 
  Calendar, 
  Clock, 
  ListOrdered, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

interface ProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: RundownProfile[];
  activeProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onProfilesUpdated: (updatedList: RundownProfile[]) => void;
}

export const ProfilesModal: React.FC<ProfilesModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onProfilesUpdated
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // New Profile Form State
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [newProfileCategory, setNewProfileCategory] = useState<ProfileCategory>('broadcast');
  const [newProfileStartTime, setNewProfileStartTime] = useState('19:00:00');
  const [starterTemplate, setStarterTemplate] = useState<'empty' | 'current' | 'preset'>('current');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEFAULT_PROFILES[0].id);

  // Edit Profile Form State
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState<ProfileCategory>('broadcast');
  const [editStartTime, setEditStartTime] = useState('19:00:00');

  // Status message
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Filter profiles
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStartCreate = () => {
    setNewProfileName('');
    setNewProfileDesc('');
    setNewProfileCategory('broadcast');
    const now = new Date();
    setNewProfileStartTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`);
    setStarterTemplate('current');
    setIsCreatingNew(true);
    setEditingProfileId(null);
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) {
      showFeedback('Please enter a show name', 'error');
      return;
    }

    let itemsToUse = [];
    if (starterTemplate === 'current') {
      const active = profiles.find(p => p.id === activeProfileId);
      itemsToUse = active ? JSON.parse(JSON.stringify(active.items)) : [];
    } else if (starterTemplate === 'preset') {
      const preset = DEFAULT_PROFILES.find(p => p.id === selectedPresetId);
      itemsToUse = preset ? JSON.parse(JSON.stringify(preset.items)) : [];
    } else {
      itemsToUse = [
        {
          id: `item-${Date.now()}-1`,
          segmentNumber: '01',
          title: 'Opening Item',
          presenter: 'Host',
          durationSec: 180,
          notes: 'Opening remarks',
          audioNotes: 'Host mic on',
          status: 'pending' as const
        }
      ];
    }

    // Reset all item statuses to pending
    itemsToUse = itemsToUse.map((it: any) => ({ ...it, status: 'pending' }));

    const created = ProfileStorage.createProfile({
      name: newProfileName.trim(),
      description: newProfileDesc.trim(),
      category: newProfileCategory,
      plannedStartTime: newProfileStartTime,
      items: itemsToUse
    });

    const updatedList = ProfileStorage.getProfiles();
    onProfilesUpdated(updatedList);
    onSelectProfile(created.id);
    setIsCreatingNew(false);
    showFeedback(`Created and opened "${created.name}"`);
  };

  const handleStartEdit = (profile: RundownProfile) => {
    setEditingProfileId(profile.id);
    setEditName(profile.name);
    setEditDesc(profile.description || '');
    setEditCategory(profile.category);
    setEditStartTime(profile.plannedStartTime || '19:00:00');
    setIsCreatingNew(false);
  };

  const handleSaveEdit = () => {
    if (!editingProfileId) return;
    const target = profiles.find(p => p.id === editingProfileId);
    if (!target) return;

    const updatedProfile: RundownProfile = {
      ...target,
      name: editName.trim() || target.name,
      description: editDesc.trim(),
      category: editCategory,
      plannedStartTime: editStartTime,
      updatedAt: Date.now()
    };

    const nextList = ProfileStorage.upsertProfile(updatedProfile);
    onProfilesUpdated(nextList);
    setEditingProfileId(null);
    showFeedback(`Saved changes to "${updatedProfile.name}"`);
  };

  const handleDuplicate = (profileId: string) => {
    const duplicated = ProfileStorage.duplicateProfile(profileId);
    if (duplicated) {
      const nextList = ProfileStorage.getProfiles();
      onProfilesUpdated(nextList);
      showFeedback(`Copied show: "${duplicated.name}"`);
    }
  };

  const handleDelete = (profileId: string, profileName: string) => {
    if (profiles.length <= 1) {
      showFeedback('You must keep at least one show', 'error');
      return;
    }
    if (confirm(`Delete show "${profileName}"? You cannot undo this.`)) {
      const res = ProfileStorage.deleteProfile(profileId);
      if (res.success) {
        const nextList = ProfileStorage.getProfiles();
        onProfilesUpdated(nextList);
        if (res.nextActiveId) {
          onSelectProfile(res.nextActiveId);
        }
        showFeedback(`Deleted "${profileName}"`);
      }
    }
  };

  const handleExportSingle = (profile: RundownProfile) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${profile.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-rundown.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showFeedback(`Saved "${profile.name}" backup file`);
  };

  const handleExportAll = () => {
    const jsonStr = ProfileStorage.exportProfilesAsJson();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cyril-rundown-all-shows-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showFeedback('Saved backup file for all shows');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const res = ProfileStorage.importProfilesFromJson(content);
          if (res.success) {
            const nextList = ProfileStorage.getProfiles();
            onProfilesUpdated(nextList);
            showFeedback(`Loaded ${res.count} saved show(s)!`);
          } else {
            showFeedback(res.error || 'Could not open backup file', 'error');
          }
        }
      };
    }
  };

  const calculateProfileTotalDuration = (profile: RundownProfile) => {
    return profile.items.reduce((sum, it) => sum + (it.durationSec || 0), 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden text-slate-100 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.3)] shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Saved Shows &amp; Events
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-700">
                  {profiles.length} Saved
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Works Offline
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Create, switch, and manage separate schedules for different shows, church services, and events.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Show</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMsg && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center justify-between transition-all ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800'
                : 'bg-rose-950/80 text-rose-300 border-b border-rose-800'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer">&times;</button>
          </div>
        )}

        {/* Create Show Drawer */}
        {isCreatingNew && (
          <div className="bg-slate-950 border-b border-cyan-500/30 p-4 shrink-0 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                CREATE NEW SHOW / EVENT
              </span>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 font-medium">Show Name</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Sunday Morning Worship, Keynote, Podcast #55"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Event Type</label>
                <select
                  value={newProfileCategory}
                  onChange={(e) => setNewProfileCategory(e.target.value as ProfileCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="broadcast">TV / Live Show</option>
                  <option value="church">Worship / Church</option>
                  <option value="conference">Conference / Talk</option>
                  <option value="podcast">Live Podcast</option>
                  <option value="sports">Sports / Gaming</option>
                  <option value="custom">Custom Event</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 font-medium">Notes (Optional)</label>
                <input
                  type="text"
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                  placeholder="Short notes about this show..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Start Time</label>
                <input
                  type="text"
                  value={newProfileStartTime}
                  onChange={(e) => setNewProfileStartTime(e.target.value)}
                  placeholder="19:00:00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-3 pt-1 border-t border-slate-800">
                <label className="block text-slate-400 mb-1.5 font-medium">How to Start</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStarterTemplate('current')}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      starterTemplate === 'current'
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold">Copy Current Show</div>
                    <div className="text-[10px] text-slate-400">Reuse items from the show open now</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStarterTemplate('preset')}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      starterTemplate === 'preset'
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold">Use a Template</div>
                    <div className="text-[10px] text-slate-400">Pick from Church, Talk, Podcast, Sports</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStarterTemplate('empty')}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      starterTemplate === 'empty'
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold">Start Empty</div>
                    <div className="text-[10px] text-slate-400">Start clean with 1 item</div>
                  </button>
                </div>

                {starterTemplate === 'preset' && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {DEFAULT_PROFILES.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedPresetId(preset.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                          selectedPresetId === preset.id
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 font-bold'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateProfile}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
              >
                Create &amp; Open Show
              </button>
            </div>
          </div>
        )}

        {/* Edit Show Drawer */}
        {editingProfileId && (
          <div className="bg-slate-950 border-b border-amber-500/40 p-4 shrink-0 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-400" />
                EDIT SHOW DETAILS
              </span>
              <button
                onClick={() => setEditingProfileId(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 font-medium">Show Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Event Type</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as ProfileCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="broadcast">TV / Live Show</option>
                  <option value="church">Worship / Church</option>
                  <option value="conference">Conference / Talk</option>
                  <option value="podcast">Live Podcast</option>
                  <option value="sports">Sports / Gaming</option>
                  <option value="custom">Custom Event</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 font-medium">Notes</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Start Time</label>
                <input
                  type="text"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingProfileId(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Toolbar: Search, Filters, Backup */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shows &amp; events..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              All ({profiles.length})
            </button>
            {(Object.keys(CATEGORY_LABELS) as ProfileCategory[]).map(cat => {
              const info = CATEGORY_LABELS[cat];
              const count = profiles.filter(p => p.category === cat).length;
              if (count === 0 && selectedCategory !== cat) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? `${info.bg} ${info.color} ${info.border} border font-bold`
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {info.label.split(' ')[0]} ({count})
                </button>
              );
            })}
          </div>

          {/* Backup Buttons */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <label className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
            <button
              onClick={handleExportAll}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 cursor-pointer transition-colors"
              title="Save backup of all shows"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Save All</span>
            </button>
          </div>
        </div>

        {/* Shows List */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-4 space-y-3">
          {filteredProfiles.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <FolderKanban className="w-10 h-10 mx-auto mb-2 opacity-30 text-cyan-400" />
              <p className="text-sm font-semibold text-slate-400">No shows found</p>
              <p className="text-xs mt-1">Try a different search or filter</p>
            </div>
          ) : (
            filteredProfiles.map(profile => {
              const isActive = profile.id === activeProfileId;
              const catInfo = CATEGORY_LABELS[profile.category] || CATEGORY_LABELS.custom;
              const totalSec = calculateProfileTotalDuration(profile);
              const itemCount = profile.items.length;

              return (
                <div
                  key={profile.id}
                  className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-slate-950/90 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Left Side: Profile Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {isActive && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-mono font-black tracking-wider uppercase shadow-[0_0_10px_#10b981]">
                          <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                          ACTIVE LIVE
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${catInfo.bg} ${catInfo.color} ${catInfo.border}`}>
                        {catInfo.label}
                      </span>

                      <h3 className="text-sm sm:text-base font-bold text-white truncate">
                        {profile.name}
                      </h3>
                    </div>

                    {profile.description && (
                      <p className="text-xs text-slate-400 line-clamp-1 mb-1.5">
                        {profile.description}
                      </p>
                    )}

                    {/* Stats Bar */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
                      <div className="flex items-center gap-1">
                        <ListOrdered className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{itemCount} Items</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Total: <strong className="text-slate-200">{formatTime(totalSec, true)}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        <span>Starts: <strong className="text-slate-200">{profile.plannedStartTime}</strong></span>
                      </div>
                      {profile.googleSheetUrl && (
                        <span className="text-emerald-400 text-[10px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/50">
                          Sheet Linked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {!isActive ? (
                      <button
                        onClick={() => {
                          onSelectProfile(profile.id);
                          showFeedback(`Opened show: "${profile.name}"`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md active:scale-95 flex items-center gap-1"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Open</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Open Now</span>
                      </span>
                    )}

                    <button
                      onClick={() => handleDuplicate(profile.id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                      title="Copy show"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleStartEdit(profile)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                      title="Edit show name & details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleExportSingle(profile)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                      title="Save backup of this show"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(profile.id, profile.name)}
                      disabled={profiles.length <= 1}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 disabled:opacity-20 cursor-pointer transition-colors"
                      title="Delete show"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-emerald-400 font-bold">&bull; SAVED ON YOUR DEVICE</span>
            <span>All shows work offline anytime</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
