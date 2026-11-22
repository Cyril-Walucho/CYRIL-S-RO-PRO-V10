# 1. Patch server.ts with CORS middleware
with open('server.ts', 'r') as f:
    server_code = f.read()

cors_mw = '''app.use(express.json({ limit: '10mb' }));

// Enable CORS for all incoming API requests (allows Android APK and external talent displays)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});'''

if "Access-Control-Allow-Origin" not in server_code:
    server_code = server_code.replace("app.use(express.json({ limit: '10mb' }));", cors_mw)
    with open('server.ts', 'w') as f:
        f.write(server_code)
    print('server.ts updated with CORS!')
else:
    print('server.ts already has CORS')

# 2. Patch scripts/build-apk.js to allow full internet access in WebView settings.json
with open('scripts/build-apk.js', 'r') as f:
    apk_script = f.read()

old_match = '''    match: [
      ["host", "equals", "appassets.androidplatform.net"],
      ["host", "contains", "localhost"]
    ],'''

new_match = '''    match: [
      ["scheme", "equals", "https"],
      ["scheme", "equals", "http"],
      ["host", "contains", ""]
    ],'''

if old_match in apk_script:
    apk_script = apk_script.replace(old_match, new_match)

apk_script = apk_script.replace('not_matching: false,', 'not_matching: true,')

with open('scripts/build-apk.js', 'w') as f:
    f.write(apk_script)

print('build-apk.js updated to allow full internet access!')
