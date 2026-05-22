import { useEffect, useMemo, useState } from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Calendar as CalIcon, AlertCircle, ChevronLeft, ChevronRight, Target, Zap } from 'lucide-react';
import { getCalendar } from '../../services/courseService';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';

export default function Calendar() {
  const [current, setCurrent] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    getCalendar()
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const year = current.getFullYear();
  const month = current.getMonth();
  const monthLabel = current.toLocaleString('en', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().getDate();

  const gridDays = useMemo(() => {
    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [firstDay, daysInMonth]);

  const eventsForDay = (day: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => {
      if (e.date) return e.date.startsWith(ds);
      return false;
    });
  };

  const upcoming = events
    .filter((e) => e.date && new Date(e.date) >= new Date(year, month, 1))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));

  if (loading) return <div className="text-slate-500 text-sm">Loading calendar...</div>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Academic Calendar"
        description="Manage your course schedules, milestones, and deadlines."
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={prevMonth} className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800">
              <ChevronLeft size={18} className="text-slate-500 dark:text-slate-400" />
            </button>
            <span className="text-sm font-extrabold text-navy-900 dark:text-white px-2 min-w-[120px] text-center">{monthLabel}</span>
            <button type="button" onClick={nextMonth} className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800">
              <ChevronRight size={18} className="text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        }
      />

      {focusMode && (
        <Card className="bg-gradient-to-r from-teal-600 to-teal-500 text-white border-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap size={24} />
            <div>
              <h3 className="font-extrabold">Focus Mode Active</h3>
              <p className="text-xs text-teal-100">Distractions minimized. Stay on track!</p>
            </div>
          </div>
          <button type="button" onClick={() => setFocusMode(false)} className="text-xs font-bold bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30">
            Exit Focus
          </button>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2" padding="md">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {gridDays.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} className="aspect-square bg-slate-50/40 dark:bg-slate-900/40 rounded-2xl" />;
              const dayEv = eventsForDay(day);
              const isToday = day === today;
              return (
                <div
                  key={day}
                  className={`aspect-square p-2 border rounded-2xl flex flex-col justify-between cursor-pointer transition-colors ${
                    isToday ? 'bg-navy-900 text-white border-navy-900 shadow-sm dark:bg-teal-600 dark:border-teal-600' : 'bg-white border-slate-100 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800/80 dark:hover:bg-slate-800/50 dark:text-white'
                  }`}
                >
                  <span className="text-xs font-bold">{day}</span>
                  {dayEv.length > 0 && (
                    <div className="flex gap-0.5 justify-center">
                      {dayEv.map((e: any) => (
                        <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${e.type === 'assignment' ? 'bg-rose-500' : 'bg-teal-500'}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h3 className="font-extrabold text-sm text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <AlertCircle size={16} className="text-slate-500 dark:text-slate-400" /> Upcoming Deadlines
            </h3>
            <div className="space-y-3">
              {upcoming.length > 0 ? upcoming.slice(0, 5).map((event: any) => (
                <div key={event.id} className={`p-4 border-l-4 rounded-2xl ${event.type === 'assignment' ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/20 dark:border-rose-500 dark:text-rose-400' : 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/20 dark:border-teal-500 dark:text-teal-400'}`}>
                  <h4 className="text-xs font-black">{event.title}</h4>
                  {event.date && (
                    <div className="flex gap-3 text-[10px] font-bold mt-2">
                      <span className="flex items-center gap-1"><CalIcon size={12} />{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">No upcoming deadlines.</p>
              )}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-navy-900 dark:text-white flex items-center gap-2">
                <Target size={16} /> Study Goals
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Keep up with your coursework and meet your deadlines.</p>
            {!focusMode && (
              <button
                type="button"
                onClick={() => setFocusMode(true)}
                className="w-full py-2.5 bg-navy-900 dark:bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-navy-800 dark:hover:bg-teal-500 transition-colors"
              >
                Enable Focus Mode
              </button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
