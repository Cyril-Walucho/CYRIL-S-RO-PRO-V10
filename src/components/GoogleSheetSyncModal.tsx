import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { parseCSV, csvToRundownItems, getCategoryName } from '../utils/csvParser';
import {
  smartExtractFromFile,
  smartParseFreeText,
  smartParseSpreadsheetRows,
  smartExtractWithGeminiApi,
  sheetTo2DStringArray
} from '../utils/smartRundownExtractor';
import { RundownItem } from '../types/rundown';
import { formatTime } from '../utils/timeFormat';
import { getApiBaseUrl, isApkEnvironment } from '../utils/apiConfig';
import { 
  FileSpreadsheet, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Check, 
  Download, 
  FileText, 
  Layers, 
  FolderOpen, 
  Globe, 
  ClipboardPaste,
  Sparkles,
  Loader2
} from 'lucide-react';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  autoSync: boolean;
  syncIntervalSec: number;
  lastSyncedAt?: number;
  onSaveConfig: (url: string, autoSync: boolean, interval: number, newItems?: RundownItem[]) => void;
  onImportOfflineItems?: (items: RundownItem[], mode: 'replace' | 'append', sourceName?: string) => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  autoSync,
  syncIntervalSec,
  lastSyncedAt,
  onSaveConfig,
  onImportOfflineItems
}) => {
  const isApk = isApkEnvironment();
  // On APK, exclusively allow offline import from local phone storage
  const [activeTab, setActiveTab] = useState<'online' | 'offline'>('offline');

  // Online Sheet State (only used in Web / Cloud browser mode)
  const [sheetUrl, setSheetUrl] = useState(currentUrl || '');
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(autoSync);
  const [intervalSec, setIntervalSec] = useState(syncIntervalSec || 15);
  const [isLoading, setIsLoading] = useState(false);
  const [previewItems, setPreviewItems] = useState<RundownItem[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Offline File State (.xlsx, .xls, .csv, Google Sheet export)
  const [offlineFileName, setOfflineFileName] = useState<string | null>(null);
  const [offlineFileSize, setOfflineFileSize] = useState<string | null>(null);
  const [offlineWorkbook, setOfflineWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const [offlinePreviewItems, setOfflinePreviewItems] = useState<RundownItem[] | null>(null);
  const [offlineImportMode, setOfflineImportMode] = useState<'replace' | 'append'>('replace');
  const [offlineErrorMsg, setOfflineErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [offlineSubTab, setOfflineSubTab] = useState<'browse' | 'paste'>('browse');
  const [pastedContent, setPastedContent] = useState('');
  const [detectedFormatLabel, setDetectedFormatLabel] = useState<string | null>(null);
  const [isSmartLoading, setIsSmartLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isApk) {
      setActiveTab('offline');
    }
  }, [isApk]);

  if (!isOpen) return null;

  // --- OFFLINE / SMART RUNNING ORDER HANDLERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processOfflineFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processOfflineFile(file);
  };

  const handleOpenStoragePicker = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (typeof (window as any).showOpenFilePicker === 'function') {
      try {
        const handles = await (window as any).showOpenFilePicker({
          multiple: false,
          types: [{
            description: 'Any Running Order (.xlsx, .csv, .docx, .txt, .pdf)',
            accept: {
              '*/*': ['.xlsx', '.xls', '.csv', '.tsv', '.ods', '.docx', '.txt', '.md', '.html', '.rtf', '.json', '.pdf', '.png', '.jpg', '.jpeg']
            }
          }]
        });
        if (handles && handles.length > 0) {
          const file = await handles[0].getFile();
          if (file) {
            processOfflineFile(file);
            return;
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processOfflineFile = async (file: File) => {
    setOfflineFileName(file.name);
    setOfflineFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setOfflineErrorMsg(null);
    setOfflinePreviewItems(null);
    setDetectedFormatLabel(null);
    setOfflineWorkbook(null);
    setSheetNames([]);
    setSelectedSheetName('');
    setIsSmartLoading(true);

    try {
      const { result, workbook, sheetNames: wbSheets, selectedSheet } = await smartExtractFromFile(file, {
        apiBaseUrl: isApk ? undefined : getApiBaseUrl()
      });

      if (workbook && wbSheets) {
        setOfflineWorkbook(workbook);
        setSheetNames(wbSheets);
        setSelectedSheetName(selectedSheet || wbSheets[0] || '');
      }

      if (!result.items || result.items.length === 0) {
        setOfflineErrorMsg('Could not find schedule items in this file. Try switching the sheet tab or pasting the text.');
        setOfflinePreviewItems(null);
      } else {
        setOfflinePreviewItems(result.items);
        setDetectedFormatLabel(result.detectedFormat);
        setOfflineErrorMsg(null);
      }
    } catch (err: any) {
      setOfflineErrorMsg(err.message || 'Could not read this file');
    } finally {
      setIsSmartLoading(false);
    }
  };

  const extractSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    try {
      const worksheet = wb.Sheets[sheetName];
      if (!worksheet) {
        throw new Error(`Sheet "${sheetName}" not found in workbook`);
      }

      const stringRows = sheetTo2DStringArray(worksheet, XLSX);
      const res = smartParseSpreadsheetRows(stringRows);

      if (res.items.length === 0) {
        setOfflineErrorMsg(`No valid rundown rows could be found in sheet "${sheetName}".`);
        setOfflinePreviewItems(null);
        setDetectedFormatLabel(null);
      } else {
        setOfflinePreviewItems(res.items);
        setDetectedFormatLabel(res.detectedFormat);
        setOfflineErrorMsg(null);
      }
    } catch (err: any) {
      setOfflineErrorMsg('Error parsing worksheet: ' + err.message);
      setOfflinePreviewItems(null);
    }
  };

  const handleWorksheetChange = (sheetName: string) => {
    setSelectedSheetName(sheetName);
    if (offlineWorkbook) {
      extractSheetData(offlineWorkbook, sheetName);
    }
  };

  const handleParsePastedTable = () => {
    if (!pastedContent.trim()) {
      setOfflineErrorMsg('Please paste any company running order, table, email, or schedule first.');
      return;
    }
    setOfflineErrorMsg(null);
    try {
      const res = smartParseFreeText(pastedContent.trim());
      if (res.items.length === 0) {
        throw new Error('Could not find any items. Include item names and times (or use AI Smart Read online).');
      }
      setOfflineFileName(res.showTitle || 'Extracted-Schedule');
      setOfflineFileSize(`${(pastedContent.length / 1024).toFixed(1)} KB`);
      setOfflinePreviewItems(res.items);
      setDetectedFormatLabel(res.detectedFormat);
      setSheetNames([]);
      setSelectedSheetName('');
    } catch (err: any) {
      setOfflineErrorMsg(err.message || 'Could not read the pasted schedule');
      setOfflinePreviewItems(null);
    }
  };

  const handleAiDeepExtractPaste = async () => {
    if (!pastedContent.trim() || isApk) return;
    setIsSmartLoading(true);
    setOfflineErrorMsg(null);
    try {
      const res = await smartExtractWithGeminiApi(getApiBaseUrl(), { text: pastedContent.trim() });
      setOfflineFileName(res.showTitle || 'Smart-Schedule');
      setOfflineFileSize(`${(pastedContent.length / 1024).toFixed(1)} KB`);
      setOfflinePreviewItems(res.items);
      setDetectedFormatLabel(res.detectedFormat);
    } catch (err: any) {
      setOfflineErrorMsg(err.message || 'Could not read schedule');
    } finally {
      setIsSmartLoading(false);
    }
  };

  const handleApplyOffline = () => {
    if (!offlinePreviewItems || offlinePreviewItems.length === 0) return;

    const sourceName = offlineFileName
      ? `${offlineFileName.replace(/\.[^/.]+$/, '')}${selectedSheetName ? ` - ${selectedSheetName}` : ''}`
      : 'Uploaded Schedule';

    if (onImportOfflineItems) {
      onImportOfflineItems(offlinePreviewItems, offlineImportMode, sourceName);
    } else {
      onSaveConfig('', false, 15, offlinePreviewItems);
    }
    onClose();
  };

  // --- ONLINE GOOGLE SHEET HANDLERS (Web only) ---
  const handleTestAndFetch = async () => {
    if (!sheetUrl.trim()) {
      setErrorMsg('Please enter a Google Sheet URL');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setPreviewItems(null);

    try {
      const baseUrl = getApiBaseUrl();
      let csvText = '';
      let fetchSuccess = false;

      // Direct Google Sheets published CSV fallback
      let directUrl = sheetUrl.trim();
      const idMatch = directUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (idMatch && idMatch[1]) {
        const sheetId = idMatch[1];
        directUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      }
      
      if (baseUrl) {
        try {
          const proxyUrl = `${baseUrl}/api/proxy-sheet?url=${encodeURIComponent(sheetUrl.trim())}`;
          const res = await fetch(proxyUrl);
          if (res.ok) {
            csvText = await res.text();
            fetchSuccess = true;
          }
        } catch {}
      }

      if (!fetchSuccess) {
        const directRes = await fetch(directUrl);
        if (directRes.ok) {
          csvText = await directRes.text();
          fetchSuccess = true;
        } else {
          throw new Error('Failed to fetch Google Sheet online. Verify internet access and share permissions.');
        }
      }

      const rows = parseCSV(csvText);
      const parsed = csvToRundownItems(rows);

      if (parsed.length === 0) {
        throw new Error('No valid rundown rows could be parsed from the sheet.');
      }

      setPreviewItems(parsed);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not connect to Google Sheet online');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyOnline = () => {
    onSaveConfig(sheetUrl.trim(), isAutoSyncEnabled, intervalSec, previewItems || undefined);
    onClose();
  };

  const handleDownloadSampleXlsx = () => {
    const wb = XLSX.utils.book_new();
    const data = [
      ['Segment #', 'Title', 'Category', 'Color Stripe', 'Presenter', 'Duration', 'Notes', 'Audio Note', 'Status'],
      ['01', 'Pre-Show & Countdown VT', 'Intro / Opener', 'cyan', 'AV Tech', '03:00', 'Roll animated countdown', 'Theme music playlist', 'pending'],
      ['02', 'Show Intro & Cold Open', 'Intro / Opener', 'cyan', 'Main Host', '02:00', 'Camera 1 close-up', 'Host mic live', 'pending'],
      ['03', 'Headline Rundown & News', 'Live Content', 'emerald', 'Host & Co-Host', '04:00', 'Studio videowall overview', 'Host & co-host mics', 'pending'],
      ['04', 'Full-Screen Stats Graphic', 'Graphics Item', 'fuchsia', 'Graphics Op', '01:00', 'Full-screen chart & lower-third', 'Host voiceover only', 'pending'],
      ['05', 'Feature Interview & Live Demo', 'Interview / Guest', 'purple', 'Dr. Vance & Host', '08:30', 'Direct HDMI laptop feed on screen 2', 'Guest & host mics + laptop audio', 'pending'],
      ['06', 'Commercial Sponsor Break', 'Commercial / Break', 'amber', 'VT Roll', '01:00', 'Pre-recorded 1080p commercial VT', 'VT audio only', 'pending'],
      ['07', 'Featured Sponsor Read', 'Sponsor / Promo', 'orange', 'Main Host', '01:30', 'Showcase sponsor slide on monitor', 'Host mic + soft bed', 'pending'],
      ['08', 'Live Musical Interlude', 'Music / SFX', 'indigo', 'Musical Guest', '04:00', 'Center stage spotlight; wide camera', 'Acoustic & vocal mics', 'pending'],
      ['09', 'Closing Remarks & Outro', 'Outro / Wrap-Up', 'rose', 'Main Host', '02:30', 'Roll credits scroll; fade to black', 'Host mic + outro music', 'pending']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Broadcast Rundown');
    XLSX.writeFile(wb, 'Google-Sheet-MS-Excel-Rundown-Template.xlsx');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden text-slate-200 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                <span className="truncate">{isApk ? 'Upload Any Schedule' : 'Upload File or Sync Google Sheet'}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-700 shrink-0">
                  {isApk ? 'Works Offline' : 'Auto-Read'}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {isApk
                  ? 'Automatically reads times, item names, speakers & notes from any Excel, CSV, Word, or text schedule'
                  : 'Upload any spreadsheet, Word doc, text list, PDF, or photo — or connect a live Google Sheet'}
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

        {/* Tab Switcher */}
        {!isApk && (
          <div className="px-4 sm:px-5 pt-2.5 pb-1 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-2 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('offline')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'offline'
                  ? 'bg-cyan-600 text-white shadow-md font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Upload File or Paste Text</span>
            </button>

            <button
              onClick={() => setActiveTab('online')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'online'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-300" />
              <span>Live Google Sheet Link</span>
            </button>
          </div>
        )}

        {/* OFFLINE / SMART SCHEDULE READER */}
        {activeTab === 'offline' && (
          <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3.5 sm:space-y-4 text-xs sm:text-sm">
            {/* Sub-mode switcher: Browse File vs Paste Text */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOfflineSubTab('browse')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  offlineSubTab === 'browse'
                    ? 'bg-cyan-950/90 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Pick a File</span>
              </button>
              <button
                type="button"
                onClick={() => setOfflineSubTab('paste')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  offlineSubTab === 'paste'
                    ? 'bg-purple-950/90 border-purple-500 text-purple-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste Any Schedule Text</span>
              </button>
            </div>

            {offlineSubTab === 'browse' ? (
            /* Direct Phone Storage File Picker Button */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/40 scale-[0.99]'
                  : offlineFileName
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : 'border-cyan-500/40 bg-slate-950/60'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-3 text-slate-300">
                <div className="p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-lg">
                  {isSmartLoading ? <Loader2 className="w-9 h-9 text-cyan-400 animate-spin" /> : <FolderOpen className="w-9 h-9 text-cyan-400" />}
                </div>

                {isSmartLoading ? (
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-cyan-300">Reading Your Schedule...</div>
                    <p className="text-xs text-slate-400">Finding items, times, titles, speakers &amp; notes automatically</p>
                  </div>
                ) : offlineFileName ? (
                  <div className="space-y-3">
                    <div className="font-bold text-base text-white flex flex-wrap items-center justify-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <span>{offlineFileName}</span>
                      <span className="text-xs font-mono text-slate-400">({offlineFileSize})</span>
                    </div>
                    {detectedFormatLabel && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700 text-[10px] font-mono text-cyan-300">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>{detectedFormatLabel}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <div className="relative inline-block">
                        <input
                          type="file"
                          accept="*/*,.xlsx,.xls,.xlsm,.csv,.tsv,.ods,.docx,.txt,.md,.html,.rtf,.json,.pdf,image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                          title="Choose a different file from your device"
                        />
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-semibold shadow-sm pointer-events-none"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Pick Another File</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setOfflineFileName(null);
                          setOfflineFileSize(null);
                          setOfflineWorkbook(null);
                          setSheetNames([]);
                          setSelectedSheetName('');
                          setOfflinePreviewItems(null);
                          setOfflineErrorMsg(null);
                          setDetectedFormatLabel(null);
                        }}
                        className="px-3 py-2 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-w-md mx-auto">
                    <div>
                      <div className="font-bold text-base sm:text-lg text-white">
                        Upload Any Running Order or Schedule
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Automatically finds item names, start/end times, lengths, speakers, sound notes &amp; instructions from any file layout.
                      </p>
                    </div>

                    {/* Direct 1-Tap Touch Button */}
                    <div className="relative inline-block w-full">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="*/*,.xlsx,.xls,.xlsm,.csv,.tsv,.ods,.docx,.txt,.md,.html,.rtf,.json,.pdf,image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                        title="Tap to choose any schedule file from your device"
                      />

                      <button
                        type="button"
                        onClick={handleOpenStoragePicker}
                        className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm rounded-xl shadow-2xl border border-emerald-400/40 cursor-pointer active:scale-95 transition-all select-none"
                      >
                        <FolderOpen className="w-6 h-6 text-white shrink-0 pointer-events-none" />
                        <span className="pointer-events-none font-bold uppercase tracking-wide">
                          Choose File From Device
                        </span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400">Works With:</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-cyan-300 border border-slate-800">Excel (.XLSX)</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-emerald-300 border border-slate-800">.CSV</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-blue-300 border border-slate-800">Word (.DOCX)</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-amber-300 border border-slate-800">Text (.TXT)</span>
                      {!isApk && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-purple-300 border border-slate-800">PDF / Photo</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            ) : (
              /* Free-Text / WhatsApp / Email / Word / Table Paste Box */
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-white text-xs sm:text-sm">Paste Any Schedule Text or Table</div>
                    <p className="text-[11px] text-slate-400">Works with WhatsApp/email messages, copied Excel tables, Word docs, or plain lists.</p>
                  </div>
                </div>
                <textarea
                  rows={5}
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  placeholder="Examples it reads automatically:&#10;09:00 - 09:15 | Opening Talk (Dr. Vance) | Main stage [Sound: Mic 1]&#10;1. Countdown Video (3 mins) - AV Team - Play video&#10;Item 3: Panel Q&amp;A - 15m - Speaker: Jane | 2 handheld mics"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleParsePastedTable}
                    className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Read Schedule (Offline)</span>
                  </button>
                  {!isApk && (
                    <button
                      type="button"
                      onClick={handleAiDeepExtractPaste}
                      disabled={isSmartLoading || !pastedContent.trim()}
                      className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      {isSmartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>Smart AI Read</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {offlineErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Could not read file:</p>
                  <p className="text-slate-300 mt-0.5">{offlineErrorMsg}</p>
                </div>
              </div>
            )}

            {/* Multiple Worksheets Selector (for Multi-Tab Excel files) */}
            {sheetNames.length > 1 && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold">Workbook Sheets ({sheetNames.length}):</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Select Sheet Tab:</span>
                  <select
                    value={selectedSheetName}
                    onChange={(e) => handleWorksheetChange(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-cyan-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none font-mono"
                  >
                    {sheetNames.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* How to Load: Replace vs Add to End */}
            {offlinePreviewItems && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-300">How to Load:</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={offlineImportMode === 'replace'}
                      onChange={() => setOfflineImportMode('replace')}
                      className="accent-cyan-500"
                    />
                    <span className="text-white font-medium">Replace current schedule</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={offlineImportMode === 'append'}
                      onChange={() => setOfflineImportMode('append')}
                      className="accent-cyan-500"
                    />
                    <span className="text-slate-300 font-medium">Add to end of current schedule</span>
                  </label>
                </div>
              </div>
            )}

            {/* Preview of Items */}
            {offlinePreviewItems && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Found {offlinePreviewItems.length} items from{' '}
                    <strong className="text-white font-mono">{selectedSheetName || offlineFileName}</strong>:
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Total:{' '}
                    <strong className="text-white">
                      {formatTime(offlinePreviewItems.reduce((acc, it) => acc + it.durationSec, 0))}
                    </strong>
                  </span>
                </div>

                <div className="max-h-52 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/90 divide-y divide-slate-800 text-xs">
                  {offlinePreviewItems.slice(0, 8).map((item, idx) => {
                    const c = item.color || 'emerald';
                    const stripeBg = 
                      c === 'cyan' ? 'bg-cyan-500' :
                      c === 'amber' ? 'bg-amber-500' :
                      c === 'purple' ? 'bg-purple-500' :
                      c === 'blue' ? 'bg-blue-500' :
                      c === 'orange' ? 'bg-orange-500' :
                      c === 'rose' ? 'bg-rose-500' :
                      c === 'fuchsia' ? 'bg-fuchsia-500' :
                      c === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500';

                    return (
                      <div key={idx} className="p-2.5 flex items-start gap-2.5 hover:bg-slate-900/60">
                        {/* Colored Side Stripe */}
                        <div className={`w-1.5 self-stretch rounded-full shrink-0 ${stripeBg}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono text-cyan-400 font-bold">#{item.segmentNumber}</span>
                              <span className="font-medium text-white truncate">{item.title}</span>
                              {item.presenter && (
                                <span className="text-[11px] text-amber-300 truncate">({item.presenter})</span>
                              )}
                            </div>
                            <span className="font-digital text-slate-400 shrink-0 font-bold">
                              {formatTime(item.durationSec)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                              {getCategoryName(item.color)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Color: <strong className="text-slate-200">{item.color || 'emerald'}</strong>
                            </span>
                            {item.audioNotes && (
                              <span className="text-[10px] text-slate-300 truncate max-w-xs">
                                🔊 {item.audioNotes}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <div className="text-[11px] text-slate-400 truncate mt-1">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {offlinePreviewItems.length > 8 && (
                    <div className="p-2 text-center text-slate-500 text-[11px] italic">
                      +{offlinePreviewItems.length - 8} more items
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={handleApplyOffline}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-xl shadow-xl border border-emerald-400/40 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5 text-white" />
                  <span>LOAD {offlinePreviewItems.length} ITEMS INTO SCHEDULE</span>
                </button>
              </div>
            )}

            {/* Template Download Option */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400">Want a sample Excel file to fill in?</span>
              <button
                type="button"
                onClick={handleDownloadSampleXlsx}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-mono border border-slate-700 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download Sample (.XLSX)</span>
              </button>
            </div>
          </div>
        )}

        {/* ONLINE TAB - Only rendered on Web */}
        {!isApk && activeTab === 'online' && (
          <div className="p-5 flex-1 overflow-y-auto space-y-4 text-sm">
            <div className="space-y-3">
              <label className="block text-xs font-mono text-slate-400">Google Sheet Link:</label>
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestAndFetch}
                  disabled={isLoading || !sheetUrl.trim()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  {isLoading ? 'Loading...' : 'Get Sheet'}
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              {previewItems && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs text-emerald-400 font-bold">
                    Found {previewItems.length} items!
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyOnline}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Load into Schedule
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
