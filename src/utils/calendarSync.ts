import { Course, CourseAssignment, AgendaEvent } from '../types/index.ts';

// Helper to format date to iCal UTC format (YYYYMMDDTHHmmssZ)
function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function formatICalLocalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

// Convert day string ('Senin', 'Selasa', etc.) to next date in current semester
function getNextDayOfWeekDate(dayName: string, hourStart: number, minStart: number): Date {
  const dayMap: Record<string, number> = {
    minggu: 0,
    senin: 1,
    selasa: 2,
    rabu: 3,
    kamis: 4,
    jumat: 5,
    sabtu: 6,
  };

  const targetDay = dayMap[dayName.toLowerCase().trim()] ?? 1;
  const now = new Date();
  const currentDay = now.getDay();
  let distance = targetDay - currentDay;
  if (distance < 0) distance += 7;

  const result = new Date(now.getFullYear(), now.getMonth(), now.getDate() + distance, hourStart, minStart, 0);
  return result;
}

// Parse schedule time string e.g. "08:00 - 10:30 WIB"
function parseScheduleTime(timeStr?: string): { startH: number; startM: number; endH: number; endM: number } {
  if (!timeStr) return { startH: 8, startM: 0, endH: 10, endM: 0 };
  const matches = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (matches) {
    return {
      startH: parseInt(matches[1], 10),
      startM: parseInt(matches[2], 10),
      endH: parseInt(matches[3], 10),
      endM: parseInt(matches[4], 10),
    };
  }
  return { startH: 8, startM: 0, endH: 10, endM: 0 };
}

