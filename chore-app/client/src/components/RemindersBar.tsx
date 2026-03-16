import React, { useState } from 'react';
import { ChoreInstance } from '../types';
import { completeInstance } from '../api';

interface Props {
  reminders: ChoreInstance[];
  onChanged: () => void;
}

export default function RemindersBar({ reminders, onChanged }: Props) {
  const [expanded, setExpanded] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const todayItems = reminders.filter(r => r.due_date === today);
  const upcomingItems = reminders.filter(r => r.due_date > today);

  const handleComplete = async (item: ChoreInstance) => {
    await completeInstance(item.chore_id, item.due_date);
    onChanged();
  };

  return (
    <div style={bar}>
      <button onClick={() => setExpanded(e => !e)} style={toggleBtn}>
        <span style={{ fontWeight: 700 }}>
          {todayItems.length > 0
            ? `⚠ ${todayItems.length} chore${todayItems.length !== 1 ? 's' : ''} due today`
            : '✓ No chores due today'}
        </span>
        {upcomingItems.length > 0 && (
          <span style={{ marginLeft: 12, fontSize: 13, color: '#666' }}>
            + {upcomingItems.length} upcoming this week
          </span>
        )}
        <span style={{ marginLeft: 8 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={dropdown}>
          {reminders.length === 0 && (
            <div style={{ padding: '8px 16px', color: '#666', fontSize: 13 }}>All caught up!</div>
          )}
          {todayItems.length > 0 && (
            <div>
              <div style={sectionHeader}>Today</div>
              {todayItems.map(item => (
                <ReminderItem key={`${item.chore_id}:${item.due_date}`} item={item} onComplete={handleComplete} />
              ))}
            </div>
          )}
          {upcomingItems.length > 0 && (
            <div>
              <div style={sectionHeader}>Upcoming (next 7 days)</div>
              {upcomingItems.map(item => (
                <ReminderItem key={`${item.chore_id}:${item.due_date}`} item={item} onComplete={handleComplete} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReminderItem({ item, onComplete }: { item: ChoreInstance; onComplete: (i: ChoreInstance) => void }) {
  return (
    <div style={itemRow}>
      <input type="checkbox" checked={item.completed} onChange={() => onComplete(item)} style={{ cursor: 'pointer' }} />
      <span style={{ flex: 1, fontSize: 14 }}>
        <strong>{item.title}</strong>
        {item.assignee && <span style={{ color: item.assignee.color, marginLeft: 8 }}>@{item.assignee.name}</span>}
      </span>
      <span style={{ fontSize: 12, color: '#888' }}>{item.due_date}</span>
    </div>
  );
}

const bar: React.CSSProperties = {
  background: '#fff', borderBottom: '1px solid #ddd', position: 'relative', zIndex: 100,
};
const toggleBtn: React.CSSProperties = {
  width: '100%', padding: '10px 16px', background: 'none', border: 'none',
  cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center',
};
const dropdown: React.CSSProperties = {
  position: 'absolute', top: '100%', left: 0, right: 0,
  background: '#fff', borderBottom: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  maxHeight: 300, overflowY: 'auto',
};
const sectionHeader: React.CSSProperties = {
  padding: '6px 16px', background: '#f5f5f5', fontSize: 12,
  fontWeight: 700, textTransform: 'uppercase', color: '#555',
};
const itemRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
  borderBottom: '1px solid #f0f0f0',
};
