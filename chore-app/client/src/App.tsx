import React, { useState, useEffect, useCallback } from 'react';
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import CalendarView from './components/CalendarView';
import ChoreModal from './components/ChoreModal';
import TeamPanel from './components/TeamPanel';
import RemindersBar from './components/RemindersBar';
import { Member, Chore, ChoreInstance } from './types';
import { getMembers, getChores, getInstances, createChore, updateChore, getReminders } from './api';

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [instances, setInstances] = useState<ChoreInstance[]>([]);
  const [reminders, setReminders] = useState<ChoreInstance[]>([]);
  const [currentDate] = useState(new Date());
  const [rangeStart, setRangeStart] = useState(startOfMonth(currentDate).toISOString().slice(0, 10));
  const [rangeEnd, setRangeEnd] = useState(endOfMonth(addMonths(currentDate, 0)).toISOString().slice(0, 10));
  const [showModal, setShowModal] = useState(false);
  const [modalSlot, setModalSlot] = useState<{ date?: string; startTime?: string; endTime?: string; days?: number[] } | undefined>();
  const [editChore, setEditChore] = useState<Chore | null>(null);

  const loadMembers = useCallback(() => getMembers().then(setMembers), []);
  const loadChores = useCallback(() => getChores().then(setChores), []);
  const loadInstances = useCallback(() => {
    getInstances(rangeStart, rangeEnd).then(setInstances);
  }, [rangeStart, rangeEnd]);
  const loadReminders = useCallback(() => getReminders().then(setReminders), []);

  useEffect(() => { loadMembers(); }, [loadMembers]);
  useEffect(() => { loadChores(); }, [loadChores]);
  useEffect(() => { loadInstances(); }, [loadInstances]);
  useEffect(() => { loadReminders(); }, [loadReminders]);

  const handleRangeChange = useCallback((start: string, end: string) => {
    setRangeStart(start);
    setRangeEnd(end);
  }, []);

  const handleRefreshAll = useCallback(() => {
    loadChores();
    loadInstances();
    loadReminders();
  }, [loadChores, loadInstances, loadReminders]);

  const handleSaveChore = async (data: Omit<Chore, 'id'>) => {
    if (editChore) {
      await updateChore(editChore.id, data);
    } else {
      await createChore(data);
    }
    setShowModal(false);
    setEditChore(null);
    setModalSlot(undefined);
    handleRefreshAll();
  };

  const handleAddChore = (slot: { date: string; startTime?: string; endTime?: string; days?: number[] }) => {
    setModalSlot(slot);
    setEditChore(null);
    setShowModal(true);
  };

  const handleEditChore = (chore: Chore) => {
    setEditChore(chore);
    setModalSlot(undefined);
    setShowModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={header}>
        <span style={{ fontWeight: 700, fontSize: 18 }}>Office Chores</span>
        <button onClick={() => { setEditChore(null); setModalSlot(undefined); setShowModal(true); }} style={addBtn}>
          + Add Chore
        </button>
      </header>

      <RemindersBar reminders={reminders} onChanged={handleRefreshAll} />

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <CalendarView
          instances={instances}
          members={members}
          chores={chores}
          onRangeChange={handleRangeChange}
          onAddChore={handleAddChore}
          onEditChore={handleEditChore}
          onChanged={handleRefreshAll}
        />
        <TeamPanel members={members} onChanged={() => { loadMembers(); handleRefreshAll(); }} />
      </div>

      {showModal && (
        <ChoreModal
          members={members}
          initialDate={modalSlot?.date}
          initialStartTime={modalSlot?.startTime}
          initialEndTime={modalSlot?.endTime}
          initialDays={modalSlot?.days}
          editChore={editChore}
          onSave={handleSaveChore}
          onClose={() => { setShowModal(false); setEditChore(null); setModalSlot(undefined); }}
        />
      )}
    </div>
  );
}

const header: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 16px', background: '#2c3e50', color: '#fff',
};
const addBtn: React.CSSProperties = {
  padding: '7px 16px', background: '#4A90D9', color: '#fff',
  border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 14,
};
