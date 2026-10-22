import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  onIdTokenChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { app, auth, db } from '../lib/firebase.ts';

export { app, auth, db };

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Use localStorage with sessionStorage fallback for multi-tab & cross-session persistence
let cachedAccessToken: string | null =
  localStorage.getItem('google_access_token') || sessionStorage.getItem('google_access_token');

export const getAccessToken = (): string | null => {
  if (!cachedAccessToken) {
    cachedAccessToken =
      localStorage.getItem('google_access_token') || sessionStorage.getItem('google_access_token');
  }
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    try {
      localStorage.setItem('google_access_token', token);
      sessionStorage.setItem('google_access_token', token);
    } catch {
      // safe fallback if storage quota exceeded or disabled
    }
  } else {
    try {
      localStorage.removeItem('google_access_token');
      sessionStorage.removeItem('google_access_token');
    } catch {
      // safe fallback
    }
  }
};

/**
 * Silent Token Refresh: Refreshes the active Firebase ID token without prompting the user.
 * Call this periodically or during silent background revalidation.
 */
export const refreshFirebaseSession = async (force: boolean = false): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    const token = await user.getIdToken(force);
    return token;
  } catch (err) {
    console.warn('Silent session refresh skipped:', err);
    return null;
  }
};

export const signInWithGoogle = async (): Promise<{ user: FirebaseUser; accessToken?: string }> => {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  if (token) {
    setAccessToken(token);
  }
  return { user: result.user, accessToken: token };
};

export const signOutFirebase = async () => {
  setAccessToken(null);
  try {
    localStorage.removeItem('cms_cached_user');
    localStorage.removeItem('cms_cached_role');
    localStorage.removeItem('cms_cached_classinfo');
  } catch {
    // safe fallback
  }
  await signOut(auth);
};

export { onIdTokenChanged };

export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerData: Array<{
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoURL: string | null;
    }>;
  };
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null): never {
  const user = auth.currentUser;
  const errorInfo: FirestoreErrorInfo = {
    error: error?.message || String(error),
    operationType,
    path,
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
      tenantId: user?.tenantId,
      providerData: (user?.providerData || []).map(p => ({
        providerId: p.providerId,
        displayName: p.displayName,
        email: p.email,
        photoURL: p.photoURL,
      })),
    },
  };
  console.error('Firestore Error:', JSON.stringify(errorInfo));
  throw new Error(JSON.stringify(errorInfo));
}

export interface FirestoreConnectionResult {
  connected: boolean;
  status: 'connected' | 'not_found' | 'permission_denied' | 'offline' | 'error';
  message: string;
  projectId: string;
  databaseId: string;
  timestamp: string;
  details?: string;
}

/**
 * Diagnostic utility to test actual Firestore connectivity and provide clear error messages.
 */
export async function testFirestoreConnection(): Promise<FirestoreConnectionResult> {
  const projectId = (firebaseConfig as any).projectId || 'fajmuls-learning';
  const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return {
      connected: true,
      status: 'connected',
      message: 'Cloud Firestore aktif dan terhubung normal.',
      projectId,
      databaseId,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    const errCode = error?.code || '';

    if (errCode === 'permission-denied' || errMsg.includes('Missing or insufficient permissions')) {
      return {
        connected: true,
        status: 'permission_denied',
        message: 'Cloud Firestore aktif & merespons (Keamanan Rules berjalan).',
        projectId,
        databaseId,
        timestamp: new Date().toISOString(),
        details: errMsg,
      };
    }

    if (errMsg.includes('not-found') || errMsg.includes('does not exist') || errCode === 'not-found') {
      return {
        connected: false,
        status: 'not_found',
        message: `Database Firestore belum dibuat di Firebase Console (${projectId}).`,
        projectId,
        databaseId,
        timestamp: new Date().toISOString(),
        details: errMsg,
      };
    }

    if (errMsg.includes('the client is offline') || errCode === 'unavailable') {
      return {
        connected: false,
        status: 'offline',
        message: 'Klien Firestore offline atau database belum siap menerima koneksi web.',
        projectId,
        databaseId,
        timestamp: new Date().toISOString(),
        details: errMsg,
      };
    }

    return {
      connected: false,
      status: 'error',
      message: 'Kendala koneksi Firestore: ' + errMsg,
      projectId,
      databaseId,
      timestamp: new Date().toISOString(),
      details: errMsg,
    };
  }
}
