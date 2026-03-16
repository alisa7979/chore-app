import React, { useState, useEffect } from 'react';
import { Member, Chore } from '../types';

interface Props {
  members: Member[];
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialDays?: number[];
  editChore?: Chore | null;
  onSave: (data: Omit<Chore, 'id'>) => void;
  onClose: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ChoreModal({ members, initialDate, initialStartTime, initialEndTime, initialDays, editChore, onSave, onClose }: Props) {
  const [title, setTitle] = useState(editChore?.title ?? '');
  const [description, setDescription] = useState(editChore?.description ?? '');
  const [assigneeId, setAssigneeId] = useState<number | ''>(editChore?.assignee_id ?? '');
  const [recurrence, setRecurrence] = useState<Chore['recurrence']>(editChore?.recurrence ?? 'none');
  const [recurrenceDay, setRecurrenceDay] = useState<number>(editChore?.recurrence_day ?? 0);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(() => {
    if (editChore?.recurrence_days) return JSON.parse(editChore.recurrence_days);
    if (editChore?.recurrence_day != null) return [editChore.recurrence_day];
    if (initialDays && initialDays.length > 0) return initialDays;
    return [0];
  });
  const [startDate, setStartDate] = useState(editChore?.start_date ?? initialDate ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(editChore?.end_date ?? '');
  const [startTime, setStartTime] = useState(editChore?.start_time ?? initialStartTime ?? '');
  const [endTime, setEndTime] = useState(editChore?.end_time ?? initialEndTime ?? '');

  useEffect(() => {
    if (editChore) {
      setTitle(editChore.title);
      setDescription(editChore.description ?? '');
      setAssigneeId(editChore.assignee_id ?? '');
      setRecurrence(editChore.recurrence);
      setRecurrenceDay(editChore.recurrence_day ?? 0);
      setRecurrenceDays(
        editChore.recurrence_days
          ? JSON.parse(editChore.recurrence_days)
          : editChore.recurrence_day != null ? [editChore.recurrence_day] : [0]
      );
      setStartDate(editChore.start_date);
      setEndDate(editChore.end_date ?? '');
      setStartTime(editChore.start_time ?? '');
      setEndTime(editChore.end_time ?? '');
    }
  }, [editChore]);

  // When recurrence changes to weekly, pre-select from initialDays if available
  useEffect(() => {
    if (recurrence === 'weekly' && !editChore && initialDays && initialDays.length > 0) {
      setRecurrenceDays(initialDays);
    }
  }, [recurrence, editChore, initialDays]);

  const toggleDay = (day: number) => {
    setRecurrenceDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recurrence === 'weekly' && recurrenceDays.length === 0) {
      alert('Please select at least one day of the week.');
      return;
    }
    onSave({
      title,
      description: description || null,
      assignee_id: assigneeId !== '' ? Number(assigneeId) : null,
      recurrence,
      recurrence_day: recurrence === 'monthly' ? recurrenceDay : null,
      recurrence_days: recurrence === 'weekly' ? JSON.stringify(recurrenceDays) : null,
      start_date: startDate,
      end_date: endDate || null,
      start_time: startTime || null,
      end_time: endTime || null,
    });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 16px' }}>{editChore ? 'Edit Chore' : 'Add Chore'}</h2>
        <form onSubmit={handleSubmit}>
          <label style={label}>Title *</label>
          <input style={input} value={title} onChange={e => setTitle(e.target.value)} required />

          <label style={label}>Description</label>
          <textarea style={{ ...input, height: 60, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} />

          <label style={label}>Assignee</label>
          <select style={input} value={assigneeId} onChange={e => setAssigneeId(e.target.value === '' ? '' : Number(e.target.value))}>
            <option value="">— Unassigned —</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <label style={label}>Recurrence</label>
          <select style={input} value={recurrence} onChange={e => setRecurrence(e.target.value as Chore['recurrence'])}>
            <option value="none">None (one-time)</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          {recurrence === 'weekly' && (
            <>
              <label style={label}>Days of Week</label>
              <div style={daysGrid}>
                {DAYS.map((d, i) => (
                  <label key={i} style={dayLabel}>
                    <input
                      type="checkbox"
                      checked={recurrenceDays.includes(i)}
                      onChange={() => toggleDay(i)}
                      style={{ marginRight: 4 }}
                    />
                    {d}
                  </label>
                ))}
              </div>
            </>
          )}

          {recurrence === 'monthly' && (
            <>
              <label style={label}>Day of Month (1–31)</label>
              <input style={input} type="number" min={1} max={31} value={recurrenceDay || 1}
                onChange={e => setRecurrenceDay(Number(e.target.value))} />
            </>
          )}

          <label style={label}>Start Date *</label>
          <input style={input} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />

          <label style={label}>End Date (optional)</label>
          <input style={input} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />

          <label style={label}>Start Time (optional)</label>
          <input style={input} type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />

          <label style={label}>End Time (optional)</label>
          <input style={input} type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="submit" style={btnPrimary}>{editChore ? 'Save Changes' : 'Add Chore'}</button>
            <button type="button" style={btnSecondary} onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modal: React.CSSProperties = {
  background: '#fff', borderRadius: 8, padding: 24, width: 420, maxHeight: '90vh',
  overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
};
const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, marginTop: 12 };
const input: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: 14, boxSizing: 'border-box' };
const daysGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', padding: '8px 0' };
const dayLabel: React.CSSProperties = { display: 'flex', alignItems: 'center', fontSize: 14, cursor: 'pointer' };
const btnPrimary: React.CSSProperties = { flex: 1, padding: '9px 0', background: '#4A90D9', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };
const btnSecondary: React.CSSProperties = { flex: 1, padding: '9px 0', background: '#f0f0f0', border: 'none', borderRadius: 4, cursor: 'pointer' };
