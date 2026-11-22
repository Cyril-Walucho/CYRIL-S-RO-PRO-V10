import re

# 1. Patch App.tsx
with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace relative API calls with getApiBaseUrl
content = re.sub(r'fetch\([\'"`]/api/([^\'"`]+)[\'"`]', r'fetch(`${getApiBaseUrl()}/api/\1`', content)
content = re.sub(r'new EventSource\([\'"`]/api/([^\'"`]+)[\'"`]', r'new EventSource(`${getApiBaseUrl()}/api/\1`', content)

# Update renderRundownComponent definition
content = re.sub(
    r'const renderRundownComponent = \(\) => \(',
    r'const renderRundownComponent = (isSplitMode: boolean = false) => (',
    content
)

# Pass isSplitMode prop into RundownView inside renderRundownComponent
if 'isSplitMode={isSplitMode}' not in content:
    content = content.replace(
        'onOpenShareDisplayModal={() => setIsShareDisplayModalOpen(true)}\n    />',
        'onOpenShareDisplayModal={() => setIsShareDisplayModalOpen(true)}\n      isSplitMode={isSplitMode}\n    />'
    )

# In split/foldable calls, pass true
content = content.replace('swapHalves ? renderRundownComponent() : renderTimerComponent(false, true)', 'swapHalves ? renderRundownComponent(true) : renderTimerComponent(false, true)')
content = content.replace('swapHalves ? renderTimerComponent(false, true) : renderRundownComponent()', 'swapHalves ? renderTimerComponent(false, true) : renderRundownComponent(true)')
content = content.replace('swapHalves ? renderTimerComponent(false) : renderRundownComponent()', 'swapHalves ? renderTimerComponent(false) : renderRundownComponent(true)')
content = content.replace('swapHalves ? renderRundownComponent() : renderTimerComponent(false)', 'swapHalves ? renderRundownComponent(true) : renderTimerComponent(false)')

# In split tab (landscape and portrait):
content = content.replace(
    'style={{ width: `${splitRatio}%` }}\n              >\n                {renderRundownComponent()}',
    'style={{ width: `${splitRatio}%` }}\n              >\n                {renderRundownComponent(true)}'
)
content = content.replace(
    'w-full overflow-hidden border-b border-slate-800">\n                {renderRundownComponent()}',
    'w-full overflow-hidden border-b border-slate-800">\n                {renderRundownComponent(true)}'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print('Successfully patched src/App.tsx')
