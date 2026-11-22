/**
 * API and Network Configuration for Web, PWA, and Android APK environments.
 * The Android APK runs 100% locally and completely offline without any online
 * cloud calls, external fetches, or network error alerts.
 */

export const isApkEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  if ((window as any).IS_APK_BUILD === true) return true;
  const origin = window.location.origin || '';
  const hostname = window.location.hostname || '';
  const href = window.location.href || '';
  return (
    origin.includes('appassets.androidplatform.net') ||
    href.includes('appassets.androidplatform.net') ||
    window.location.protocol === 'file:' ||
    (hostname === 'localhost' && window.location.port === '')
  );
};

export const isOnlineEnabled = (): boolean => {
  return !isApkEnvironment();
};

export const getApiBaseUrl = (): string => {
  // Never send API requests to any remote server on the APK
  if (isApkEnvironment()) {
    return '';
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
};

export const getPublicShareBaseUrl = (): string => {
  return typeof window !== 'undefined' ? window.location.origin : '';
};
