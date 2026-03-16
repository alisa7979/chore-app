import React, { useState } from 'react';
import { Member } from '../types';
import { createMember, deleteMember } from '../api';

interface Props {
  members: Member[];
  onChanged: () => void;
}

export default function TeamPanel({ members, onChanged }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4A90D9');
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      await createMember({ name: name.trim(), color });
      setName('');
      setColor('#4A90D9');
      onChanged();
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (m: Member) => {
    if (!confirm(`Remove ${m.name} from the team? Their chores will become unassigned.`)) return;
    await deleteMember(m.id);
    onChanged();
  };

  return (
    <div style={panel}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Team Members</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
        {members.length === 0 && <li style={{ color: '#999', fontSize: 13 }}>No members yet</li>}
        {members.map(m => (
          <li key={m.id} style={memberRow}>
            <span style={{ ...swatch, background: m.color }} />
            <span style={{ flex: 1, fontSize: 14 }}>{m.name}</span>
            <button onClick={() => handleDelete(m)} style={deleteBtn} title="Remove member">✕</button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Add Member</div>
        <input
          style={inp} placeholder="Name" value={name}
          onChange={e => setName(e.target.value)} required
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
          <label style={{ fontSize: 13 }}>Color:</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ width: 40, height: 28, border: 'none', cursor: 'pointer', padding: 0 }} />
          <span style={{ fontSize: 12, color: '#666' }}>{color}</span>
        </div>
        <button type="submit" disabled={adding} style={addBtn}>
          {adding ? 'Adding…' : '+ Add Member'}
        </button>
      </form>
    </div>
  );
}

const panel: React.CSSProperties = {
  width: 220, background: '#f8f8f8', borderLeft: '1px solid #ddd',
  padding: 16, overflowY: 'auto',
};
const memberRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
  borderBottom: '1px solid #eee',
};
const swatch: React.CSSProperties = { width: 14, height: 14, borderRadius: '50%', flexShrink: 0 };
const deleteBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#999',
  fontSize: 12, padding: 2, lineHeight: 1,
};
const inp: React.CSSProperties = {
  width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc',
  fontSize: 13, boxSizing: 'border-box',
};
const addBtn: React.CSSProperties = {
  width: '100%', padding: '7px 0', background: '#4A90D9', color: '#fff',
  border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13,
};
