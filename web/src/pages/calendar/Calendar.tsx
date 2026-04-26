import { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects.api';
import { milestonesApi } from '../../api/milestones.api';
import { tasksApi } from '../../api/tasks.api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type CalendarItem = {
  id: string;
  label: string;
  date: string;
  type: 'milestone' | 'task';
  projectName: string;
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const Calendar = () => {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    projectsApi.getAll().then(async (res) => {
      const projects = res.data?.data || res.data || [];
      const all: CalendarItem[] = [];
      await Promise.all(
        projects.map(async (p: any) => {
          const [ms, ts] = await Promise.all([
            milestonesApi.getByProject(p.id).catch(() => ({ data: [] })),
            tasksApi.getByProject(p.id).catch(() => ({ data: [] })),
          ]);
          const milestones = ms.data?.data || ms.data || [];
          const tasks = ts.data?.data || ts.data || [];
          milestones.forEach((m: any) => m.dueDate && all.push({ id: m.id, label: m.name, date: m.dueDate, type: 'milestone', projectName: p.name }));
          tasks.forEach((t: any) => t.dueDate && all.push({ id: t.id, label: t.title, date: t.dueDate, type: 'task', projectName: p.name }));
        }),
      );
      setItems(all);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getItemsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return items.filter((i) => i.date.startsWith(dateStr));
  };

  const prev = () => setNow(new Date(year, month - 1, 1));
  const next = () => setNow(new Date(year, month + 1, 1));

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">Milestones and task due dates</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl shadow-sm p-1">
          <button onClick={prev} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><ChevronLeft size={16} /></button>
          <span className="font-semibold text-slate-900 min-w-[110px] text-center text-sm">{MONTHS[month]} {year}</span>
          <button onClick={next} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {DAYS.map((d) => (
              <div key={d} className="px-3 py-3 text-xs font-semibold text-slate-500 text-center uppercase tracking-wide">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const dayItems = day ? getItemsForDay(day) : [];
              return (
                <div key={idx}
                  className={`min-h-[100px] p-2 border-b border-r border-slate-100 transition-colors ${
                    !day ? 'bg-slate-50/40' : 'hover:bg-slate-50/60'
                  } ${idx % 7 === 6 ? 'border-r-0' : ''}`}>
                  {day && (
                    <>
                      <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mb-1 ${
                        isToday(day) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-700'
                      }`}>{day}</span>
                      <div className="space-y-0.5">
                        {dayItems.slice(0, 3).map((item) => (
                          <div key={item.id} title={`${item.projectName}: ${item.label}`}
                            className={`text-xs px-1.5 py-0.5 rounded-md truncate font-medium ${
                              item.type === 'milestone' ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>{item.label}</div>
                        ))}
                        {dayItems.length > 3 && (
                          <div className="text-xs text-slate-400 px-1">+{dayItems.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-5 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-violet-100 border border-violet-300" />
          <span className="text-xs text-slate-500">Milestone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-indigo-100 border border-indigo-300" />
          <span className="text-xs text-slate-500">Task</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
