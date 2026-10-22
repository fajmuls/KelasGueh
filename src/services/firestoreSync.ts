import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
} from '../lib/firebase.ts';
import { ClassInfo, User, Role, Transaction, EventItem, TaskItem } from '../types/index.ts';

export type FirestoreConnectionStatus = 'connected' | 'connecting' | 'offline';

let connectionStatus: FirestoreConnectionStatus = 'connected';
const statusListeners: Set<(status: FirestoreConnectionStatus) => void> = new Set();

export function setConnectionStatus(status: FirestoreConnectionStatus) {
  if (connectionStatus !== status) {
    connectionStatus = status;
    statusListeners.forEach((fn) => {
      try {
        fn(status);
      } catch (err) {
        console.error('Status listener error:', err);
      }
    });
  }
}

export function subscribeToConnectionStatus(fn: (status: FirestoreConnectionStatus) => void): () => void {
  statusListeners.add(fn);
  fn(connectionStatus);
  return () => {
    statusListeners.delete(fn);
  };
}

export function getConnectionStatus(): FirestoreConnectionStatus {
  return connectionStatus;
}

// ==========================================
// 1. TEMPLATE DEFAULT CLASS 01 SAKP 14
// ==========================================

export const DEFAULT_CLASS_01SAKP014: ClassInfo = {
  id: 'cls_01sakp014',
  name: '01 SAKP 14',
  code: '01SAKP014',
  academic_year: '2026/2027',
  semester: 'Semester 1 (Ganjil)',
  major: 'S1 Akuntansi Perpajakan',
  faculty: 'Fakultas Ekonomi dan Bisnis',
  description: 'Kelas perkuliahan Program Studi S1 Akuntansi / Perpajakan Kelas 01 SAKP 14.',
  monthly_dues_amount: 20000,
  created_at: '2026-09-01T08:00:00Z',
  updated_at: '2026-09-10T08:00:00Z',
};

