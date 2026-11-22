import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { signApk } from 'apk_sign_ts';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.endsWith('.apk')) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function buildApk() {
  console.log("=== Building Deployable APK for Cyril's RO (Storage Access & File Upload Enabled) ===");

  // 1. Build fresh Vite bundle
  console.log('Building fresh Vite production bundle...');
  execSync('npm run build', { stdio: 'inherit' });

  const tmpDir = '/tmp/cyril_apk_build';
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });

  // 2. Download base Android APK runtime engine with native onShowFileChooser and Storage Access Framework
  const baseApkPath = '/tmp/html2apk-base.apk';
  if (!fs.existsSync(baseApkPath)) {
    console.log('Fetching base Android WebView runtime engine with native WebChromeClient file picker...');
    execSync(
      'curl -sL https://github.com/3511440694huang-oss/html2apk/releases/download/v1.2.0/html2apk-selftest-v1.2.0.apk -o /tmp/html2apk-base.apk',
      { stdio: 'inherit' }
    );
  }

  // 3. Unpack base APK template
  console.log('Unpacking base APK template...');
  execSync(`unzip -q ${baseApkPath} -d ${tmpDir}`);

  // Remove sample test fixtures from assets and unnecessary native libraries
  const oldAssets = path.join(tmpDir, 'assets');
  if (fs.existsSync(oldAssets)) {
    fs.rmSync(oldAssets, { recursive: true, force: true });
  }
  fs.mkdirSync(oldAssets, { recursive: true });

  const oldLib = path.join(tmpDir, 'lib');
  if (fs.existsSync(oldLib)) {
    fs.rmSync(oldLib, { recursive: true, force: true });
  }

  // 4. Configure ht2a.config
  const ht2aConfigPath = path.join(oldAssets, 'ht2a.config');
  const ht2aConfig = [
    '# Cyril Walucho Broadcast Rundown Pro Config',
    'entryFile=index.html',
    'statusBarColor=#020617',
    'navBarColor=#020617',
    'backgroundColor=#020617',
    'orientation=auto',
    'keepScreenOn=1',
    'formRestore=1',
    'textZoom=100',
    'debug=0'
  ].join('\n');
  fs.writeFileSync(ht2aConfigPath, ht2aConfig, 'utf-8');

  // 5. Prepare the Vite production app for local WebView serving
  const distDir = path.resolve('dist');
  let indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

  // Ensure title and inject IS_APK_BUILD flag
  indexHtml = indexHtml.replace(/<title>.*?<\/title>/, "<title>Cyril's RO</title>");
  if (!indexHtml.includes('window.IS_APK_BUILD = true')) {
    indexHtml = indexHtml.replace('<head>', '<head><script>window.IS_APK_BUILD = true;</script>');
  }

  // Copy dist files into assets
  copyDirSync(distDir, oldAssets);

  // Write adapted index.html into assets/index.html
  fs.writeFileSync(path.join(oldAssets, 'index.html'), indexHtml, 'utf-8');

  // 6. Update App Name in resources.arsc (replace b'HTML2APK Test' with b"Cyril's RO V9")
  const arscPath = path.join(tmpDir, 'resources.arsc');
  if (fs.existsSync(arscPath)) {
    console.log('Renaming Android app title in resources.arsc to "Cyril\'s RO V9"...');
    let arscBuffer = fs.readFileSync(arscPath);
    const searchTarget = Buffer.from('HTML2APK Test', 'utf-8');
    const replaceTarget = Buffer.from("Cyril's RO V9", 'utf-8');
    const idx = arscBuffer.indexOf(searchTarget);
    if (idx !== -1) {
      replaceTarget.copy(arscBuffer, idx);
      fs.writeFileSync(arscPath, arscBuffer);
      console.log('Successfully patched resources.arsc app name at byte offset:', idx);
    } else {
      console.warn('Warning: Target app name not found in resources.arsc');
    }
  }

  // 7. Ensure RSA key and certificate exist
  const keyPath = '/tmp/cyril_key.pem';
  const certPath = '/tmp/cyril_cert.pem';
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('Generating X.509 release certificate and RSA key for Cyril Walucho...');
    execSync(
      `openssl req -x509 -newkey rsa:2048 -keyout ${keyPath} -out ${certPath} -days 10000 -nodes -subj "/CN=Cyril Walucho/O=Cyril Rundown/C=US"`,
      { stdio: 'inherit' }
    );
  }

  // 8. Repackage into unaligned ZIP
  console.log('Repackaging APK contents...');
  const unalignedApk = '/tmp/cyril_unaligned.apk';
  if (fs.existsSync(unalignedApk)) fs.unlinkSync(unalignedApk);

  execSync(`python3 -c "import zipfile, os
with zipfile.ZipFile('${unalignedApk}', 'w', zipfile.ZIP_DEFLATED) as zout:
    for root, dirs, files in os.walk('${tmpDir}'):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, '${tmpDir}')
            if rel_path.startswith('META-INF/') and (rel_path.endswith('.SF') or rel_path.endswith('.RSA') or rel_path.endswith('.MF')):
                continue
            zout.write(full_path, rel_path)"`);

  // 9. Sign APK with apk_sign_ts (v1 and v2 Android signatures)
  console.log('Signing APK with official Android V1 & V2 schemes...');
  const keyPem = fs.readFileSync(keyPath, 'utf-8');
  const certPem = fs.readFileSync(certPath, 'utf-8');
  const unsignedBytes = fs.readFileSync(unalignedApk);
  const res = await signApk(unsignedBytes, keyPem, certPem);
  const signedBuffer = Buffer.from(res.signedApk);

  // Write to public/ and dist/
  const targetCyrilsRo = path.join(publicDir, 'Cyrils-RO.apk');
  const targetLegacy = path.join(publicDir, 'Cyril-Walucho-Rundown-Live-Free.apk');
  fs.writeFileSync(targetCyrilsRo, signedBuffer);
  fs.writeFileSync(targetLegacy, signedBuffer);
  console.log(`Successfully generated: ${targetCyrilsRo} (${(signedBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);

  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'Cyrils-RO.apk'), signedBuffer);
    fs.writeFileSync(path.join(distDir, 'Cyril-Walucho-Rundown-Live-Free.apk'), signedBuffer);
  }

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (fs.existsSync(unalignedApk)) fs.unlinkSync(unalignedApk);

  console.log("=== APK Build Complete! Cyril's RO APK with full Phone Storage access is ready in /public ===");
}

buildApk().catch(err => {
  console.error('Build APK failed:', err);
  process.exit(1);
});
