import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views, SlotInfo, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ChoreInstance, Chore, Member } from '../types';
import { completeInstance, uncompleteInstance, deleteChore } from '../api';

const LS_MODE = 'calTimeMode';
const LS_START = 'calTimeStart';
const LS_END = 'calTimeEnd';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-US': enUS },
});

interface CalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: ChoreInstance;
}

interface Props {
  instances: ChoreInstance[];
  members: Member[];
  onRangeChange: (start: string, end: string) => void;
  onAddChore: (slot: { date: string; startTime?: string; endTime?: string; days?: number[] }) => void;
  onEditChore: (chore: Chore) => void;
  onChanged: () => void;
  chores: Chore[];
}

export default function CalendarView({ instances, onRangeChange, onAddChore, onEditChore, onChanged, chores }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<ChoreInstance | null>(null);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [timeMode, setTimeMode] = useState<'manual' | 'auto'>(
    () => (localStorage.getItem(LS_MODE) as 'manual' | 'auto') ?? 'manual'
  );
  const [manualStart, setManualStart] = useState<number>(
    () => parseInt(localStorage.getItem(LS_START) ?? '8', 10)
  );
  const [manualEnd, setManualEnd] = useState<number>(
    () => parseInt(localStorage.getItem(LS_END) ?? '20', 10)
  );

  useEffect(() => { localStorage.setItem(LS_MODE, timeMode); }, [timeMode]);
  useEffect(() => { localStorage.setItem(LS_START, String(manualStart)); }, [manualStart]);
  useEffect(() => { localStorage.setItem(LS_END, String(manualEnd)); }, [manualEnd]);

  const events: CalEvent[] = instances.map(inst => {
    let start: Date, end: Date, allDay: boolean;
    if (inst.start_time) {
      start = new Date(`${inst.due_date}T${inst.start_time}:00`);
      end = inst.end_time
        ? new Date(`${inst.due_date}T${inst.end_time}:00`)
        : new Date(start.getTime() + 60 * 60 * 1000);
      allDay = false;
    } else {
      start = new Date(inst.due_date + 'T00:00:00');
      end = start;
      allDay = true;
    }
    return {
      id: `${inst.chore_id}:${inst.due_date}`,
      title: inst.title,
      start,
      end,
      allDay,
      resource: inst,
    };
  });

  const timedEvents = events.filter(e => !e.allDay);
  const autoMinHour = timedEvents.length > 0
    ? Math.max(0, Math.min(...timedEvents.map(e => e.start.getHours())) - 1)
    : 8;
  const autoMaxHour = timedEvents.length > 0
    ? Math.min(23, Math.max(...timedEvents.map(e => e.end.getHours())) + 1)
    : 20;
  const minHour = timeMode === 'auto' ? autoMinHour : manualStart;
  const maxHour = timeMode === 'auto' ? autoMaxHour : manualEnd;
  const minTime = new Date(1970, 0, 1, minHour, 0, 0);
  const maxTime = new Date(1970, 0, 1, maxHour, 0, 0);

  const eventStyleGetter = useCallback((event: CalEvent) => {
    const inst = event.resource;
    const bg = inst.completed ? '#aaa' : (inst.assignee?.color ?? '#4A90D9');
    return {
      style: {
        backgroundColor: bg,
        borderColor: bg,
        color: '#fff',
        textDecoration: inst.completed ? 'line-through' : 'none',
        opacity: inst.completed ? 0.7 : 1,
        fontSize: 12,
        borderRadius: 3,
      },
    };
  }, []);

  const handleRangeChange = useCallback((range: Date[] | { start: Date; end: Date }) => {
    let start: Date, end: Date;
    if (Array.isArray(range)) {
      start = range[0];
      end = range[range.length - 1];
    } else {
      start = range.start;
      end = range.end;
    }
    onRangeChange(
      start.toISOString().slice(0, 10),
      end.toISOString().slice(0, 10)
    );
  }, [onRangeChange]);

  const handleSelectSlot = useCallback((slot: SlotInfo) => {
    const d = slot.start;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Extract time if the slot has a specific time (week/day view clicks)
    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
    const startTime = hasTime ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : undefined;
    const endTime = hasTime && slot.end
      ? `${String(slot.end.getHours()).padStart(2, '0')}:${String(slot.end.getMinutes()).padStart(2, '0')}`
      : undefined;

    // Extract unique days of week from multi-slot selection (Mon-based: Mon=0 ... Sun=6)
    const slotDates: Date[] = Array.isArray(slot.slots) ? slot.slots as Date[] : [slot.start];
    const daySet = new Set<number>();
    for (const sd of slotDates) {
      const jsDay = sd.getDay(); // 0=Sun
      const monBased = jsDay === 0 ? 6 : jsDay - 1;
      daySet.add(monBased);
    }
    const days = daySet.size > 1 ? Array.from(daySet).sort() : undefined;

    onAddChore({ date: iso, startTime, endTime, days });
  }, [onAddChore]);

  const handleToggleComplete = async () => {
    if (!selectedEvent) return;
    if (selectedEvent.completed) {
      await uncompleteInstance(selectedEvent.chore_id, selectedEvent.due_date);
    } else {
      await completeInstance(selectedEvent.chore_id, selectedEvent.due_date);
    }
    setSelectedEvent(null);
    onChanged();
  };

  const handleEdit = () => {
    if (!selectedEvent) return;
    const chore = chores.find(c => c.id === selectedEvent.chore_id);
    if (chore) {
      onEditChore(chore);
      setSelectedEvent(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    if (!confirm(`Delete chore "${selectedEvent.title}"? This removes all instances.`)) return;
    await deleteChore(selectedEvent.chore_id);
    setSelectedEvent(null);
    onChanged();
  };

  const isTimeView = currentView === Views.WEEK || currentView === Views.DAY;

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const fmtHour = (h: number) => `${String(h).padStart(2, '0')}:00`;

  return (
    <div style={{ flex: 1, padding: 16, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {isTimeView && (
        <div style={settingsBar}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Time range:</span>
          <button
            onClick={() => setTimeMode('manual')}
            style={timeMode === 'manual' ? modeActive : modeInactive}
          >Manual</button>
          <button
            onClick={() => setTimeMode('auto')}
            style={timeMode === 'auto' ? modeActive : modeInactive}
          >Auto</button>
          {timeMode === 'manual' ? (
            <>
              <label style={labelStyle}>From:
                <select value={manualStart} onChange={e => setManualStart(Number(e.target.value))} style={selectStyle}>
                  {hourOptions.map(h => (
                    <option key={h} value={h}>{fmtHour(h)}</option>
                  ))}
                </select>
              </label>
              <label style={labelStyle}>To:
                <select value={manualEnd} onChange={e => setManualEnd(Number(e.target.value))} style={selectStyle}>
                  {hourOptions.map(h => (
                    <option key={h} value={h}>{fmtHour(h)}</option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <span style={{ fontSize: 12, color: '#666' }}>
              Showing {fmtHour(autoMinHour)} – {fmtHour(autoMaxHour)} based on this week's events
            </span>
          )}
        </div>
      )}
      <Calendar
        localizer={localizer}
        events={events}
        defaultView={Views.MONTH}
        views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
        style={{ flex: 1, minHeight: 0 }}
        eventPropGetter={eventStyleGetter}
        onRangeChange={handleRangeChange}
        onSelectEvent={e => setSelectedEvent(e.resource)}
        onSelectSlot={handleSelectSlot}
        onView={setCurrentView}
        selectable
        popup
        min={isTimeView ? minTime : undefined}
        max={isTimeView ? maxTime : undefined}
        tooltipAccessor={e => {
          const inst = e.resource;
          return `${inst.title}${inst.assignee ? ` — ${inst.assignee.name}` : ''}${inst.completed ? ' ✓' : ''}`;
        }}
      />

      {selectedEvent && (
        <div style={popupOverlay} onClick={() => setSelectedEvent(null)}>
          <div style={popup} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px' }}>{selectedEvent.title}</h3>
            {selectedEvent.description && <p style={{ margin: '0 0 8px', color: '#555', fontSize: 14 }}>{selectedEvent.description}</p>}
            <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              <div>Due: {selectedEvent.due_date}</div>
              {selectedEvent.assignee && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedEvent.assignee.color, display: 'inline-block' }} />
                  {selectedEvent.assignee.name}
                </div>
              )}
              {selectedEvent.completed && <div style={{ color: 'green', marginTop: 4 }}>✓ Completed at {selectedEvent.completed_at?.slice(0, 16)}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={handleToggleComplete} style={btnBlue}>
                {selectedEvent.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
              <button onClick={handleEdit} style={btnGray}>Edit</button>
              <button onClick={handleDelete} style={btnRed}>Delete</button>
              <button onClick={() => setSelectedEvent(null)} style={btnGray}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const settingsBar: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px 8px',
  fontSize: 13, flexWrap: 'wrap',
};
const modeActive: React.CSSProperties = {
  padding: '3px 10px', background: '#4A90D9', color: '#fff',
  border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12,
};
const modeInactive: React.CSSProperties = {
  padding: '3px 10px', background: '#eee', color: '#444',
  border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12,
};
const labelStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 };
const selectStyle: React.CSSProperties = { padding: '2px 4px', borderRadius: 3, border: '1px solid #ccc', fontSize: 12 };

const popupOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500,
};
const popup: React.CSSProperties = {
  background: '#fff', borderRadius: 8, padding: 20, minWidth: 300, maxWidth: 400,
  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
};
const btnBlue: React.CSSProperties = { padding: '7px 12px', background: '#4A90D9', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnGray: React.CSSProperties = { padding: '7px 12px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 };
const btnRed: React.CSSProperties = { padding: '7px 12px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 };