export const TEMPLATE_39_STUDENTS: User[] = [
  { id: 'usr_member_01', name: 'ADELTRUDIS AEK', nim: '261011201667', email: '261011201667@students.ac.id', phone: '081234567001', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_02', name: 'ADRIAN PERMANA', nim: '261011201636', email: '261011201636@students.ac.id', phone: '081234567002', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_03', name: 'AGUNG PRATAMA', nim: '261011201552', email: '261011201552@students.ac.id', phone: '081234567003', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_04', name: 'AISNA FELIA FAISAL', nim: '261011201226', email: '261011201226@students.ac.id', phone: '081234567004', role_id: 'role_sekretaris', role_name: 'Sekretaris', position: 'Sekretaris Kelas', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_05', name: 'ALYDA MU`TAMARO', nim: '261011201195', email: '261011201195@students.ac.id', phone: '081234567005', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_06', name: 'ALYSHA RAMADHANI', nim: '261011201633', email: '261011201633@students.ac.id', phone: '081234567006', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_07', name: 'ANJELICA ESTHERTITA .K. RANTE', nim: '261011201190', email: '261011201190@students.ac.id', phone: '081234567007', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_08', name: 'AURA NANDHA MAULYDIA SUHARI', nim: '261011201589', email: '261011201589@students.ac.id', phone: '081234567008', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_09', name: 'CHARISSA PUTRI RABBANY', nim: '261011201517', email: '261011201517@students.ac.id', phone: '081234567009', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_10', name: 'CINTIA FEBRIONA', nim: '261011201472', email: '261011201472@students.ac.id', phone: '081234567010', role_id: 'role_bendahara', role_name: 'Bendahara', position: 'Bendahara Utama', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_11', name: 'DAVA VANEZA', nim: '261011201683', email: '261011201683@students.ac.id', phone: '081234567011', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_12', name: 'DHAFI IAN FADHILA', nim: '261011201257', email: '261011201257@students.ac.id', phone: '081234567012', role_id: 'role_wakil', role_name: 'Wakil Ketua', position: 'Wakil Ketua Kelas', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_13', name: 'DWI NUR SYAFITRI', nim: '261011201500', email: '261011201500@students.ac.id', phone: '081234567013', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_14', name: 'FAIZ AKBAR DWITAMA', nim: '261011201443', email: '261011201443@students.ac.id', phone: '081234567014', role_id: 'role_koordinator_acara', role_name: 'Koordinator Acara', position: 'Koordinator Acara & Kegiatan', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_15', name: 'FATIMAH AZ ZAHRA', nim: '261011201197', email: '261011201197@students.ac.id', phone: '081234567015', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_16', name: 'HAFIZ HUDDIN MUTHI`ARRASYID', nim: '261011201571', email: '261011201571@students.ac.id', phone: '081234567016', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_17', name: 'HALIMAH', nim: '261011201397', email: '261011201397@students.ac.id', phone: '081234567017', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_18', name: 'HUMAIROH AZZAHRO', nim: '261011201602', email: '261011201602@students.ac.id', phone: '081234567018', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_19', name: 'KHALIPA AZKIA', nim: '261011201287', email: '261011201287@students.ac.id', phone: '081234567019', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_20', name: 'LAURA GRANITA', nim: '261011201345', email: '261011201345@students.ac.id', phone: '081234567020', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_21', name: 'LINGGA JULIANTI', nim: '261011201514', email: '261011201514@students.ac.id', phone: '081234567021', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_22', name: 'MILA CATUR ANGGRAENI', nim: '261011201648', email: '261011201648@students.ac.id', phone: '081234567022', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_23', name: 'MUHAMAD FAHRUL', nim: '261011201604', email: '261011201604@students.ac.id', phone: '081234567023', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_24', name: 'MUHAMMAD IKSAN TAUFIK', nim: '261011201787', email: '261011201787@students.ac.id', phone: '081234567024', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_25', name: 'MUHAMMAD RACHMAN FAJRI MULIYANSAH', nim: '261011201412', email: 'mrachmanfm@gmail.com', phone: '081234567412', role_id: 'role_superadmin', role_name: 'Super Admin & Ketua Kelas', position: 'Super Admin & Ketua Kelas', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi Perpajakan', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_26', name: 'MUTIARA KASIH', nim: '261011201372', email: '261011201372@students.ac.id', phone: '081234567026', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_27', name: 'PERITHA ALMAIRA', nim: '261011201440', email: '261011201440@students.ac.id', phone: '081234567027', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_28', name: 'RAYYAN FAYRUZ AKBAR', nim: '261011201554', email: '261011201554@students.ac.id', phone: '081234567028', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_29', name: 'REGINA CAHYANI', nim: '261011201243', email: '261011201243@students.ac.id', phone: '081234567029', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_30', name: 'RIYANA HUTARI', nim: '261011201312', email: '261011201312@students.ac.id', phone: '081234567030', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_31', name: 'SAKINAH OKTAVIANI', nim: '261011201214', email: '261011201214@students.ac.id', phone: '081234567031', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_32', name: 'SASKYIA EMALIA DAULAY', nim: '261011201428', email: '261011201428@students.ac.id', phone: '081234567032', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_33', name: 'SYIFA NAFATUL ULYA', nim: '261011201670', email: '261011201670@students.ac.id', phone: '081234567033', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_34', name: 'SYLVA LESTARI', nim: '261011201205', email: '261011201205@students.ac.id', phone: '081234567034', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_35', name: 'THALITA IZZATI HUMAIRA', nim: '261011201187', email: '261011201187@students.ac.id', phone: '081234567035', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_36', name: 'VERLITA RAHMADANI', nim: '261011201183', email: '261011201183@students.ac.id', phone: '081234567036', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_37', name: 'VEYSEL RAHMA NAFIAH', nim: '261011201563', email: '261011201563@students.ac.id', phone: '081234567037', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_38', name: 'YOSHINA NAURA', nim: '261011201664', email: '261011201664@students.ac.id', phone: '081234567038', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
  { id: 'usr_member_39', name: 'ZASKIYA AULIA ARAHMA', nim: '261011201584', email: '261011201584@students.ac.id', phone: '081234567039', role_id: 'role_anggota', role_name: 'Anggota', position: 'Anggota', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80', class_id: 'cls_01sakp014', department: 'S1 Akuntansi', cohort: '2026', is_active: true, joined_at: '2026-09-01T08:00:00Z', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-06T08:00:00Z' },
];

/**
 * Ensures class 01 SAKP 14 and all 39 students exist in Firestore.
 */
export async function seedClassAndTemplateMembersToFirestore(): Promise<void> {
  try {
    // 1. Write class 01 SAKP 14
    await setDoc(doc(db, 'classes', DEFAULT_CLASS_01SAKP014.id), DEFAULT_CLASS_01SAKP014, { merge: true });
    await setDoc(doc(db, 'classInfo', 'main'), DEFAULT_CLASS_01SAKP014, { merge: true });

    // 2. Write 39 students to /classes/cls_01sakp014/members and /members
    for (const student of TEMPLATE_39_STUDENTS) {
      await setDoc(doc(db, 'classes', 'cls_01sakp014', 'members', student.id), student, { merge: true });
      await setDoc(doc(db, 'members', student.id), student, { merge: true });
    }

    setConnectionStatus('connected');
    console.log('Successfully synced 01 SAKP 14 & 39 students to Cloud Firestore');
  } catch (err) {
    console.warn('Firestore seeding notice:', err);
  }
}

// Auto run background seed once on module load
seedClassAndTemplateMembersToFirestore().catch(() => {});

// ==========================================
// 2. CLASS MANAGEMENT (CLOUDFIRESTORE)
// ==========================================

export async function fetchClassesFromFirestore(): Promise<ClassInfo[]> {
  try {
    const classesRef = collection(db, 'classes');
    const snap = await getDocs(classesRef);
    const result: ClassInfo[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      result.push({
        id: docSnap.id,
        name: data.name || '01 SAKP 14',
        code: data.code || '01SAKP014',
        academic_year: data.academic_year || '2026/2027',
        semester: data.semester || 'Semester 1 (Ganjil)',
        major: data.major || 'S1 Akuntansi Perpajakan',
        faculty: data.faculty || 'Fakultas Ekonomi dan Bisnis',
        description: data.description || '',
        monthly_dues_amount: Number(data.monthly_dues_amount) || 20000,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      });
    });

    if (result.length === 0) {
      result.push(DEFAULT_CLASS_01SAKP014);
      // Auto write to Firestore
      await setDoc(doc(db, 'classes', DEFAULT_CLASS_01SAKP014.id), DEFAULT_CLASS_01SAKP014, { merge: true });
      await setDoc(doc(db, 'classInfo', 'main'), DEFAULT_CLASS_01SAKP014, { merge: true });
    }

    setConnectionStatus('connected');
    return result;
  } catch (err) {
    console.warn('Firestore fetchClasses warning (fallback to default class):', err);
    return [DEFAULT_CLASS_01SAKP014];
  }
}

export function subscribeToClasses(callback: (classes: ClassInfo[]) => void): () => void {
  try {
    const classesRef = collection(db, 'classes');
    return onSnapshot(
      classesRef,
      (snapshot) => {
        setConnectionStatus('connected');
        const list: ClassInfo[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || '01 SAKP 14',
            code: data.code || '01SAKP014',
            academic_year: data.academic_year || '2026/2027',
            semester: data.semester || 'Semester 1 (Ganjil)',
            major: data.major || 'S1 Akuntansi Perpajakan',
            faculty: data.faculty || 'Fakultas Ekonomi dan Bisnis',
            description: data.description || '',
            monthly_dues_amount: Number(data.monthly_dues_amount) || 20000,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
          });
        });

        if (list.length === 0) {
          list.push(DEFAULT_CLASS_01SAKP014);
        }
        callback(list);
      },
      (error) => {
        console.warn('Firestore classes onSnapshot warning:', error);
        callback([DEFAULT_CLASS_01SAKP014]);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to classes:', err);
    callback([DEFAULT_CLASS_01SAKP014]);
    return () => {};
  }
}

export async function createClassInFirestore(classData: Partial<ClassInfo>): Promise<ClassInfo> {
  const classId = classData.id || `cls_${Date.now()}`;
  const now = new Date().toISOString();

  const newClass: ClassInfo = {
    id: classId,
    name: classData.name || '01 SAKP 14',
    code: classData.code || '01SAKP014',
    academic_year: classData.academic_year || '2026/2027',
    semester: classData.semester || 'Semester 1 (Ganjil)',
    major: classData.major || 'S1 Akuntansi Perpajakan',
    faculty: classData.faculty || 'Fakultas Ekonomi dan Bisnis',
    description: classData.description || '',
    monthly_dues_amount: Number(classData.monthly_dues_amount) || 20000,
    created_at: now,
    updated_at: now,
  };

  try {
    await setDoc(doc(db, 'classes', classId), newClass, { merge: true });
    await setDoc(doc(db, 'classInfo', 'main'), newClass, { merge: true });
    setConnectionStatus('connected');
  } catch (err) {
    console.warn('Could not write class to Firestore:', err);
  }

  try {
    localStorage.setItem('cms_cached_classinfo', JSON.stringify(newClass));
    localStorage.setItem('cms_store_class_info', JSON.stringify(newClass));
  } catch {}

  return newClass;
}

export async function updateClassInFirestore(classId: string, classData: Partial<ClassInfo>): Promise<ClassInfo> {
  const now = new Date().toISOString();
  const updatedData = {
    ...classData,
    updated_at: now,
  };

  try {
    await setDoc(doc(db, 'classes', classId), updatedData, { merge: true });
    await setDoc(doc(db, 'classInfo', 'main'), updatedData, { merge: true });
    setConnectionStatus('connected');
  } catch (err) {
    console.warn('Could not update class in Firestore:', err);
  }

  try {
    const raw = localStorage.getItem('cms_cached_classinfo');
    if (raw) {
      const merged = { ...JSON.parse(raw), ...updatedData };
      localStorage.setItem('cms_cached_classinfo', JSON.stringify(merged));
    }
  } catch {}

  return updatedData as ClassInfo;
}

// ==========================================
// 3. REAL-TIME MEMBER SYNC (CLASS MEMBERS)
// ==========================================

export function subscribeToMembers(callback: (members: User[]) => void): () => void {
  try {
    const membersRef = collection(db, 'members');
    return onSnapshot(
      membersRef,
      (snapshot) => {
        setConnectionStatus('connected');
        const customMap = new Map<string, User>();

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const isSuper = (d.email || '').toLowerCase() === 'mrachmanfm@gmail.com';
          const roleId = isSuper ? 'role_superadmin' : d.role_id || 'role_anggota';
          const roleName = isSuper ? 'Super Admin & Ketua Kelas' : d.class_role || d.position || d.role_name || 'Anggota';

          customMap.set(docSnap.id, {
            id: docSnap.id,
            name: d.name || d.displayName || 'Mahasiswa',
            nim: d.nim || d.student_id || '',
            email: d.email || '',
            phone: d.phone || '',
            avatar: d.avatar || d.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name || 'User')}&background=2563eb&color=fff`,
            class_id: d.class_id || 'cls_01sakp014',
            department: d.department || 'S1 Akuntansi',
            cohort: d.cohort || '2026',
            role_id: roleId,
            role_name: roleName,
            position: roleName,
            is_active: d.is_active !== false,
            joined_at: d.joined_at || d.created_at || new Date().toISOString(),
            created_at: d.created_at || new Date().toISOString(),
            updated_at: d.updated_at || new Date().toISOString(),
          });
        });

        // Merge with template 39 students
        const mergedList = TEMPLATE_39_STUDENTS.map((templateStudent) => {
          // Check if custom document exists by ID or by NIM
          const custom = customMap.get(templateStudent.id) || 
            Array.from(customMap.values()).find(m => m.nim === templateStudent.nim);
          if (custom) {
            return {
              ...templateStudent,
              ...custom,
              role_id: custom.role_id || templateStudent.role_id,
              role_name: custom.role_name || templateStudent.role_name,
              position: custom.position || templateStudent.position,
            };
          }
          return templateStudent;
        });

        // Add any newly added students that weren't in template
        customMap.forEach((custom, key) => {
          if (!TEMPLATE_39_STUDENTS.some(t => t.id === key || (custom.nim && t.nim === custom.nim))) {
            mergedList.push(custom);
          }
        });

        try {
          localStorage.setItem('cms_store_users', JSON.stringify(mergedList));
        } catch {}
        callback(mergedList);
      },
      (error) => {
        console.warn('Firestore members onSnapshot warning:', error);
        callback(TEMPLATE_39_STUDENTS);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to members:', err);
    callback(TEMPLATE_39_STUDENTS);
    return () => {};
  }
}

