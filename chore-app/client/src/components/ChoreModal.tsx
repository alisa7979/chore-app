import React, { useState, useEffect } from 'react';
import { Member, Chore } from '../types';

interface Props {
  members: Member[];
  initialDate?: string;
  editChore?: Chore | null;
  onSave: (data: Omit<Chore, 'id'>) => void;
  onClose: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ChoreModal({ members, initialDate, editChore, onSave, onClose }: Props) {
  const [title, setTitle] = useState(editChore?.title ?? '');
  const [description, setDescription] = useState(editChore?.description ?? '');
  const [assigneeId, setAssigneeId] = useState<number | ''>(editChore?.assignee_id ?? '');
  const [recurrence, setRecurrence] = useState<Chore['recurrence']>(editChore?.recurrence ?? 'none');
  const [recurrenceDay, setRecurrenceDay] = useState<number>(editChore?.recurrence_day ?? 0);
  const [startDate, setStartDate] = useState(editChore?.start_date ?? initialDate ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(editChore?.end_date ?? '');

  useEffect(() => {
    if (editChore) {
      setTitle(editChore.title);
      setDescription(editChore.description ?? '');
      setAssigneeId(editChore.assignee_id ?? '');
      setRecurrence(editChore.recurrence);
      setRecurrenceDay(editChore.recurrence_day ?? 0);
      setStartDate(editChore.start_date);
      setEndDate(editChore.end_date ?? '');
    }
  }, [editChore]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description: description || null,
      assignee_id: assigneeId !== '' ? Number(assigneeId) : null,
      recurrence,
      recurrence_day: recurrence !== 'none' ? recurrenceDay : null,
      start_date: startDate,
      end_date: endDate || null,
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
              <label style={label}>Day of Week</label>
              <select style={input} value={recurrenceDay} onChange={e => setRecurrenceDay(Number(e.target.value))}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
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
const btnPrimary: React.CSSProperties = { flex: 1, padding: '9px 0', background: '#4A90D9', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };
const btnSecondary: React.CSSProperties = { flex: 1, padding: '9px 0', background: '#f0f0f0', border: 'none', borderRadius: 4, cursor: 'pointer' };
