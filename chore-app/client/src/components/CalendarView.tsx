import React, { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ChoreInstance, Chore, Member } from '../types';
import { completeInstance, uncompleteInstance, deleteChore } from '../api';

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
  resource: ChoreInstance;
}

interface Props {
  instances: ChoreInstance[];
  members: Member[];
  onRangeChange: (start: string, end: string) => void;
  onAddChore: (date: string) => void;
  onEditChore: (chore: Chore) => void;
  onChanged: () => void;
  chores: Chore[];
}

export default function CalendarView({ instances, onRangeChange, onAddChore, onEditChore, onChanged, chores }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<ChoreInstance | null>(null);

  const events: CalEvent[] = instances.map(inst => {
    const d = new Date(inst.due_date + 'T00:00:00');
    return {
      id: `${inst.chore_id}:${inst.due_date}`,
      title: inst.title,
      start: d,
      end: d,
      resource: inst,
    };
  });

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
    onAddChore(iso);
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

  return (
    <div style={{ flex: 1, padding: 16, minWidth: 0, position: 'relative' }}>
      <Calendar
        localizer={localizer}
        events={events}
        defaultView={Views.MONTH}
        views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
        style={{ height: 'calc(100vh - 130px)' }}
        eventPropGetter={eventStyleGetter}
        onRangeChange={handleRangeChange}
        onSelectEvent={e => setSelectedEvent(e.resource)}
        onSelectSlot={handleSelectSlot}
        selectable
        popup
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
