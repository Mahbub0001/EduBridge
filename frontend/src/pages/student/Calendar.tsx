import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Calendar as CalIcon,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  BookOpen,
  Trash2,
  X,
  Play,
  Pause,
  RotateCcw,
  Target,
  Sparkles,
  Check,
  LayoutGrid,
  CalendarRange,
  ListFilter,
  ExternalLink,
  Flame,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getCalendar,
  createCalendarEvent,
  deleteCalendarEvent,
  toggleCalendarEvent,
  getMyCourses,
} from '../../services/courseService';
import { exportEventsToICS } from '../../utils/icalExport';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useTranslation } from '../../utils/translations';
import { cn } from '../../lib/utils';
import type { Course } from '../../types';

interface CalendarEventItem {
  id: string;
  raw_id?: string;
  title: string;
  description?: string;
  type: 'assignment' | 'quiz' | 'study' | 'exam' | 'personal' | 'reminder';
  course_id?: string;
  course_title?: string;
  category?: string;
  date: string; // YYYY-MM-DD
  time?: string;
  duration_mins?: number;
  priority?: 'high' | 'medium' | 'low';
  completed?: boolean;
  is_custom?: boolean;
  total_marks?: number;
  questions_count?: number;
  is_relative_deadline?: boolean;
  due_days?: number;
  late_penalty?: number;
  allow_late?: boolean;
}

type ViewMode = 'month' | 'week' | 'agenda';
type FilterType = 'all' | 'assignment' | 'quiz' | 'study' | 'completed';

