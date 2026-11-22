import re

with open('src/components/AndroidFrame.tsx', 'r') as f:
    code = f.read()

# 1. Add theme state and persistence
theme_init = """  const [deviceFrameMode, setDeviceFrameMode] = useState<'none' | 'foldable' | 'tablet'>('none');
  const [theme, setTheme] = useState<'slate' | 'oled'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('cyril_ro_theme') as 'slate' | 'oled') || 'slate';
    }
    return 'slate';
  });

  const toggleTheme = (newTheme: 'slate' | 'oled') => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cyril_ro_theme', newTheme);
      if (newTheme === 'oled') {
        document.documentElement.classList.add('theme-oled');
        document.body.classList.add('bg-black');
      } else {
        document.documentElement.classList.remove('theme-oled');
        document.body.classList.remove('bg-black');
      }
    }
  };

  useEffect(() => {
    if (theme === 'oled') {
      document.documentElement.classList.add('theme-oled');
      document.body.classList.add('bg-black');
    } else {
      document.documentElement.classList.remove('theme-oled');
      document.body.classList.remove('bg-black');
    }
  }, [theme]);"""

code = code.replace(
    "  const [deviceFrameMode, setDeviceFrameMode] = useState<'none' | 'foldable' | 'tablet'>('none');",
    theme_init
)

# 2. Add isFullscreen state to track fullscreen status
fullscreen_tracker = """  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);"""

code = code.replace(
    "  const [clockTime, setClockTime] = useState(getCurrentTimeOfDay().slice(0, 5));",
    fullscreen_tracker + "\n  const [clockTime, setClockTime] = useState(getCurrentTimeOfDay().slice(0, 5));"
)

# 3. Add Fullscreen & OLED Theme Toggle in Header
header_buttons = """          {/* Main Header Fullscreen Toggle Button */}
          <button
            onClick={handleFullscreenBrowser}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer flex items-center justify-center active:scale-95 shrink-0"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Mode"}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            )}
          </button>

          {/* Quick Theme Toggle Button (Slate vs True Black OLED) */}
          <button
            onClick={() => toggleTheme(theme === 'oled' ? 'slate' : 'oled')}
            className={`px-1.5 sm:px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer active:scale-95 flex items-center gap-1 shrink-0 ${
              theme === 'oled'
                ? 'bg-black text-amber-300 border-amber-500/70 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Toggle between Slate dark theme and True Black OLED theme (for AMOLED displays)"
          >
            <span className={`w-2 h-2 rounded-full ${theme === 'oled' ? 'bg-amber-400' : 'bg-slate-500'}`} />
            <span className="text-[10px] sm:text-xs">{theme === 'oled' ? 'OLED' : 'SLATE'}</span>
          </button>"""

code = code.replace(
    "{/* Right Side: Profiles button and Foldable/Split button */}\n        <div className=\"flex items-center gap-1 sm:gap-1.5 shrink-0\">",
    "{/* Right Side: Header Fullscreen, OLED Theme, Profiles, Foldable */}\n        <div className=\"flex items-center gap-1 sm:gap-1.5 shrink-0\">\n" + header_buttons
)

# 4. Add AMOLED OLED Theme Section in Drawer Settings
theme_drawer_section = """            {/* Display & AMOLED OLED Theme Settings Section */}
            <div className="p-4 border-b border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  AMOLED Display Theme
                </span>
                <span className="text-[10px] font-mono text-cyan-300">
                  {theme === 'oled' ? 'True Black (Battery Saver)' : 'Slate Dark'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Switch to True Black OLED for pure 0% power black pixels on AMOLED phone, tablet, and foldable displays.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => toggleTheme('slate')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    theme === 'slate'
                      ? 'bg-slate-900 border-cyan-400 text-white shadow-md ring-1 ring-cyan-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Slate Theme</span>
                    {theme === 'slate' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="w-3 h-3 rounded bg-slate-900 border border-slate-700" />
                    <span className="w-3 h-3 rounded bg-slate-800" />
                    <span className="text-[10px] text-slate-400 font-mono ml-1">#090D16</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleTheme('oled')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    theme === 'oled'
                      ? 'bg-black border-amber-400 text-white shadow-md ring-1 ring-amber-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-300">True OLED Black</span>
                    {theme === 'oled' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="w-3 h-3 rounded bg-black border border-neutral-700" />
                    <span className="w-3 h-3 rounded bg-neutral-900" />
                    <span className="text-[10px] text-amber-300 font-mono ml-1">#000000 0%</span>
                  </div>
                </button>
              </div>
            </div>"""

code = code.replace(
    "{/* Drawer Content */} \n            <div className=\"flex-1 overflow-y-auto divide-y divide-slate-800/60 text-xs\">",
    "{/* Drawer Content */} \n            <div className=\"flex-1 overflow-y-auto divide-y divide-slate-800/60 text-xs\">\n" + theme_drawer_section
)

# Apply dynamic background class for OLED vs Slate
code = code.replace(
    "className=\"h-full w-full bg-slate-950 flex flex-col overflow-hidden text-slate-100\"",
    "className={`h-full w-full ${theme === 'oled' ? 'bg-black' : 'bg-slate-950'} flex flex-col overflow-hidden text-slate-100`}"
)

with open('src/components/AndroidFrame.tsx', 'w') as f:
    f.write(code)

print('AndroidFrame.tsx patched successfully!')
