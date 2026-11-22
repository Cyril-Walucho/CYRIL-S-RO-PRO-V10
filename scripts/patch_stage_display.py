import re

# 1. Patch TalentStageDisplay.tsx
with open('src/components/TalentStageDisplay.tsx', 'r') as f:
    code = f.read()

# Define nextItem1 and nextItem2
code = code.replace(
    "  const nextItem: RundownItem | undefined = items[timer.activeItemIndex + 1];",
    "  const nextItem1: RundownItem | undefined = items[timer.activeItemIndex + 1];\n  const nextItem2: RundownItem | undefined = items[timer.activeItemIndex + 2];"
)

# Increase size of segment number and presenter in header
old_segment_header = """        {/* Current Segment Title & Presenter */}
        <div className="text-center w-full max-w-4xl px-2 shrink-0 mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/40 text-xs sm:text-sm font-mono tracking-wider uppercase mb-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-300">SEGMENT {currentItem ? currentItem.segmentNumber : '01'}</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 font-bold">{currentItem?.presenter || 'All Talent'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-white line-clamp-2">
            {currentItem?.title || 'No Active Segment'}
          </h1>
        </div>"""

new_segment_header = """        {/* Current Segment Title, Large Segment Number & Presenter */}
        <div className="text-center w-full max-w-5xl px-2 shrink-0 mb-2">
          {/* Large Segment Number and Presenter Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 mb-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-slate-900/90 border-2 border-cyan-400/70 shadow-lg">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
              <span className="text-white font-mono font-black text-base sm:text-2xl md:text-3xl tracking-wider">
                SEGMENT {currentItem ? currentItem.segmentNumber : '01'}
              </span>
            </div>

            {currentItem?.presenter ? (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-amber-950/80 border-2 border-amber-500/70 shadow-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-amber-300 font-display font-extrabold text-sm sm:text-xl md:text-2xl tracking-wide truncate max-w-xs sm:max-w-md">
                  {currentItem.presenter}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-400 font-mono text-xs sm:text-sm">
                <span>Presenter: All Talent</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-white line-clamp-2">
            {currentItem?.title || 'No Active Segment'}
          </h1>
        </div>"""

code = code.replace(old_segment_header, new_segment_header)

# Replace single Up Next with the NEXT TWO segments at bottom
old_bottom = """      {/* Up Next Footer Bar */}
      <div className="w-full max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-600/50 text-[10px] font-mono font-bold uppercase shrink-0">
            UP NEXT
          </span>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-slate-100 truncate">
              {nextItem ? nextItem.title : 'End of Show'}
            </div>
            {nextItem?.presenter && (
              <div className="text-[11px] text-slate-400 truncate">
                {nextItem.presenter} {nextItem.audioNotes ? `• Audio: ${nextItem.audioNotes}` : ''}
              </div>
            )}
          </div>
        </div>

        {nextItem && (
          <div className="font-digital text-sm sm:text-base font-bold text-cyan-300 ml-2 shrink-0">
            {formatTime(nextItem.durationSec)}
          </div>
        )}
      </div>"""

new_bottom = """      {/* Next TWO Segments Displayed at Bottom */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-2 shrink-0">
        {/* Next Segment 1: UP NEXT */}
        <div className="bg-slate-900/95 border-2 border-amber-500/50 rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-black text-[11px] sm:text-xs font-mono font-black uppercase tracking-wider shrink-0 shadow-sm">
              UP NEXT
            </span>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                <span className="font-mono text-cyan-400 font-extrabold">#{nextItem1 ? nextItem1.segmentNumber : '--'}</span>
                <span className="truncate">{nextItem1 ? nextItem1.title : 'End of Rundown'}</span>
              </div>
              {nextItem1?.presenter && (
                <div className="text-[11px] text-amber-300 font-semibold truncate">
                  {nextItem1.presenter}
                </div>
              )}
            </div>
          </div>

          {nextItem1 && (
            <div className="font-digital text-sm sm:text-base font-bold text-amber-300 ml-2 shrink-0">
              {formatTime(nextItem1.durationSec)}
            </div>
          )}
        </div>

        {/* Next Segment 2: FOLLOWING UP */}
        <div className="bg-slate-900/90 border border-slate-700/90 rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider shrink-0">
              FOLLOWING
            </span>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-semibold text-slate-200 truncate flex items-center gap-1.5">
                <span className="font-mono text-cyan-400 font-bold">#{nextItem2 ? nextItem2.segmentNumber : '--'}</span>
                <span className="truncate">{nextItem2 ? nextItem2.title : 'Show Complete'}</span>
              </div>
              {nextItem2?.presenter && (
                <div className="text-[11px] text-slate-400 truncate">
                  {nextItem2.presenter}
                </div>
              )}
            </div>
          </div>

          {nextItem2 && (
            <div className="font-digital text-sm sm:text-base font-bold text-slate-300 ml-2 shrink-0">
              {formatTime(nextItem2.durationSec)}
            </div>
          )}
        </div>
      </div>"""

