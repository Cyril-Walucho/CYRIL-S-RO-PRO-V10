import React, { useState } from 'react';
import { RundownItem } from '../types/rundown';
import { rundownToCSV, SAMPLE_CSV_TEMPLATE, getCategoryName } from '../utils/csvParser';
import {
  smartExtractFromFile,
  smartParseFreeText,
  smartExtractWithGeminiApi
} from '../utils/smartRundownExtractor';
import { getApiBaseUrl, isApkEnvironment } from '../utils/apiConfig';
import { 
  UploadCloud, 
  Download, 
  X, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Palette,
  Sparkles,
  Loader2
} from 'lucide-react';

interface CsvImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: RundownItem[];
  onImportItems: (newItems: RundownItem[]) => void;
}

export const CsvImportExportModal: React.FC<CsvImportExportModalProps> = ({
  isOpen,
  onClose,
  items,
  onImportItems
}) => {
  const isApk = isApkEnvironment();
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [rawText, setRawText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewParsed, setPreviewParsed] = useState<RundownItem[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!isOpen) return null;

  const handleProcessCsvFile = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { result, rawTextPreview } = await smartExtractFromFile(file, {
        apiBaseUrl: isApk ? undefined : getApiBaseUrl()
      });
      if (rawTextPreview) {
        setRawText(rawTextPreview);
      } else {
        setRawText(`Loaded file: ${file.name}`);
      }
      if (!result.items || result.items.length === 0) {
        throw new Error('Could not find any items in this file.');
      }
      setPreviewParsed(result.items);
      setSuccessMsg(`Found ${result.items.length} items (${result.detectedFormat})`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not read this file');
      setPreviewParsed(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    handleProcessCsvFile(file);
  };

  const handleBrowseCsvStorage = async () => {
    if (typeof (window as any).showOpenFilePicker === 'function') {
      try {
        const handles = await (window as any).showOpenFilePicker({
          multiple: false,
          types: [{
            description: 'Any Running Order (.csv, .tsv, .txt, .docx, .xlsx, .json)',
            accept: { '*/*': ['.csv', '.tsv', '.txt', '.md', '.docx', '.xlsx', '.xls', '.json', '.html', '.rtf'] }
          }]
        });
        if (handles && handles.length > 0) {
          const file = await handles[0].getFile();
          if (file) {
            handleProcessCsvFile(file);
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
  };

  const parseAndPreview = (text: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const result = smartParseFreeText(text);
      if (result.items.length === 0) {
        throw new Error('No items found yet. Paste any schedule, table, or list of items and times.');
      }
      setPreviewParsed(result.items);
      setSuccessMsg(`Found ${result.items.length} items (${result.detectedFormat})`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not read the pasted schedule');
      setPreviewParsed(null);
    }
  };

  const handleAiDeepExtract = async () => {
    if (!rawText.trim() || isApk) return;
    setIsAiLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const result = await smartExtractWithGeminiApi(getApiBaseUrl(), { text: rawText });
      if (result.items.length === 0) {
        throw new Error('Could not find any schedule items in the text.');
      }
      setPreviewParsed(result.items);
      setSuccessMsg(`Found ${result.items.length} items (${result.detectedFormat})`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not read schedule');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyImport = () => {
    if (!previewParsed || previewParsed.length === 0) {
      setErrorMsg('No items to import');
      return;
    }
    onImportItems(previewParsed);
    onClose();
  };

  const handleDownloadCsv = () => {
    const csvContent = rundownToCSV(items);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `onair-rundown-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJsonBackup = () => {
    const data = {
      app: "Cyril's RO PRO V9",
      format: 'cyril-rundown-backup',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      items: items
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cyril-rundown-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample-rundown-template-category-and-color.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden text-slate-200 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                <span>Upload &amp; Save Spreadsheet (.CSV)</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-700 shrink-0 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-cyan-400" />
                  Includes Color Tags
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Move schedules between Excel, Google Sheets, and this app with colors &amp; notes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex border-b border-slate-800 bg-slate-950/60 px-4 sm:px-5 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3.5 sm:px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'import'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Upload File or Paste Text
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3.5 sm:px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Save / Download File
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3.5 sm:space-y-4 text-xs sm:text-sm">
          {activeTab === 'import' ? (
            <>
              {/* File Upload Zone */}
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/70 rounded-2xl p-6 text-center bg-slate-950/40 transition-colors">
                <UploadCloud className="w-8 h-8 mx-auto text-sky-400 mb-2" />
                <p className="text-xs font-semibold text-white">
                  Drop a file here, or pick one from your device
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Works with Excel, CSV, Google Sheets, Word (.docx), or any schedule with <span className="text-cyan-300 font-semibold">Type</span>, <span className="text-emerald-300 font-semibold">Color</span> &amp; <span className="text-slate-300 font-semibold">Sound Notes</span>
                </p>
                <div className="relative inline-block mt-3">
                  <input
                    type="file"
                    accept="*/*,.csv,.tsv,.txt,.md,.docx,.xlsx,.xls,.json,.html,.rtf,.pdf,image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    title="Pick a schedule file from your device"
                  />
                  <button
                    type="button"
                    onClick={handleBrowseCsvStorage}
                    className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer select-none active:scale-95"
                  >
                    <UploadCloud className="w-4 h-4 text-white pointer-events-none" />
                    <span className="pointer-events-none">Choose File From Device</span>
                  </button>
                </div>
              </div>

              {/* Quick Category & Color Reference */}
              <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Supported Item Types &amp; Colors:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[10px]">Opening / Intro (cyan)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px]">Main Content / Live (emerald)</span>
                  <span className="px-2 py-0.5 rounded bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-800 text-[10px]">Graphics Item (fuchsia)</span>
                  <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px]">Break / Ad (amber)</span>
                  <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 text-[10px]">Interview / Guest (purple)</span>
                  <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 text-[10px]">Video Clip (blue)</span>
                  <span className="px-2 py-0.5 rounded bg-orange-950/80 text-orange-300 border border-orange-800 text-[10px]">Sponsor / Ad Read (orange)</span>
                  <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 text-[10px]">Closing / End (rose)</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800 text-[10px]">Music / Sound (indigo)</span>
                </div>
              </div>

              {/* Or Paste Schedule Text */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Or Paste Any Schedule Text or Table:
                  </label>
                  <div className="flex items-center gap-2">
                    {!isApk && rawText.trim().length > 10 && (
                      <button
                        type="button"
                        onClick={handleAiDeepExtract}
                        disabled={isAiLoading}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700 text-[10px] font-bold cursor-pointer disabled:opacity-50"
                      >
                        {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-300" />}
                        <span>{isAiLoading ? 'Reading...' : 'Smart AI Read'}</span>
                      </button>
                    )}
                    <button
                      onClick={handleDownloadSample}
                      className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      Download Sample (.CSV)
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    if (e.target.value.trim()) {
                      parseAndPreview(e.target.value);
                    } else {
                      setPreviewParsed(null);
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }
                  }}
                  placeholder="Paste CSV, TSV, Markdown table, or plain schedule lines e.g.:&#10;09:00 - 09:05 | Intro & Open (Host) | Cam 1 direct | Host mic + theme&#10;09:05 - 09:10 | Headline Chart Graphic (Graphics Op) | Full-screen chart | Voiceover only"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Preview items */}
              {previewParsed && (
                <div className="border border-slate-800 rounded-xl bg-slate-950/90 p-3 space-y-1.5">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Found Items:</span>
                    <span className="text-[11px] text-cyan-400 font-mono">{previewParsed.length} Items</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/80 text-xs pr-1">
                    {previewParsed.slice(0, 6).map((it, idx) => {
                      const colorKey = it.color || 'emerald';
                      const stripeBg = 
                        colorKey === 'cyan' ? 'bg-cyan-500' :
                        colorKey === 'amber' ? 'bg-amber-500' :
                        colorKey === 'purple' ? 'bg-purple-500' :
                        colorKey === 'blue' ? 'bg-blue-500' :
                        colorKey === 'orange' ? 'bg-orange-500' :
                        colorKey === 'rose' ? 'bg-rose-500' :
                        colorKey === 'fuchsia' ? 'bg-fuchsia-500' :
                        colorKey === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500';

                      return (
                        <div key={idx} className="py-2 flex items-start gap-2.5 text-slate-300">
                          {/* Colored Side Stripe Preview */}
                          <div className={`w-1.5 self-stretch rounded-full shrink-0 ${stripeBg}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">
                                <strong className="text-cyan-400 font-mono mr-1.5">#{it.segmentNumber}</strong>
                                {it.title} {it.presenter ? `(${it.presenter})` : ''}
                              </span>
                              <span className="font-digital text-slate-400 shrink-0 ml-2">
                                {Math.floor(it.durationSec / 60)}:{String(it.durationSec % 60).padStart(2, '0')}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                {getCategoryName(it.color)}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Color: <span className="font-semibold text-slate-200">{it.color || 'emerald'}</span>
                              </span>
                              {it.audioNotes && (
                                <span className="text-[10px] text-slate-300 truncate max-w-xs">
                                  🔊 {it.audioNotes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {previewParsed.length > 6 && (
                      <div className="pt-2 text-[11px] text-slate-500 text-center italic">
                        +{previewParsed.length - 6} more items ready
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Save / Export Tab */
            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-center space-y-3">
                <FileText className="w-10 h-10 text-cyan-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">
                  Save {items.length} Schedule Items as Spreadsheet
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Download a spreadsheet file with <strong className="text-slate-200">Item Type</strong>, <strong className="text-slate-200">Color</strong>, speakers, times, and sound notes. Opens cleanly in Excel or Google Sheets.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-2.5">
                  <button
                    onClick={handleDownloadCsv}
                    className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Save Spreadsheet (.CSV)</span>
                  </button>
                  <button
                    onClick={handleDownloadJsonBackup}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Save Backup (.JSON)</span>
                  </button>
                  <button
                    onClick={handleDownloadSample}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    <span>Sample File (.CSV)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          {activeTab === 'import' && (
            <button
              onClick={handleApplyImport}
              disabled={!previewParsed || previewParsed.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
            >
              Load into Schedule
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
