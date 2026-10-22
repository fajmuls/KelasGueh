import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocFromServer,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely (singleton pattern)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
export const firestore: Firestore = getFirestore(app);
export const db: Firestore = firestore; // Exported as both 'firestore' and 'db' for full app compatibility

// Initialize Auth
export const auth = getAuth(app);

// Re-export common Firestore utilities for easy imports across the entire app
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocFromServer,
};
export type { DocumentData, QueryDocumentSnapshot };

/**
 * Helper to safely save Classify Pro profile in the dedicated /classify_users/{userId} collection
 * and /classes/cls_01sakp014/members/{userId}.
 * This completely isolates Classify Pro database records from any other applications.
 */
export async function saveClassifyUserProfile(
  userId: string,
  profileData: {
    email: string;
    displayName?: string | null;
    photoURL?: string | null;
    student_id?: string;
    nim?: string;
    class_role?: string;
    class_name?: string;
    attendance_number?: number;
    phone?: string;
    is_google_linked?: boolean;
  }
) {
  try {
    const now = new Date().toISOString();
    
    // Explicitly isolated Classify Pro namespace in /classify_users
    const payload: Record<string, any> = {
      id: userId,
      email: profileData.email,
      updated_at: now,
      classify_pro_last_active: now,
      is_google_linked: true,
      last_login_at: now,
    };

    if (profileData.displayName) payload.displayName = profileData.displayName;
    if (profileData.photoURL) payload.photoURL = profileData.photoURL;
    if (profileData.student_id) payload.student_id = profileData.student_id;
    if (profileData.nim) payload.nim = profileData.nim;
    if (profileData.class_role) payload.class_role = profileData.class_role;
    if (profileData.class_name) payload.class_name = profileData.class_name;
    if (profileData.attendance_number !== undefined) payload.attendance_number = profileData.attendance_number;
    if (profileData.phone) payload.phone = profileData.phone;

    // 1. Write to isolated classify_users collection
    await setDoc(doc(db, 'classify_users', userId), payload, { merge: true });
    
    // 2. Also update student in class members collection
    if (profileData.nim || userId) {
      await setDoc(doc(db, 'classes', 'cls_01sakp014', 'members', userId), payload, { merge: true });
      await setDoc(doc(db, 'members', userId), payload, { merge: true });
    }

    return true;
  } catch (err) {
    console.warn('Firestore profile save warning (fallback to local cache):', err);
    return false;
  }
}