export async function fetchMembersFromFirestore(): Promise<User[]> {
  try {
    const membersRef = collection(db, 'members');
    const snap = await getDocs(membersRef);
    const customMap = new Map<string, User>();

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const isSuper = (d.email || '').toLowerCase() === 'mrachmanfm@gmail.com';
      const roleId = isSuper ? 'role_superadmin' : d.role_id || 'role_anggota';
      const roleName = isSuper ? 'Super Admin & Ketua Kelas' : d.class_role || d.position || d.role_name || 'Anggota';

      customMap.set(docSnap.id, {
        id: docSnap.id,
        name: d.name || d.displayName || 'Mahasiswa',
        nim: d.nim || d.student_id || '',
        email: d.email || '',
        phone: d.phone || '',
        avatar: d.avatar || d.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name || 'User')}&background=2563eb&color=fff`,
        class_id: d.class_id || 'cls_01sakp014',
        department: d.department || 'S1 Akuntansi',
        cohort: d.cohort || '2026',
        role_id: roleId,
        role_name: roleName,
        position: roleName,
        is_active: d.is_active !== false,
        joined_at: d.joined_at || new Date().toISOString(),
        created_at: d.created_at || new Date().toISOString(),
        updated_at: d.updated_at || new Date().toISOString(),
      });
    });

    const mergedList = TEMPLATE_39_STUDENTS.map((templateStudent) => {
      const custom = customMap.get(templateStudent.id) ||
        Array.from(customMap.values()).find(m => m.nim === templateStudent.nim);
      if (custom) {
        return {
          ...templateStudent,
          ...custom,
        };
      }
      return templateStudent;
    });

    setConnectionStatus('connected');
    try {
      localStorage.setItem('cms_store_users', JSON.stringify(mergedList));
    } catch {}
    return mergedList;
  } catch (err) {
    console.warn('Firestore fetchMembers notice:', err);
    return TEMPLATE_39_STUDENTS;
  }
}

export async function saveMemberToFirestore(memberData: Partial<User>): Promise<User> {
  const userId = memberData.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const isSuper = memberData.email?.toLowerCase() === 'mrachmanfm@gmail.com';
  const roleId = isSuper ? 'role_superadmin' : memberData.role_id || 'role_anggota';
  const position = isSuper ? 'Super Admin & Ketua Kelas' : memberData.position || memberData.role_name || 'Anggota';

  const userDoc: User = {
    id: userId,
    name: memberData.name || 'Mahasiswa',
    nim: memberData.nim || '',
    email: memberData.email || '',
    phone: memberData.phone || '',
    avatar: memberData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberData.name || 'User')}&background=2563eb&color=fff`,
    class_id: memberData.class_id || 'cls_01sakp014',
    department: memberData.department || 'S1 Akuntansi Perpajakan',
    cohort: memberData.cohort || '2026',
    role_id: roleId,
    role_name: position,
    position: position,
    is_active: memberData.is_active !== false,
    joined_at: memberData.joined_at || now,
    created_at: memberData.created_at || now,
    updated_at: now,
  };

  try {
    await setDoc(doc(db, 'members', userId), userDoc, { merge: true });
    await setDoc(doc(db, 'classes', 'cls_01sakp014', 'members', userId), userDoc, { merge: true });
    setConnectionStatus('connected');
  } catch (err) {
    console.warn('Could not write member to Firestore directly:', err);
  }

  try {
    const raw = localStorage.getItem('cms_store_users');
    const list: User[] = raw ? JSON.parse(raw) : [...TEMPLATE_39_STUDENTS];
    const idx = list.findIndex((u) => u.id === userId || (u.nim && u.nim === userDoc.nim));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...userDoc };
    } else {
      list.push(userDoc);
    }
    localStorage.setItem('cms_store_users', JSON.stringify(list));
  } catch {}

  return userDoc;
}

