import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'billtracestall_access_token';
const ROLE_KEY = 'billtracestall_role';
const OFFICE_ID_KEY = 'billtracestall_selected_office_id';
const OFFICE_DRAFT_KEY = 'billtracestall_office_draft';

let cachedAccessToken: string | null = null;

function base64UrlDecodeToString(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const str = base64 + pad;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < str.length) {
    const enc1 = chars.indexOf(str.charAt(i++));
    const enc2 = chars.indexOf(str.charAt(i++));
    const enc3 = chars.indexOf(str.charAt(i++));
    const enc4 = chars.indexOf(str.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);
    if (enc3 !== 64) {
      output += String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output += String.fromCharCode(chr3);
    }
  }

  try {
    return decodeURIComponent(
      output
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return output;
  }
}

function isJwtExpired(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const payloadJson = base64UrlDecodeToString(parts[1]);
    const payload = JSON.parse(payloadJson) as { exp?: number };
    const exp = Number(payload.exp ?? 0);
    if (!exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return now >= exp - 10;
  } catch {
    return true;
  }
}

export async function setAuth(accessToken: string, role: string) {
  cachedAccessToken = accessToken;
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(ROLE_KEY, role);
}

export async function clearAuth() {
  cachedAccessToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(ROLE_KEY);
  await SecureStore.deleteItemAsync(OFFICE_ID_KEY);
  await SecureStore.deleteItemAsync(OFFICE_DRAFT_KEY);
}

export async function getAccessToken() {
  if (cachedAccessToken) {
    if (isJwtExpired(cachedAccessToken)) {
      await clearAuth();
      return null;
    }
    return cachedAccessToken;
  }
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) {
    cachedAccessToken = null;
    return null;
  }
  if (isJwtExpired(token)) {
    await clearAuth();
    return null;
  }
  cachedAccessToken = token;
  return token;
}

export async function getRole() {
  return SecureStore.getItemAsync(ROLE_KEY);
}

export async function setSelectedOfficeId(officeId: string) {
  await SecureStore.setItemAsync(OFFICE_ID_KEY, officeId);
}

export async function getSelectedOfficeId() {
  return SecureStore.getItemAsync(OFFICE_ID_KEY);
}

export async function setOfficeDraft(draft: { officeName: string; contactPerson: string; address: string }) {
  await SecureStore.setItemAsync(OFFICE_DRAFT_KEY, JSON.stringify(draft));
}

export async function getOfficeDraft() {
  const raw = await SecureStore.getItemAsync(OFFICE_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { officeName: string; contactPerson: string; address: string };
  } catch {
    return null;
  }
}