code = code.replace(old_bottom, new_bottom)

with open('src/components/TalentStageDisplay.tsx', 'w') as f:
    f.write(code)

print('TalentStageDisplay.tsx patched successfully!')

# 2. Patch TimerView.tsx for Stage Mode next two segments & bigger presenter/segment number
with open('src/components/TimerView.tsx', 'r') as f:
    tcode = f.read()

# Define nextItem1 and nextItem2 in TimerView
tcode = tcode.replace(
    "  const nextItem: RundownItem | undefined = items[timer.activeItemIndex + 1];",
    "  const nextItem1: RundownItem | undefined = items[timer.activeItemIndex + 1];\n  const nextItem2: RundownItem | undefined = items[timer.activeItemIndex + 2];\n  const nextItem = nextItem1;"
)

# Replace single Up Next in TimerView with the next two segments
old_up_next_timer = """        {/* Up Next Bar */}
        <div className="w-full max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 mt-1.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30 shrink-0">
              UP NEXT
            </span>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                {nextItem ? nextItem.title : 'End of Rundown'}
              </div>
              {nextItem?.presenter && (
                <div className="text-[11px] text-slate-400 truncate">
                  {nextItem.presenter}
                </div>
              )}
              {nextItem?.audioNotes && (
                <div className="text-[11px] text-indigo-400 flex items-center gap-1 truncate mt-0.5">
                  <Headphones className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-indigo-300">Audio:</span>
                  <span className="truncate">{nextItem.audioNotes}</span>
                </div>
              )}
            </div>
          </div>
          {nextItem && (
            <div className="text-right shrink-0 font-digital text-sm font-bold text-slate-300 ml-2">
              {formatTime(nextItem.durationSec)}
            </div>
          )}
        </div>"""

new_up_next_timer = """        {/* Next TWO Segments at Bottom */}
        <div className="w-full max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5 shrink-0">
          {/* Up Next 1 */}
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-mono font-black uppercase shrink-0">
                UP NEXT
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-100 truncate flex items-center gap-1">
                  <span className="font-mono text-cyan-400 text-[10px]">#{nextItem1?.segmentNumber || '--'}</span>
                  <span className="truncate">{nextItem1 ? nextItem1.title : 'End of Rundown'}</span>
                </div>
                {nextItem1?.presenter && (
                  <div className="text-[10px] text-amber-300 truncate font-semibold">
                    {nextItem1.presenter}
                  </div>
                )}
              </div>
            </div>
            {nextItem1 && (
              <div className="text-right shrink-0 font-digital text-xs font-bold text-amber-300 ml-1.5">
                {formatTime(nextItem1.durationSec)}
              </div>
            )}
          </div>

          {/* Following Up 2 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-mono font-bold uppercase shrink-0">
                FOLLOWING
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-300 truncate flex items-center gap-1">
                  <span className="font-mono text-cyan-400 text-[10px]">#{nextItem2?.segmentNumber || '--'}</span>
                  <span className="truncate">{nextItem2 ? nextItem2.title : 'Show Complete'}</span>
                </div>
                {nextItem2?.presenter && (
                  <div className="text-[10px] text-slate-400 truncate">
                    {nextItem2.presenter}
                  </div>
                )}
              </div>
            </div>
            {nextItem2 && (
              <div className="text-right shrink-0 font-digital text-xs font-bold text-slate-400 ml-1.5">
                {formatTime(nextItem2.durationSec)}
              </div>
            )}
          </div>
        </div>"""

tcode = tcode.replace(old_up_next_timer, new_up_next_timer)

# Increase presenter and segment size in TimerView top area when in stageMode
old_timerview_header = """          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
            <span className="font-mono text-xs text-slate-400 shrink-0">
              SEG {currentItem ? currentItem.segmentNumber : '01'}
            </span>
            <span className="text-slate-600 hidden xs:inline">|</span>
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              {currentItem ? currentItem.title : 'No Active Segment'}
            </h2>
            {currentItem?.presenter && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-800 text-xs text-amber-300 shrink-0 border border-slate-700">
                {currentItem.presenter}
              </span>
            )}
          </div>"""

new_timerview_header = """          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
            <span className="font-mono text-sm sm:text-base font-black text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-cyan-500/40 shrink-0">
              SEG {currentItem ? currentItem.segmentNumber : '01'}
            </span>
            <h2 className="text-sm sm:text-lg font-black text-white truncate">
              {currentItem ? currentItem.title : 'No Active Segment'}
            </h2>
            {currentItem?.presenter && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-950/80 text-xs sm:text-sm font-bold text-amber-300 shrink-0 border border-amber-600/50 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{currentItem.presenter}</span>
              </span>
            )}
          </div>"""

tcode = tcode.replace(old_timerview_header, new_timerview_header)

with open('src/components/TimerView.tsx', 'w') as f:
    f.write(tcode)

print('TimerView.tsx patched successfully!')