export async function deleteMemberFromFirestore(userId: string): Promise<boolean> {
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'members', userId), {
      is_active: false,
      updated_at: now,
    });
    setConnectionStatus('connected');
    return true;
  } catch (err) {
    console.warn('Could not deactivate member in Firestore:', err);
    return false;
  }
}

export async function deleteFirestoreDocument(collectionName: string, id: string): Promise<boolean> {
  try {
    const { deleteDoc } = await import('../lib/firebase.ts');
    await deleteDoc(doc(db, collectionName, id));
    // Also delete from subcollection under 01 SAKP 14 if applicable
    await deleteDoc(doc(db, 'classes', 'cls_01sakp014', collectionName, id)).catch(() => {});
    return true;
  } catch (err) {
    console.warn(`Firestore delete warning for ${collectionName}/${id}:`, err);
    return false;
  }
}

// ==========================================
// 4. EXPORT LOCAL JSON BACKUP
// ==========================================

export async function exportClassBackupJSON(
  classInfo: ClassInfo | null,
  members: User[]
): Promise<void> {
  let transactions: Transaction[] = [];
  let events: EventItem[] = [];
  let tasks: TaskItem[] = [];

  try {
    const txRaw = localStorage.getItem('cms_store_transactions');
    if (txRaw) transactions = JSON.parse(txRaw);
    const evtRaw = localStorage.getItem('cms_store_events');
    if (evtRaw) events = JSON.parse(evtRaw);
    const tskRaw = localStorage.getItem('cms_store_tasks');
    if (tskRaw) tasks = JSON.parse(tskRaw);
  } catch {}

  const backupData = {
    app_version: 'v3.0.0',
    app_name: 'Kelas Manajer 01 SAKP 14',
    exported_at: new Date().toISOString(),
    system: {
      platform: 'Web Client / PWA / Cloud Firestore (Classify Pro Isolated)',
      environment: 'Spark Free Tier (Zero Paid Dependencies)',
    },
    class_info: classInfo || DEFAULT_CLASS_01SAKP014,
    members_count: members.length,
    members: members,
    finance: {
      transactions_count: transactions.length,
      transactions: transactions,
    },
    agenda: {
      events_count: events.length,
      events: events,
    },
    tasks: {
      tasks_count: tasks.length,
      tasks: tasks,
    },
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const cleanCode = (classInfo?.code || '01SAKP014').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `cadangan-kelas-${cleanCode}-${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