export default function Calendar() {
  const { t, language } = useTranslation();
  const [current, setCurrent] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filterType, setFilterType] = useState<FilterType>('all');
  
  // Pomodoro Focus Timer State
  const [focusMode, setFocusMode] = useState(false);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break' | 'deep'>('focus');
  const [completedSessions, setCompletedSessions] = useState(0);
  const timerRef = useRef<any>(null);

  // Add Event Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    duration_mins: 60,
    type: 'study' as 'study' | 'exam' | 'reminder' | 'personal',
    course_id: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
  });

  const loadData = async () => {
    try {
      const [calData, enrolledCourses] = await Promise.all([
        getCalendar(),
        getMyCourses().catch(() => []),
      ]);
      setEvents(calData || []);
      setCourses(enrolledCourses || []);
    } catch (err) {
      console.error('Failed to load calendar data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pomodoro Interval Handler
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setPomodoroSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsTimerRunning(false);
            if (timerMode === 'focus' || timerMode === 'deep') {
              setCompletedSessions((c) => c + 1);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timerMode]);

  const setTimerPreset = (mode: 'focus' | 'break' | 'deep') => {
    setIsTimerRunning(false);
    setTimerMode(mode);
    if (mode === 'focus') setPomodoroSeconds(25 * 60);
    else if (mode === 'break') setPomodoroSeconds(5 * 60);
    else if (mode === 'deep') setPomodoroSeconds(50 * 60);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Date Calculations
  const year = current.getFullYear();
  const month = current.getMonth();
  const monthLabel = current.toLocaleString(language === 'bn' ? 'bn-BD' : 'en', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = new Date();
  const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() === month;
  const todayDay = isCurrentMonth ? todayDate.getDate() : -1;

  const weekdays = language === 'bn' 
    ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const gridDays = useMemo(() => {
    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [firstDay, daysInMonth]);

  // Week View Calculations
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const dayOfWeek = curr.getDay();
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - dayOfWeek);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const getEventDateKey = (dateVal?: string): string => {
  if (!dateVal) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  } catch {}
  return dateVal.slice(0, 10);
};

  // Filter Events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterType === 'all') return true;
      if (filterType === 'completed') return e.completed;
      if (filterType === 'study') return e.type === 'study' || e.type === 'personal' || e.type === 'reminder' || e.type === 'exam';
      return e.type === filterType;
    });
  }, [events, filterType]);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const getEventsForDateStr = (dateStr: string) => {
    return filteredEvents.filter((e) => getEventDateKey(e.date) === dateStr);
  };

  const getAllEventsForDateStr = (dateStr: string) => {
    return events.filter((e) => getEventDateKey(e.date) === dateStr);
  };

  const eventsForDay = (day: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return getEventsForDateStr(ds);
  };

  const allEventsForDay = (day: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return getAllEventsForDateStr(ds);
  };

  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedDayFilteredEvents = getEventsForDateStr(selectedDateStr);
  const selectedDayAllEvents = getAllEventsForDateStr(selectedDateStr);
  const displayDayEvents = selectedDayFilteredEvents.length > 0 ? selectedDayFilteredEvents : selectedDayAllEvents;

  // Events in current viewed month matching active filter
  const currentMonthFilteredEvents = useMemo(() => {
    return filteredEvents.filter((e) => getEventDateKey(e.date).startsWith(monthPrefix));
  }, [filteredEvents, monthPrefix]);

  // Events in other months matching active filter
  const otherMonthsFilteredEvents = useMemo(() => {
    return filteredEvents.filter((e) => !getEventDateKey(e.date).startsWith(monthPrefix));
  }, [filteredEvents, monthPrefix]);

  // Months containing events across all data
  const monthsWithEvents = useMemo(() => {
    const map = new Map<string, { year: number; month: number; label: string; count: number }>();
    events.forEach((e) => {
      const dKey = getEventDateKey(e.date);
      if (dKey) {
        const [yStr, mStr] = dKey.split('-');
        const y = parseInt(yStr, 10);
        const m = parseInt(mStr, 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          const key = `${y}-${m}`;
          const existing = map.get(key);
          const tempDate = new Date(y, m, 1);
          const label = tempDate.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en', { month: 'short', year: 'numeric' });
          if (existing) {
            existing.count += 1;
          } else {
            map.set(key, { year: y, month: m, label, count: 1 });
          }
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
  }, [events, language]);

  const upcomingList = useMemo(() => {
    return [...filteredEvents]
      .filter((e) => e.date)
      .sort((a, b) => (getEventDateKey(a.date) || '').localeCompare(getEventDateKey(b.date) || ''))
      .slice(0, 10);
  }, [filteredEvents]);

  // Navigation handlers
  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrent(now);
    setSelectedDate(now);
  };

  // Event Mutations
  const handleToggleEvent = async (ev: CalendarEventItem) => {
    if (ev.is_custom) {
      try {
        const res = await toggleCalendarEvent(ev.raw_id || ev.id);
        setEvents((prev) =>
          prev.map((item) => (item.id === ev.id ? { ...item, completed: res.completed } : item))
        );
      } catch (err) {
        console.error('Failed to toggle event', err);
      }
    }
  };

  const handleDeleteEvent = async (ev: CalendarEventItem) => {
    if (!ev.is_custom) return;
    try {
      await deleteCalendarEvent(ev.raw_id || ev.id);
      setEvents((prev) => prev.filter((item) => item.id !== ev.id));
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await createCalendarEvent(newEvent);
      setEvents((prev) => [res, ...prev]);
      setIsModalOpen(false);
      setNewEvent({
        title: '',
        date: selectedDateStr,
        time: '10:00 AM',
        duration_mins: 60,
        type: 'study',
        course_id: '',
        description: '',
        priority: 'medium',
      });
    } catch (err) {
      console.error('Failed to create event', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Weekly stats
  const weeklyCompletion = useMemo(() => {
    const total = filteredEvents.length;
    const done = filteredEvents.filter((e) => e.completed).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 100;
    return { total, done, pct };
  }, [filteredEvents]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <PageHeader
        title={t('calendarTitle')}
        description={t('calendarDesc')}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2 font-bold text-xs bg-white dark:bg-slate-900 shadow-xs"
              onClick={() => exportEventsToICS(events)}
            >
              <Download size={14} className="text-teal-600 dark:text-teal-400" />
              Export .ics
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="rounded-xl gap-2 font-bold text-xs bg-navy-900 dark:bg-teal-600 text-white shadow-sm hover:shadow-md"
              onClick={() => {
                setNewEvent((prev) => ({ ...prev, date: selectedDateStr }));
                setIsModalOpen(true);
              }}
            >
              <Plus size={14} />
              Add Study Plan
            </Button>
          </div>
        }
      />

      {/* Control Bar: View Switcher, Month Navigation & Focus Mode */}
      <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={18} className="text-slate-600 dark:text-slate-300" />
            </button>
            <span className="text-base font-extrabold text-navy-900 dark:text-white px-3 min-w-[150px] text-center tracking-tight">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight size={18} className="text-slate-600 dark:text-slate-300" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 ml-1"
            >
              Today
            </button>
          </div>

          {/* View Switcher & Focus Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  viewMode === 'month'
                    ? 'bg-white dark:bg-slate-900 text-navy-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <LayoutGrid size={13} />
                Month
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  viewMode === 'week'
                    ? 'bg-white dark:bg-slate-900 text-navy-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <CalendarRange size={13} />
                Week
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  viewMode === 'agenda'
                    ? 'bg-white dark:bg-slate-900 text-navy-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <ListFilter size={13} />
                Agenda
              </button>
            </div>

            <button
              type="button"
              onClick={() => setFocusMode(!focusMode)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border',
                focusMode
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              <Sparkles size={14} className={focusMode ? 'text-amber-300' : 'text-teal-600'} />
              Focus Timer
            </button>
          </div>
        </div>

        {/* Quick Month Jumps for Months with Events */}
        {monthsWithEvents.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <CalIcon size={12} className="text-teal-600" /> Milestone Months:
            </span>
            {monthsWithEvents.map((m) => {
              const isViewing = m.year === year && m.month === month;
              return (
                <button
                  key={`${m.year}-${m.month}`}
                  type="button"
                  onClick={() => {
                    setCurrent(new Date(m.year, m.month, 1));
                    setSelectedDate(new Date(m.year, m.month, 1));
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all shrink-0 flex items-center gap-1.5 border',
                    isViewing
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  )}
                >
                  <span>{m.label}</span>
                  <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-extrabold', isViewing ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300')}>
                    {m.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pomodoro Focus Timer Panel */}
      {focusMode && (
        <Card className="bg-gradient-to-br from-slate-900 via-navy-900 to-slate-900 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Pomodoro Focus Zone
                </span>
                <span className="flex items-center gap-1 text-xs text-amber-300 font-bold">
                  <Flame size={13} /> {completedSessions} Sessions Completed
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight">Stay Focused, Achieve Mastery</h3>
              <p className="text-xs text-slate-300 max-w-md">
                Eliminate distractions and tackle your course milestones with focused intervals.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Presets */}
              <div className="flex bg-white/10 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTimerPreset('focus')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    timerMode === 'focus' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                  )}
                >
                  25m Focus
                </button>
                <button
                  type="button"
                  onClick={() => setTimerPreset('deep')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    timerMode === 'deep' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                  )}
                >
                  50m Deep
                </button>
                <button
                  type="button"
                  onClick={() => setTimerPreset('break')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    timerMode === 'break' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                  )}
                >
                  5m Break
                </button>
              </div>

              {/* Digital Timer & Action Buttons */}
              <div className="flex items-center gap-4">
                <span className="text-4xl font-black font-mono tracking-wider text-teal-400">
                  {formatTimer(pomodoroSeconds)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="w-12 h-12 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  {isTimerRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5 fill-white" />}
                </button>
                <button
                  type="button"
                  onClick={() => setTimerPreset(timerMode)}
                  className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors"
                  title="Reset Timer"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <Filter size={13} /> Filter:
        </span>
        {[
          { key: 'all', label: 'All Events', count: events.length },
          { key: 'assignment', label: 'Assignments', count: events.filter((e) => e.type === 'assignment').length, color: 'text-rose-600 dark:text-rose-400' },
          { key: 'quiz', label: 'Quizzes', count: events.filter((e) => e.type === 'quiz').length, color: 'text-purple-600 dark:text-purple-400' },
          { key: 'study', label: 'Study Goals', count: events.filter((e) => e.type === 'study' || e.type === 'personal' || e.type === 'exam' || e.type === 'reminder').length, color: 'text-teal-600 dark:text-teal-400' },
          { key: 'completed', label: 'Completed', count: events.filter((e) => e.completed).length, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterType(tab.key as FilterType)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-1.5 shadow-xs',
              filterType === tab.key
                ? 'bg-navy-900 text-white border-navy-900 dark:bg-teal-600 dark:border-teal-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            )}
          >
            <span>{tab.label}</span>
            <span className={cn('px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800', filterType === tab.key && 'bg-white/20 text-white')}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Other Months Milestones Notice / Quick Jump */}
      {filterType !== 'all' && currentMonthFilteredEvents.length === 0 && otherMonthsFilteredEvents.length > 0 && (
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle size={18} />
            </div>
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-sm text-navy-900 dark:text-amber-100">
                0 {filterType === 'quiz' ? 'Quizzes' : filterType === 'assignment' ? 'Assignments' : 'Tasks'} in {monthLabel}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                You have {otherMonthsFilteredEvents.length} {filterType === 'quiz' ? 'quiz(zes)' : filterType === 'assignment' ? 'assignment(s)' : 'task(s)'} scheduled in other months:{' '}
                <span className="font-semibold text-navy-900 dark:text-white">
                  {otherMonthsFilteredEvents.map((e) => `${e.title} (${new Date(e.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en', { month: 'short', year: 'numeric' })})`).join(', ')}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {otherMonthsFilteredEvents.slice(0, 2).map((e) => {
              const eDate = new Date(e.date);
              return (
                <Button
                  key={e.id}
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setCurrent(new Date(eDate.getFullYear(), eDate.getMonth(), 1));
                    setSelectedDate(eDate);
                  }}
                  className="rounded-xl text-xs font-bold gap-1 !bg-amber-600 hover:!bg-amber-700 text-white shadow-xs"
                >
                  <CalendarRange size={13} />
                  Jump to {eDate.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en', { month: 'short', year: 'numeric' })}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('agenda')}
              className="rounded-xl text-xs font-bold border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              View Agenda
            </Button>
          </div>
        </div>
      )}

      {/* Main Calendar View & Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Month / Week / Agenda View */}
        <div className="lg:col-span-2 space-y-6">
          {viewMode === 'month' && (
            <Card padding="md" className="shadow-sm border-slate-200/80 dark:border-slate-800/80">
              {/* Weekday Header */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                {weekdays.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 gap-2">
                {gridDays.map((day, i) => {
                  if (day === null) {
                    return <div key={`empty-${i}`} className="aspect-square bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl" />;
                  }

                  const dayEv = eventsForDay(day);
                  const dayAllEv = allEventsForDay(day);
                  const isToday = day === todayDay;
                  const isSelected = selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day;

                  return (
                    <div
                      key={`day-${day}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDate(new Date(year, month, day))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedDate(new Date(year, month, day));
                        }
                      }}
                      className={cn(
                        'aspect-square p-2 border rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-200 relative group overflow-hidden',
                        isSelected
                          ? 'ring-2 ring-teal-500 border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 shadow-xs'
                          : isToday
                          ? 'bg-teal-50/20 dark:bg-teal-950/20 border-teal-300 dark:border-teal-700/80 hover:bg-teal-50/40'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        {isToday ? (
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black bg-teal-600 text-white shadow-xs shrink-0">
                            {day}
                          </span>
                        ) : (
                          <span className={cn(
                            'text-xs font-extrabold w-6 h-6 flex items-center justify-center shrink-0',
                            isSelected ? 'text-teal-700 dark:text-teal-300' : 'text-slate-900 dark:text-white'
                          )}>
                            {day}
                          </span>
                        )}
                        {isToday && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 shrink-0">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Event Count & Badges */}
                      {dayEv.length > 0 ? (
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {dayEv.slice(0, 3).map((e) => (
                              <span
                                key={e.id}
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  e.completed
                                    ? 'bg-emerald-500'
                                    : e.type === 'assignment'
                                    ? 'bg-rose-500'
                                    : e.type === 'quiz'
                                    ? 'bg-purple-500'
                                    : 'bg-teal-500'
                                )}
                              />
                            ))}
                          </div>
                          <div className="hidden sm:block">
                            <span className="text-[10px] font-bold block truncate px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {dayEv[0].title}
                            </span>
                          </div>
                        </div>
                      ) : dayAllEv.length > 0 ? (
                        <div className="space-y-1 opacity-45">
                          <div className="flex flex-wrap gap-1">
                            {dayAllEv.slice(0, 3).map((e) => (
                              <span
                                key={e.id}
                                className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
                              />
                            ))}
                          </div>
                          <div className="hidden sm:block">
                            <span className="text-[9px] font-medium block truncate px-1.5 py-0.5 rounded-md bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
                              {dayAllEv[0].title}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {viewMode === 'week' && (
            <Card padding="md" className="shadow-sm border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <div className="grid grid-cols-7 gap-3">
                {weekDays.map((d) => {
                  const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  const dayEvents = getEventsForDateStr(ds);
                  const isToday = d.toDateString() === todayDate.toDateString();
                  const isSelected = d.toDateString() === selectedDate.toDateString();

                  return (
                    <div
                      key={ds}
                      onClick={() => setSelectedDate(d)}
                      className={cn(
                        'flex flex-col p-3 rounded-2xl border min-h-[300px] cursor-pointer transition-all',
                        isSelected
                          ? 'border-teal-500 ring-2 ring-teal-500/30 bg-teal-50/20 dark:bg-teal-950/20'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      )}
                    >
                      <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                        <span className="text-[11px] font-bold text-slate-400 block uppercase">
                          {d.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en', { weekday: 'short' })}
                        </span>
                        <span className={cn(
                          'text-sm font-black inline-flex items-center justify-center w-7 h-7 rounded-full mt-1',
                          isToday
                            ? 'bg-teal-600 text-white shadow-xs'
                            : isSelected
                            ? 'text-teal-700 dark:text-teal-300'
                            : 'text-slate-900 dark:text-white'
                        )}>
                          {d.getDate()}
                        </span>
                      </div>

                      <div className="flex-1 space-y-2 overflow-y-auto">
                        {dayEvents.length > 0 ? (
                          dayEvents.map((ev) => (
                            <div
                              key={ev.id}
                              className={cn(
                                'p-2 rounded-xl text-left text-[11px] border',
                                ev.completed
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                                  : ev.type === 'assignment'
                                  ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'
                                  : ev.type === 'quiz'
                                  ? 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300'
                                  : 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-950/30 dark:border-teal-800 dark:text-teal-300'
                              )}
                            >
                              <span className="font-bold block truncate">{ev.title}</span>
                              <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>{ev.time || '11:59 PM'}</span>
                                {ev.is_relative_deadline && ev.due_days ? (
                                  <span className="font-extrabold text-teal-700 dark:text-teal-400">+{ev.due_days}d</span>
                                ) : null}
                              </div>
                            </div>
                          ))
                        ) : getAllEventsForDateStr(ds).length > 0 ? (
                          getAllEventsForDateStr(ds).map((ev) => (
                            <div
                              key={ev.id}
                              className="p-2 rounded-xl text-left text-[11px] border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 opacity-60"
                            >
                              <span className="font-semibold block truncate">{ev.title}</span>
                              <span className="text-[9px] block mt-0.5 capitalize">{ev.type}</span>
                            </div>
                          ))
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {viewMode === 'agenda' && (
            <Card padding="lg" className="shadow-sm border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <h3 className="text-base font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
                <CalendarRange size={18} className="text-teal-600" />
                Comprehensive Study & Assessment Agenda
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingList.length > 0 ? (
                  upcomingList.map((ev) => (
                    <div key={ev.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          ev.completed
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : ev.type === 'assignment'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : ev.type === 'quiz'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                            : 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400'
                        )}>
                          {ev.type === 'assignment' ? <AlertCircle size={18} /> : ev.type === 'quiz' ? <Target size={18} /> : <BookOpen size={18} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={cn('text-sm font-bold text-navy-900 dark:text-white', ev.completed && 'line-through opacity-70')}>
                              {ev.title}
                            </h4>
                            {ev.is_relative_deadline && ev.due_days ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                                {ev.due_days}d from enrollment
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {ev.course_title || 'General'} • {ev.date} at {ev.time || '11:59 PM'}
                            {ev.allow_late && ev.late_penalty ? ` • Late allowed (-${ev.late_penalty}%)` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ev.is_custom && (
                          <button
                            type="button"
                            onClick={() => handleToggleEvent(ev)}
                            className={cn(
                              'p-2 rounded-xl text-xs font-bold border transition-colors',
                              ev.completed
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                            )}
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {ev.type === 'assignment' && (
                          <Link to="/student/assignments">
                            <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1">
                              View <ExternalLink size={12} />
                            </Button>
                          </Link>
                        )}
                        {ev.type === 'quiz' && ev.course_id && (
                          <Link to={`/student/courses/${ev.course_id}/learn`}>
                            <Button variant="primary" size="sm" className="rounded-xl text-xs font-bold gap-1 !bg-navy-900 dark:!bg-teal-600 text-white">
                              Take Quiz <ExternalLink size={12} />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 py-8 text-center">No agenda events match your filters.</p>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Selected Day Inspector & Study Progress */}
        <div className="space-y-6">
          {/* Day Inspector Card */}
          <Card className="space-y-5 shadow-sm border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400 block">
                  Day Inspector
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-base font-black text-navy-900 dark:text-white tracking-tight">
                    {selectedDate.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h3>
                  {selectedDate.toDateString() === todayDate.toDateString() && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 shrink-0">
                      Today
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold gap-1"
                onClick={() => {
                  setNewEvent((prev) => ({ ...prev, date: selectedDateStr }));
                  setIsModalOpen(true);
                }}
              >
                <Plus size={13} /> Add
              </Button>
            </div>

            {/* List of Tasks on Selected Date */}
            <div className="space-y-3">
              {displayDayEvents.length > 0 ? (
                <>
                  {filterType !== 'all' && selectedDayFilteredEvents.length === 0 && selectedDayAllEvents.length > 0 && (
                    <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                      <span>
                        No {filterType === 'quiz' ? 'quizzes' : filterType === 'assignment' ? 'assignments' : filterType} on this day. Showing other task(s):
                      </span>
                      <button
                        type="button"
                        onClick={() => setFilterType('all')}
                        className="underline text-[10px] hover:text-amber-800 dark:hover:text-amber-200 font-extrabold shrink-0"
                      >
                        Reset Filter
                      </button>
                    </div>
                  )}
                  {displayDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={cn(
                        'p-3.5 rounded-2xl border transition-all flex flex-col gap-2',
                        ev.completed
                          ? 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 opacity-80'
                          : ev.type === 'assignment'
                          ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/60'
                          : ev.type === 'quiz'
                          ? 'bg-purple-50/70 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800/60'
                          : 'bg-teal-50/70 border-teal-200 dark:bg-teal-950/20 dark:border-teal-800/60'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          {ev.is_custom && (
                            <button
                              type="button"
                              onClick={() => handleToggleEvent(ev)}
                              className={cn(
                                'w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 transition-colors',
                                ev.completed
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                              )}
                            >
                              {ev.completed && <Check size={12} className="stroke-[3]" />}
                            </button>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className={cn('text-xs font-extrabold text-navy-900 dark:text-white', ev.completed && 'line-through')}>
                                {ev.title}
                              </h4>
                              {ev.is_relative_deadline && ev.due_days ? (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                                  {ev.due_days}d from enrollment
                                </span>
                              ) : null}
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                              {ev.course_title || 'Self Study'}
                              {ev.allow_late && ev.late_penalty ? ` (Late allowed: -${ev.late_penalty}%)` : ''}
                            </span>
                          </div>
                        </div>

                        {ev.is_custom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            title="Delete task"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-1 border-t border-black/5 dark:border-white/5">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {ev.time || '10:00 AM'}
                        </span>
                        <Badge variant={ev.type === 'assignment' ? 'danger' : ev.type === 'quiz' ? 'purple' : 'teal'}>
                          {ev.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 space-y-2">
                  <CalIcon size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-medium">No tasks scheduled for this day.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-bold"
                    onClick={() => {
                      setNewEvent((prev) => ({ ...prev, date: selectedDateStr }));
                      setIsModalOpen(true);
                    }}
                  >
                    Schedule Study Task
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Weekly Goals & Milestone Progress Card */}
          <Card className="space-y-4 shadow-sm border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-navy-900 dark:text-white flex items-center gap-2">
                <Target size={16} className="text-teal-600" /> Study Goals & Progress
              </h3>
              <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400">
                {weeklyCompletion.done}/{weeklyCompletion.total} Done
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-400 transition-all duration-500"
                style={{ width: `${weeklyCompletion.pct}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-lg font-black text-navy-900 dark:text-white">{events.filter((e) => e.type === 'assignment').length}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Assignments</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-lg font-black text-navy-900 dark:text-white">{events.filter((e) => e.type === 'quiz').length}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Quizzes</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Study Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-navy-900 dark:text-white text-base">Schedule Study Task</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Plan personal study slots, review milestones & goals.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Review Module 3 Neural Networks, Prepare Quiz"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Category</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="study">Study Session</option>
                    <option value="exam">Exam Prep</option>
                    <option value="reminder">Deadline Reminder</option>
                    <option value="personal">Personal Goal</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Related Course</label>
                  <select
                    value={newEvent.course_id}
                    onChange={(e) => setNewEvent({ ...newEvent, course_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="">General / None</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Additional study notes, links, or objectives..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-xl font-bold !bg-navy-900 dark:!bg-teal-600 text-white"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Study Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