// Generate Google Calendar Link for a Course
export function getGoogleCalendarCourseUrl(course: Course): string {
  const { startH, startM, endH, endM } = parseScheduleTime(course.schedule_time);
  const startDate = getNextDayOfWeekDate(course.schedule_day || 'Senin', startH, startM);
  const endDate = new Date(startDate.getTime() + (endH - startH) * 3600000 + (endM - startM) * 60000);

  const startStr = formatICalDate(startDate);
  const endStr = formatICalDate(endDate);

  const title = encodeURIComponent(`[Kuliah] ${course.name} (${course.sks} SKS)`);
  const details = encodeURIComponent(
    `Mata Kuliah: ${course.name}\nKode: ${course.code}\nSKS: ${course.sks}\nDosen Pengampu: ${course.lecturer_name}\nKontak WA: ${course.lecturer_phone || '-'}\nKelas: 01SAKP014 - Semester 3`
  );
  const location = encodeURIComponent(course.room || 'Kampus Universitas Pamulang');

  // Recur weekly until end of semester (e.g. 5 months ahead)
  const rrule = encodeURIComponent('RRULE:FREQ=WEEKLY;COUNT=16');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}&recur=${rrule}`;
}

// Generate Google Calendar Link for an Assignment Deadline
export function getGoogleCalendarAssignmentUrl(asg: CourseAssignment): string {
  const deadDate = new Date(asg.deadline);
  // Default to 23:59 on deadline date
  deadDate.setHours(23, 59, 0, 0);
  const startDate = new Date(deadDate.getTime() - 3600000); // 1 hour before

  const startStr = formatICalDate(startDate);
  const endStr = formatICalDate(deadDate);

  const title = encodeURIComponent(`[Deadline Tugas] ${asg.title} - ${asg.course_name || 'Matkul'}`);
  const details = encodeURIComponent(
    `Pengumpulan Tugas: ${asg.title}\nMata Kuliah: ${asg.course_name || '-'}\nDeskripsi: ${asg.description || '-'}\nLink Soal/Drive: ${asg.drive_folder_url || '-'}\nKelas: 01SAKP014`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
}

// Generate Complete .ICS (iCal) File for all 8 Courses & Assignments
export function exportAllScheduleToICal(
  courses: Course[],
  assignments: CourseAssignment[] = [],
  agendas: AgendaEvent[] = []
): void {
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kelas Manajer 01SAKP014//Jadwal Perkuliahan//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Jadwal Kuliah & Tugas 01SAKP014',
    'X-WR-TIMEZONE:Asia/Jakarta',
  ];

  // Add all courses with weekly recurrence
  courses.forEach((c) => {
    const { startH, startM, endH, endM } = parseScheduleTime(c.schedule_time);
    const startDate = getNextDayOfWeekDate(c.schedule_day || 'Senin', startH, startM);
    const endDate = new Date(startDate.getTime() + (endH - startH) * 3600000 + (endM - startM) * 60000);

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:course-${c.id}-${Date.now()}@kelasmanajer.app`);
    icsContent.push(`DTSTAMP:${formatICalDate(new Date())}`);
    icsContent.push(`DTSTART:${formatICalDate(startDate)}`);
    icsContent.push(`DTEND:${formatICalDate(endDate)}`);
    icsContent.push('RRULE:FREQ=WEEKLY;COUNT=16'); // 16 meetings per semester
    icsContent.push(`SUMMARY:[Kuliah] ${c.name} (${c.sks} SKS)`);
    icsContent.push(
      `DESCRIPTION:Dosen: ${c.lecturer_name}\\nKontak: ${c.lecturer_phone || '-'}\\nKode: ${c.code}\\nRuang: ${c.room || 'R. 402'}`
    );
    icsContent.push(`LOCATION:${c.room || 'Kampus Universitas Pamulang'}`);
    icsContent.push('STATUS:CONFIRMED');
    icsContent.push('BEGIN:VALARM');
    icsContent.push('TRIGGER:-PT30M'); // 30 mins before
    icsContent.push('ACTION:DISPLAY');
    icsContent.push(`DESCRIPTION:Pengingat Kuliah: ${c.name}`);
    icsContent.push('END:VALARM');
    icsContent.push('END:VEVENT');
  });

  // Add assignments deadlines
  assignments.forEach((asg) => {
    const deadDate = new Date(asg.deadline);
    deadDate.setHours(23, 59, 0, 0);
    const startDate = new Date(deadDate.getTime() - 3600000);

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:asg-${asg.id}@kelasmanajer.app`);
    icsContent.push(`DTSTAMP:${formatICalDate(new Date())}`);
    icsContent.push(`DTSTART:${formatICalDate(startDate)}`);
    icsContent.push(`DTEND:${formatICalDate(deadDate)}`);
    icsContent.push(`SUMMARY:[Deadline Tugas] ${asg.title}`);
    icsContent.push(`DESCRIPTION:Matkul: ${asg.course_name || '-'}\\nDeskripsi: ${asg.description || '-'}`);
    icsContent.push('STATUS:CONFIRMED');
    icsContent.push('BEGIN:VALARM');
    icsContent.push('TRIGGER:-P1D'); // 1 day before
    icsContent.push('ACTION:DISPLAY');
    icsContent.push(`DESCRIPTION:H-1 Deadline Tugas: ${asg.title}`);
    icsContent.push('END:VALARM');
    icsContent.push('END:VEVENT');
  });

  // Add agenda events
  agendas.forEach((ag) => {
    const agDate = new Date(ag.date || (ag as any).event_date || Date.now());
    const endDate = new Date(agDate.getTime() + 7200000); // 2 hours

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:agenda-${ag.id}@kelasmanajer.app`);
    icsContent.push(`DTSTAMP:${formatICalDate(new Date())}`);
    icsContent.push(`DTSTART:${formatICalDate(agDate)}`);
    icsContent.push(`DTEND:${formatICalDate(endDate)}`);
    icsContent.push(`SUMMARY:[Agenda] ${ag.title}`);
    icsContent.push(`DESCRIPTION:${ag.description || '-'}`);
    icsContent.push(`LOCATION:${ag.location || '-'}`);
    icsContent.push('STATUS:CONFIRMED');
    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', 'Jadwal_Kuliah_01SAKP014_Semester3.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateGoogleCalendarUrl(params: {
  title: string;
  details?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}): string {
  const start = params.startDate ? new Date(params.startDate) : new Date();
  const end = params.endDate ? new Date(params.endDate) : new Date(start.getTime() + 7200000);
  const startStr = formatICalDate(start);
  const endStr = formatICalDate(end);
  const title = encodeURIComponent(params.title || 'Jadwal Perkuliahan');
  const details = encodeURIComponent(params.details || '');
  const location = encodeURIComponent(params.location || '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

export function downloadIcsFile(params: {
  filename?: string;
  title?: string;
  events: Array<{
    title: string;
    details?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
  }>;
}): void {
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kelas Manajer 01SAKP014//Jadwal Perkuliahan//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${params.title || 'Jadwal Kuliah 01SAKP014'}`,
    'X-WR-TIMEZONE:Asia/Jakarta',
  ];

  params.events.forEach((ev, idx) => {
    const start = ev.startDate ? new Date(ev.startDate) : new Date();
    const end = ev.endDate ? new Date(ev.endDate) : new Date(start.getTime() + 7200000);
    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:bulk-event-${idx}-${Date.now()}@kelasmanajer.app`);
    icsContent.push(`DTSTAMP:${formatICalDate(new Date())}`);
    icsContent.push(`DTSTART:${formatICalDate(start)}`);
    icsContent.push(`DTEND:${formatICalDate(end)}`);
    icsContent.push(`SUMMARY:${ev.title}`);
    icsContent.push(`DESCRIPTION:${(ev.details || '').replace(/\n/g, '\\n')}`);
    icsContent.push(`LOCATION:${ev.location || ''}`);
    icsContent.push('STATUS:CONFIRMED');
    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', params.filename || 'Jadwal_Kuliah_01SAKP014.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

