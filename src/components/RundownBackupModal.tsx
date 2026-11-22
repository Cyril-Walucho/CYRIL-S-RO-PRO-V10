import React, { useState, useRef } from 'react';
import { RundownItem } from '../types/rundown';
import { formatTime } from '../utils/timeFormat';
import { ProfileStorage, RundownProfile } from '../utils/profileStorage';
import { 
  Download, 
  UploadCloud, 
  FileJson, 
  X, 
  Check, 
  FolderPlus, 
  RotateCcw, 
  Copy, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export interface RundownBackupData {
  app: string;
  format: 'cyril-rundown-backup' | string;
  version: string;
  exportedAt: string;
  title: string;
  plannedStartTime: string;
  googleSheetUrl?: string;
  autoSyncSheet?: boolean;
  syncIntervalSec?: number;
  items: RundownItem[];
  itemCount?: number;
  totalDurationSec?: number;
}

interface RundownBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  plannedStartTime: string;
  googleSheetUrl?: string;
  autoSyncSheet?: boolean;
  syncIntervalSec?: number;
  items: RundownItem[];
  onRestoreCurrentProject: (backup: {
    title: string;
    plannedStartTime: string;
    items: RundownItem[];
    googleSheetUrl?: string;
    autoSyncSheet?: boolean;
    syncIntervalSec?: number;
  }) => void;
  onImportAsNewProject: (newProfile: RundownProfile) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const RundownBackupModal: React.FC<RundownBackupModalProps> = ({
  isOpen,
  onClose,
  title,
  plannedStartTime,
  googleSheetUrl,
  autoSyncSheet,
  syncIntervalSec,
  items,
  onRestoreCurrentProject,
  onImportAsNewProject,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);

  // Import state
  const [pastedJson, setPastedJson] = useState('');
  const [previewBackup, setPreviewBackup] = useState<RundownBackupData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const totalDuration = items.reduce((acc, it) => acc + (it.durationSec || 0), 0);

  // Build the complete backup payload
  const createBackupPayload = (): RundownBackupData => ({
    app: "Cyril's RO PRO V9",
    format: 'cyril-rundown-backup',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    title: title || "Cyril's Rundown Project",
    plannedStartTime: plannedStartTime || '19:00:00',
    googleSheetUrl: googleSheetUrl || '',
    autoSyncSheet: !!autoSyncSheet,
    syncIntervalSec: syncIntervalSec || 15,
    itemCount: items.length,
    totalDurationSec: totalDuration,
    items: items.map(it => ({
      id: it.id,
      segmentNumber: it.segmentNumber,
      title: it.title,
      presenter: it.presenter,
      durationSec: it.durationSec,
      notes: it.notes,
      audioNotes: it.audioNotes || '',
      color: it.color || 'emerald',
      status: 'pending' // reset to pending on backup
    }))
  });

  const handleDownloadBackup = () => {
    const backup = createBackupPayload();
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const cleanTitle = (title || 'rundown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `cyril-rundown-backup-${cleanTitle}-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onShowToast?.('Show backup saved to your device!', 'success');
  };

  const handleCopyBackup = () => {
    const backup = createBackupPayload();
    navigator.clipboard.writeText(JSON.stringify(backup, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShowToast?.('Backup text copied!', 'info');
    });
  };

  const processJsonText = (content: string, sourceName?: string) => {
    setErrorMsg(null);
    setPreviewBackup(null);
    try {
      const parsed = JSON.parse(content);

      // Handle both full backup format and profiles or raw items array
      let finalData: RundownBackupData | null = null;

      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        finalData = {
          app: parsed.app || "Cyril's RO",
          format: 'cyril-rundown-backup',
          version: parsed.version || '1.0',
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          title: parsed.title || sourceName?.replace(/\.[^/.]+$/, '') || 'Restored Show',
          plannedStartTime: parsed.plannedStartTime || '19:00:00',
          googleSheetUrl: parsed.googleSheetUrl || '',
          autoSyncSheet: !!parsed.autoSyncSheet,
          syncIntervalSec: parsed.syncIntervalSec || 15,
          items: parsed.items,
          itemCount: parsed.items.length,
          totalDurationSec: parsed.items.reduce((s: number, it: any) => s + (Number(it.durationSec) || 0), 0)
        };
      } else if (Array.isArray(parsed) && parsed.length > 0) {
        // Raw array of rundown items
        finalData = {
          app: "Cyril's RO",
          format: 'cyril-rundown-backup',
          version: '1.0',
          exportedAt: new Date().toISOString(),
          title: sourceName?.replace(/\.[^/.]+$/, '') || 'Loaded Show',
          plannedStartTime: '19:00:00',
          items: parsed,
          itemCount: parsed.length,
          totalDurationSec: parsed.reduce((s: number, it: any) => s + (Number(it.durationSec) || 0), 0)
        };
      } else if (parsed && Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
        // Multi-profile export format
        const prof = parsed.profiles[0];
        finalData = {
          app: parsed.app || "Cyril's RO",
          format: 'cyril-rundown-backup',
          version: '1.0',
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          title: prof.name || 'Loaded Show',
          plannedStartTime: prof.plannedStartTime || '19:00:00',
          googleSheetUrl: prof.googleSheetUrl,
          autoSyncSheet: prof.autoSyncSheet,
          syncIntervalSec: prof.syncIntervalSec,
          items: prof.items || [],
          itemCount: (prof.items || []).length,
          totalDurationSec: (prof.items || []).reduce((s: number, it: any) => s + (Number(it.durationSec) || 0), 0)
        };
      }

      if (!finalData || finalData.items.length === 0) {
        throw new Error('No schedule items found in this backup file.');
      }

      setPreviewBackup(finalData);
      setImportFileName(sourceName || 'Backup File');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not read this backup file.');
      setPreviewBackup(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setPastedJson(text);
      processJsonText(text, file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBrowseStorage = async () => {
    if (typeof (window as any).showOpenFilePicker === 'function') {
      try {
        const handles = await (window as any).showOpenFilePicker({
          multiple: false,
          types: [{
            description: 'Rundown Backup Files (*.json, *.cyrilro)',
            accept: {
              'application/json': ['.json'],
              'text/plain': ['.json', '.cyrilro', '.txt']
            }
          }]
        });
        if (handles && handles.length > 0) {
          const file = await handles[0].getFile();
          if (file) {
            const text = await file.text();
            setPastedJson(text);
            processJsonText(text, file.name);
            return;
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    fileInputRef.current?.click();
  };

  const handleApplyRestoreCurrent = () => {
    if (!previewBackup) return;
    onRestoreCurrentProject({
      title: previewBackup.title,
      plannedStartTime: previewBackup.plannedStartTime,
      items: previewBackup.items,
      googleSheetUrl: previewBackup.googleSheetUrl,
      autoSyncSheet: previewBackup.autoSyncSheet,
      syncIntervalSec: previewBackup.syncIntervalSec
    });
    onShowToast?.(`Loaded "${previewBackup.title}" with ${previewBackup.items.length} items!`, 'success');
    onClose();
  };

  const handleApplyImportNew = () => {
    if (!previewBackup) return;
    const newProfile: RundownProfile = {
      id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: previewBackup.title,
      description: `Restored from backup on ${new Date().toLocaleDateString()}`,
      category: 'custom',
      plannedStartTime: previewBackup.plannedStartTime,
      items: previewBackup.items,
      googleSheetUrl: previewBackup.googleSheetUrl,
      autoSyncSheet: previewBackup.autoSyncSheet,
      syncIntervalSec: previewBackup.syncIntervalSec,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    onImportAsNewProject(newProfile);
    onShowToast?.(`Saved as new show "${previewBackup.title}"!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Show Backup & Restore</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 text-[10px] font-mono border border-purple-700">
                  Works Offline
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Save a copy of your show to your device or restore a saved backup file
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save Backup</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Restore Backup</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              {/* Current Show Summary Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400">Current Show</span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{title || "Cyril's Rundown"}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-700/60 font-mono text-[11px] font-bold">
                    {items.length} Items
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">Start Time: </span>
                    <span className="text-cyan-300 font-semibold">{plannedStartTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Time: </span>
                    <span className="text-emerald-300 font-semibold">{formatTime(totalDuration, true)}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Saves all item names, speakers, lengths (up to 60:00+), notes, color tags, and sound notes.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  onClick={handleDownloadBackup}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-transform active:scale-95 cursor-pointer shadow-lg shadow-purple-950/40"
                >
                  <Download className="w-4 h-4" />
                  <span>Save Backup File (.json)</span>
                </button>
                <button
                  onClick={handleCopyBackup}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Backup Text'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.cyrilro,application/json,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Browse File or Paste */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-xs">Choose a Backup File</h3>
                    <p className="text-[11px] text-slate-400">
                      Pick a saved backup file (.json) from your phone, tablet, or computer
                    </p>
                  </div>
                  <button
                    onClick={handleBrowseStorage}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md shrink-0 active:scale-95"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Pick File</span>
                  </button>
                </div>

                <div className="border-t border-slate-800 pt-2">
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">
                    Or Paste Saved Backup Text:
                  </label>
                  <textarea
                    rows={3}
                    value={pastedJson}
                    onChange={(e) => {
                      setPastedJson(e.target.value);
                      if (e.target.value.trim()) {
                        processJsonText(e.target.value);
                      }
                    }}
                    placeholder='Paste backup text here {"app":"Cyril&#39;s RO","items":[...]}'
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Error Display */}
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Preview Loaded Backup */}
              {previewBackup && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white text-xs">
                        Ready to Restore: {previewBackup.title}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono text-[10px] border border-emerald-700/50">
                      {previewBackup.items.length} Items
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500">Start Time: </span>
                      <span className="text-cyan-300">{previewBackup.plannedStartTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Time: </span>
                      <span className="text-emerald-300">{formatTime(previewBackup.totalDurationSec || 0, true)}</span>
                    </div>
                  </div>

                  {/* Actions for applying the backup */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleApplyRestoreCurrent}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Load into Current Show</span>
                    </button>
                    <button
                      onClick={handleApplyImportNew}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md active:scale-95"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Save as New Show</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
