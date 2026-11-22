import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Smartphone, 
  X, 
  Download, 
  Check, 
  Copy, 
  ExternalLink, 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  FileCode,
  ShieldCheck,
  Package
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'apk-download' | 'webapk-direct' | 'pwabuilder'>('apk-download');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { isInstallable, install } = usePWAInstall();

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '/';
  const installUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
  const apkDownloadUrl = '/Cyrils-RO.apk';
  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(installUrl)}`;

  useEffect(() => {
    if (isOpen && installUrl) {
      QRCode.toDataURL(installUrl, {
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
  }, [isOpen, installUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(installUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDirectApkDownload = () => {
    setIsDownloading(true);
    const link = document.createElement('a');
    link.href = apkDownloadUrl;
    link.download = 'Cyrils-RO.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden text-slate-200 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                <span>Cyril's RO Android App</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800 shrink-0">
                  .APK Ready
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Android phone app file (.APK) & direct browser install for phones, tablets, and foldables
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
        <div className="shrink-0 flex border-b border-slate-800 bg-slate-950/60 px-4 sm:px-5 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('apk-download')}
            className={`px-3.5 sm:px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'apk-download'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download App (.APK)</span>
          </button>
          <button
            onClick={() => setActiveTab('webapk-direct')}
            className={`px-3.5 sm:px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'webapk-direct'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install via QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`px-3.5 sm:px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pwabuilder'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>App & Offline Info</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3.5 sm:space-y-4 text-xs">
          {activeTab === 'apk-download' ? (
            <div className="space-y-4">
              {/* Primary APK Download Card */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 border-2 border-emerald-500/50 rounded-2xl p-5 shadow-xl space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40">
                      <Package className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        Cyrils-RO.apk
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-cyan-300 border border-slate-700">
                          Latest Build
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700">
                          ~3.0 MB
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Signed Android App Package
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleDirectApkDownload}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4 fill-current" />
                    <span>{isDownloading ? 'Downloading App...' : 'Download .APK File'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-300 border-t border-slate-800 pt-3 space-y-2">
                  <p className="font-semibold text-emerald-400">
                    Install directly on any Android phone, tablet, or foldable:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">&bull;</span>
                      <div>
                        <strong className="text-white">Pick Files From Your Device:</strong> Open <code>.xlsx</code>, <code>.xls</code>, <code>.csv</code>, or text schedules right from Downloads, USB, or Google Drive.
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">&bull;</span>
                      <div>
                        <strong className="text-white">Remembers Your Last Show:</strong> Automatically saves your schedule and brings it right back when you reopen the app.
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2">
                      <span className="text-fuchsia-400 font-bold">&bull;</span>
                      <div>
                        <strong className="text-white">Smart Schedule Reader & Graphics Tag:</strong> Auto-reads item names, speakers, lengths, and notes from any file format, plus Graphics Item color tags.
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2">
                      <span className="text-amber-400 font-bold">&bull;</span>
                      <div>
                        <strong className="text-white">Foldable Split Screen & Touch Reorder:</strong> Split across the fold, tap Swap Sides, and drag items up or down with your finger.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Installation Guide */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>How to Install on Your Android Phone:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed pl-1">
                  <li>
                    Tap the green <strong>"Download .APK File"</strong> button above.
                  </li>
                  <li>
                    Open your phone's <strong>Files</strong> or <strong>Downloads</strong> app and tap <strong className="text-cyan-300 font-mono">Cyrils-RO.apk</strong>.
                  </li>
                  <li>
                    If asked about unknown apps, turn on <strong>Allow installing apps from your browser</strong>.
                  </li>
                  <li>
                    Tap <strong>"Install"</strong> &rarr; <strong>Cyril's Rundown</strong> will appear on your home screen and work offline!
                  </li>
                </ol>
              </div>

              {/* Direct Link */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <span className="text-slate-400">Direct File Link:</span>
                <a
                  href={apkDownloadUrl}
                  download="Cyrils-RO.apk"
                  className="text-cyan-400 hover:underline font-mono truncate max-w-xs"
                >
                  /Cyrils-RO.apk
                </a>
              </div>
            </div>
          ) : activeTab === 'webapk-direct' ? (
            <div className="space-y-4">
              {/* Native 1-Tap Browser Prompt if supported */}
              {isInstallable && (
                <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Quick Browser Install Ready!</span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      Your browser can install this app directly onto your phone so it opens full screen and works offline.
                    </p>
                  </div>
                  <button
                    onClick={install}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
                  >
                    Install Now
                  </button>
                </div>
              )}

              {/* QR Code and Mobile Link Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-5">
                <div className="bg-white p-3 rounded-xl shrink-0 shadow-lg flex flex-col items-center">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="Scan QR Code to open on Android phone" className="w-36 h-36" />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-slate-500">
                      Creating QR Code...
                    </div>
                  )}
                  <span className="text-[10px] text-slate-900 font-bold mt-1 uppercase tracking-wider">
                    Scan with Phone Camera
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>Scan to Install on Your Phone:</span>
                  </div>

                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                    <li>
                      Point your phone camera at the QR code (or copy the link below and open it in <strong>Chrome</strong>).
                    </li>
                    <li>
                      Tap the <strong>"Install Cyril's Rundown"</strong> banner or browser menu <strong className="text-white">(&#8942;) &rarr; "Install app"</strong>.
                    </li>
                    <li>
                      The <strong>Cyril's Rundown</strong> app icon will be added directly to your home screen!
                    </li>
                  </ol>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={installUrl}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-cyan-300 select-all focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* App & Offline info tab */
            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm">
                    App & Offline Details
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400">App Name: </span>
                    <strong className="text-white">Cyril Walucho's Rundown Live Free</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Short Name: </span>
                    <strong className="text-cyan-300">Cyril's Rundown</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Screen View: </span>
                    <strong className="text-white">Full Screen App</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Offline Mode: </span>
                    <strong className="text-emerald-400">Ready (Works Without Internet)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Theme Color: </span>
                    <strong className="text-white">#090d16</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Screen Fit: </span>
                    <strong className="text-white">Phone, Tablet & Foldable Split</strong>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <a
                    href="/manifest.json"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View /manifest.json</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <span>Check on PWABuilder</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDirectApkDownload}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download .APK Now</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
