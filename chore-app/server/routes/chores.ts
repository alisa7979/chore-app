import { Router } from 'express';
import db from '../db';
import { Chore } from '../types';

const router = Router();

router.get('/', (_req, res) => {
  const chores = db.prepare('SELECT * FROM chores ORDER BY title').all() as Chore[];
  res.json(chores);
});

router.post('/', (req, res) => {
  const { title, description, assignee_id, recurrence = 'none', recurrence_day, recurrence_days, start_date, end_date, start_time, end_time } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  if (!start_date) return res.status(400).json({ error: 'start_date is required' });
  const result = db.prepare(`
    INSERT INTO chores (title, description, assignee_id, recurrence, recurrence_day, recurrence_days, start_date, end_date, start_time, end_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description ?? null, assignee_id ?? null, recurrence, recurrence_day ?? null, recurrence_days ?? null, start_date, end_date ?? null, start_time ?? null, end_time ?? null);
  const chore = db.prepare('SELECT * FROM chores WHERE id = ?').get(result.lastInsertRowid) as Chore;
  res.status(201).json(chore);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM chores WHERE id = ?').get(id) as Chore | undefined;
  if (!existing) return res.status(404).json({ error: 'Chore not found' });
  const { title, description, assignee_id, recurrence, recurrence_day, recurrence_days, start_date, end_date, start_time, end_time } = req.body;
  db.prepare(`
    UPDATE chores SET
      title = ?, description = ?, assignee_id = ?,
      recurrence = ?, recurrence_day = ?, recurrence_days = ?,
      start_date = ?, end_date = ?, start_time = ?, end_time = ?
    WHERE id = ?
  `).run(
    title ?? existing.title,
    description !== undefined ? description : existing.description,
    assignee_id !== undefined ? assignee_id : existing.assignee_id,
    recurrence ?? existing.recurrence,
    recurrence_day !== undefined ? recurrence_day : existing.recurrence_day,
    recurrence_days !== undefined ? recurrence_days : existing.recurrence_days,
    start_date ?? existing.start_date,
    end_date !== undefined ? end_date : existing.end_date,
    start_time !== undefined ? start_time : existing.start_time,
    end_time !== undefined ? end_time : existing.end_time,
    id
  );
  const updated = db.prepare('SELECT * FROM chores WHERE id = ?').get(id) as Chore;
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM chores WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Chore not found' });
  db.prepare('DELETE FROM chores WHERE id = ?').run(id);
  res.status(204).send();
});

export default router;
