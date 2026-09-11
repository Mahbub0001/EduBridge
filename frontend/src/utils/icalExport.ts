/**
 * RFC 5545 iCalendar (.ics) export generator for EduBridge Calendar
 */

function formatICSDate(dateStr: string, timeStr?: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  // If time string is provided (e.g. "10:00 AM" or "14:30")
  if (timeStr) {
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3];
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }
      d.setHours(hours, minutes, 0, 0);
    }
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const mins = pad(d.getUTCMinutes());
  const secs = pad(d.getUTCSeconds());

  return `${year}${month}${day}T${hours}${mins}${secs}Z`;
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function exportEventsToICS(events: any[], filename = 'edubridge-study-schedule.ics') {
  const dtStamp = formatICSDate(new Date().toISOString());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduBridge MOOC Platform//Student Study Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:EduBridge Study Planner',
    'X-WR-TIMEZONE:UTC',
  ];

  for (const ev of events) {
    if (!ev.date) continue;

    const startDT = formatICSDate(ev.date, ev.time);
    const endDate = new Date(ev.date);
    endDate.setHours(endDate.getHours() + (ev.duration_mins ? Math.round(ev.duration_mins / 60) : 1));
    const endDT = formatICSDate(endDate.toISOString(), ev.time);

    const title = escapeICSText(ev.title || 'EduBridge Task');
    const courseTitle = ev.course_title ? `Course: ${ev.course_title}\n` : '';
    const desc = escapeICSText(`${courseTitle}${ev.description || ''}\nType: ${ev.type || 'Study'}\nPriority: ${ev.priority || 'Normal'}`);
    const uid = `${ev.id || Math.random().toString(36).substring(2)}@edubridge.platform`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART:${startDT}`);
    lines.push(`DTEND:${endDT}`);
    lines.push(`SUMMARY:${title}`);
    lines.push(`DESCRIPTION:${desc}`);
    lines.push(`STATUS:${ev.completed ? 'COMPLETED' : 'CONFIRMED'}`);
    lines.push(`CATEGORIES:${(ev.type || 'STUDY').toUpperCase()}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  const icsContent = lines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
