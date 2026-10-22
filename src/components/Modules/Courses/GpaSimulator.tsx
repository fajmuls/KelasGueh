import React, { useState } from 'react';
import { Course } from '../../../types/index.ts';
import { Calculator, Award, TrendingUp, Sparkles, CheckCircle, HelpCircle, BookOpen } from 'lucide-react';

interface GpaSimulatorProps {
  courses: Course[];
}

interface CourseGradeTarget {
  courseId: string;
  courseName: string;
  sks: number;
  grade: string; // 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'E'
}

const GRADE_POINTS: Record<string, number> = {
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'D': 1.0,
  'E': 0.0,
};

export const GpaSimulator: React.FC<GpaSimulatorProps> = ({ courses }) => {
  // Previous cumulative GPA state (Semester Sebelumnya)
  const [previousGpa, setPreviousGpa] = useState<number>(3.65);
  const [previousTotalSks, setPreviousTotalSks] = useState<number>(40);

  // Targets per course in current semester
  const [gradeTargets, setGradeTargets] = useState<CourseGradeTarget[]>(() => {
    if (courses.length > 0) {
      return courses.map((c) => ({
        courseId: c.id,
        courseName: c.name,
        sks: c.sks || 2,
        grade: 'A',
      }));
    }
    return [
      { courseId: '1', courseName: 'Akuntansi Keuangan Menengah', sks: 3, grade: 'A' },
      { courseId: '2', courseName: 'Perpajakan Indonesia', sks: 3, grade: 'A' },
      { courseId: '3', courseName: 'Sistem Informasi Akuntansi', sks: 3, grade: 'A-' },
      { courseId: '4', courseName: 'Statistika Bisnis', sks: 3, grade: 'B+' },
      { courseId: '5', courseName: 'Manajemen Keuangan', sks: 3, grade: 'A' },
      { courseId: '6', courseName: 'Metodologi Penelitian', sks: 2, grade: 'A' },
      { courseId: '7', courseName: 'Etika Profesi & Tata Kelola', sks: 2, grade: 'A' },
    ];
  });

  const handleGradeChange = (index: number, newGrade: string) => {
    setGradeTargets((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], grade: newGrade };
      return updated;
    });
  };

  const handleSksChange = (index: number, newSks: number) => {
    setGradeTargets((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], sks: Math.max(1, newSks) };
      return updated;
    });
  };

  // Calculations
  const currentSemesterSks = gradeTargets.reduce((sum, item) => sum + item.sks, 0);
  const currentSemesterTotalPoints = gradeTargets.reduce(
    (sum, item) => sum + item.sks * (GRADE_POINTS[item.grade] ?? 4.0),
    0
  );
  const currentSemesterIps =
    currentSemesterSks > 0 ? currentSemesterTotalPoints / currentSemesterSks : 0;

  // Cumulative IPK calculation
  const totalCombinedSks = previousTotalSks + currentSemesterSks;
  const totalCombinedPoints =
    previousGpa * previousTotalSks + currentSemesterTotalPoints;
  const projectedCumulativeIpk =
    totalCombinedSks > 0 ? totalCombinedPoints / totalCombinedSks : 0;

  // Honors / Predicate calculation
  const getPredicate = (gpa: number) => {
    if (gpa >= 3.8) return { label: 'Summa Cum Laude / Pujian Tertinggi', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (gpa >= 3.51) return { label: 'Cum Laude / Dengan Pujian', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (gpa >= 3.0) return { label: 'Sangat Memuaskan', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (gpa >= 2.76) return { label: 'Memuaskan', color: 'text-slate-600 bg-slate-50 border-slate-200' };
    return { label: 'Cukup', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  };

  const currentPredicate = getPredicate(projectedCumulativeIpk);

  return (
    <div className="space-y-6 text-xs">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
              Prediksi IPS Semester Ini
            </span>
            <Calculator className="w-5 h-5 text-blue-200" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black">{currentSemesterIps.toFixed(2)}</span>
            <span className="text-xs text-blue-200">/ 4.00</span>
          </div>
          <p className="mt-2 text-[11px] text-blue-100">
            Total {currentSemesterSks} SKS dari {gradeTargets.length} Mata Kuliah
          </p>
        </div>

        <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
              Proyeksi IPK Kumulatif
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black">{projectedCumulativeIpk.toFixed(2)}</span>
            <span className="text-xs text-emerald-200">/ 4.00</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-100">
            Akumulasi {totalCombinedSks} SKS (Semester 1 s/d Sekarang)
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Predikat Kelulusan
              </span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div className={`mt-2.5 inline-block px-2.5 py-1 rounded-lg border text-xs font-bold ${currentPredicate.color}`}>
              {currentPredicate.label}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Pertahankan nilai A dan B+ untuk memenuhi syarat kelulusan dengan predikat pujian.
          </p>
        </div>
      </div>

      {/* Inputs for Previous GPA */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Data IPK Semester Sebelumnya</h4>
            <p className="text-[11px] text-slate-500">Masukkan riwayat IPK dan total SKS yang telah ditempuh pada semester lampau</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">IPK Lalu:</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="4.00"
              value={previousGpa}
              onChange={(e) => setPreviousGpa(Number(e.target.value))}
              className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-center"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">SKS Lulus:</label>
            <input
              type="number"
              min="0"
              max="160"
              value={previousTotalSks}
              onChange={(e) => setPreviousTotalSks(Number(e.target.value))}
              className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-center"
            />
          </div>
        </div>
      </div>

      {/* Target Grade Adjustment Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Simulasi Target Nilai Mata Kuliah Semester Ini</h3>
            <p className="text-[11px] text-slate-500">Ubah target nilai (A, B+, dll.) untuk melihat dampak langsung ke Indeks Prestasi</p>
          </div>
          <button
            onClick={() => {
              setGradeTargets((prev) => prev.map((item) => ({ ...item, grade: 'A' })));
            }}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Target Semua A (4.00)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 text-center w-12">No</th>
                <th className="p-3.5 min-w-[220px]">Nama Mata Kuliah</th>
                <th className="p-3.5 text-center w-28">Bobot SKS</th>
                <th className="p-3.5 text-center min-w-[160px]">Target Nilai Huruf</th>
                <th className="p-3.5 text-center w-28">Bobot Angka</th>
                <th className="p-3.5 text-right w-28 pr-4">Total Poin (SKS × Nilai)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gradeTargets.map((item, idx) => {
                const points = GRADE_POINTS[item.grade] ?? 4.0;
                const totalCoursePoints = item.sks * points;

                return (
                  <tr key={item.courseId || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 text-center font-bold text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-800 text-xs block">{item.courseName}</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={item.sks}
                        onChange={(e) => handleSksChange(idx, Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-center font-bold text-slate-800"
                      />
                    </td>
                    <td className="p-3.5 text-center">
                      <select
                        value={item.grade}
                        onChange={(e) => handleGradeChange(idx, e.target.value)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs border cursor-pointer ${
                          item.grade.startsWith('A')
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : item.grade.startsWith('B')
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : item.grade.startsWith('C')
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {Object.keys(GRADE_POINTS).map((g) => (
                          <option key={g} value={g}>
                            {g} ({GRADE_POINTS[g].toFixed(1)})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                      {points.toFixed(1)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-blue-600 pr-4">
                      {totalCoursePoints.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50/90 font-bold border-t border-slate-200 text-slate-900">
              <tr>
                <td colSpan={2} className="p-3.5 text-right">Total Semester Ini:</td>
                <td className="p-3.5 text-center text-blue-600">{currentSemesterSks} SKS</td>
                <td colSpan={2} className="p-3.5 text-right text-slate-600">Total Poin Kumulatif SKS:</td>
                <td className="p-3.5 text-right text-emerald-600 font-mono pr-4">{currentSemesterTotalPoints.toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
