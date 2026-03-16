import { Member, Chore, ChoreInstance } from './types';

const BASE = '/api';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Members
export const getMembers = () => fetch(`${BASE}/members`).then(r => json<Member[]>(r));
export const createMember = (data: { name: string; color: string }) =>
  fetch(`${BASE}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => json<Member>(r));
export const updateMember = (id: number, data: Partial<Member>) =>
  fetch(`${BASE}/members/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => json<Member>(r));
export const deleteMember = (id: number) =>
  fetch(`${BASE}/members/${id}`, { method: 'DELETE' }).then(r => json<void>(r));

// Chores
export const getChores = () => fetch(`${BASE}/chores`).then(r => json<Chore[]>(r));
export const createChore = (data: Omit<Chore, 'id'>) =>
  fetch(`${BASE}/chores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => json<Chore>(r));
export const updateChore = (id: number, data: Partial<Chore>) =>
  fetch(`${BASE}/chores/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => json<Chore>(r));
export const deleteChore = (id: number) =>
  fetch(`${BASE}/chores/${id}`, { method: 'DELETE' }).then(r => json<void>(r));

// Instances
export const getInstances = (start: string, end: string) =>
  fetch(`${BASE}/instances?start=${start}&end=${end}`).then(r => json<ChoreInstance[]>(r));
export const completeInstance = (choreId: number, dueDate: string) =>
  fetch(`${BASE}/instances/${choreId}/${dueDate}/complete`, { method: 'POST' }).then(r => json<{ ok: boolean }>(r));
export const uncompleteInstance = (choreId: number, dueDate: string) =>
  fetch(`${BASE}/instances/${choreId}/${dueDate}/complete`, { method: 'DELETE' }).then(r => json<void>(r));

// Reminders
export const getReminders = () => fetch(`${BASE}/reminders`).then(r => json<ChoreInstance[]>(r));
