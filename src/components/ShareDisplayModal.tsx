import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Tv, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  QrCode, 
  Eye, 
  FileText, 
  Zap, 
  Clock, 
  ShieldCheck,
  Radio
} from 'lucide-react';

import { getPublicShareBaseUrl } from '../utils/apiConfig';

interface ShareDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export const ShareDisplayModal: React.FC<ShareDisplayModalProps> = ({
  isOpen,
  onClose,
  sessionId
}) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const shareBase = getPublicShareBaseUrl();
  const shareableUrl = `${shareBase}/?session=${encodeURIComponent(sessionId)}&mode=talent`;

  useEffect(() => {
    if (isOpen && shareableUrl) {
      QRCode.toDataURL(shareableUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(() => {});
    }
  }, [isOpen, shareableUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenDirectly = () => {
    window.open(shareableUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden text-slate-100 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-purple-950 text-purple-400 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.3)] shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                  Share Stage Timer Link
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 text-[10px] font-mono border border-purple-700 shrink-0">
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Share a live screen for speakers, crew, and stage monitors.
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

        {/* Modal Body */}
        <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3.5 sm:space-y-4">
          {/* URL Box & 1-Click Copy */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
              View-Only Stage Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 truncate shadow-inner">
                {shareableUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* QR Code and Quick Preview Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-lg border border-slate-800">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Stage Screen QR Code"
                  className="w-36 h-36 rounded shadow-md border border-slate-700"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center bg-slate-800 rounded text-slate-400">
                  <QrCode className="w-10 h-10 animate-pulse" />
                </div>
              )}
              <span className="text-[10px] font-mono text-slate-400 mt-2 text-center">
                Scan with any phone or tablet to open right away
              </span>
            </div>

            {/* What Viewers Will See */}
            <div className="space-y-2 text-xs">
              <span className="font-mono font-bold text-cyan-300 uppercase block text-[11px]">
                What they will see:
              </span>
              <ul className="space-y-1.5 text-slate-300">
                <li className="flex items-start gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Big live countdown timer and extra time warnings</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Current item name, speaker, and instructions</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                  <span>Item notes and sound notes</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Screen flash alerts when you tap Flash</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>View-only screen: viewers cannot change your schedule</span>
                </li>
              </ul>

              <button
                onClick={handleOpenDirectly}
                className="mt-3 w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                <span>Open in New Tab</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>LIVE SYNC ACROSS DEVICES</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
