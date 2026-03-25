import { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects.api';
import { milestonesApi } from '../../api/milestones.api';
import { tasksApi } from '../../api/tasks.api';

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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500 text-sm mt-1">Milestones and task due dates</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prev} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">&larr;</button>
          <span className="font-semibold text-gray-900 min-w-[120px] text-center">{MONTHS[month]} {year}</span>
          <button onClick={next} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">&rarr;</button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DAYS.map((d) => (
              <div key={d} className="px-3 py-3 text-xs font-semibold text-gray-500 text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const dayItems = day ? getItemsForDay(day) : [];
              return (
                <div
                  key={idx}
                  className={`min-h-[100px] p-2 border-b border-r border-gray-100 ${
                    !day ? 'bg-gray-50/50' : ''
                  } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                >
                  {day && (
                    <>
                      <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-700'
                      }`}>{day}</span>
                      <div className="mt-1 space-y-0.5">
                        {dayItems.slice(0, 3).map((item) => (
                          <div key={item.id}
                            title={`${item.projectName}: ${item.label}`}
                            className={`text-xs px-1.5 py-0.5 rounded truncate ${
                              item.type === 'milestone'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                            {item.label}
                          </div>
                        ))}
                        {dayItems.length > 3 && (
                          <div className="text-xs text-gray-400 px-1">+{dayItems.length - 3} more</div>
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

      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-purple-100 border border-purple-300" />
          <span className="text-xs text-gray-500">Milestone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-300" />
          <span className="text-xs text-gray-500">Task</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
