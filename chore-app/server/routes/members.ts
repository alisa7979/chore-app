import { Router } from 'express';
import db from '../db';
import { Member } from '../types';

const router = Router();

router.get('/', (_req, res) => {
  const members = db.prepare('SELECT * FROM members ORDER BY name').all() as Member[];
  res.json(members);
});

router.post('/', (req, res) => {
  const { name, color = '#4A90D9' } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = db.prepare('INSERT INTO members (name, color) VALUES (?, ?)').run(name, color);
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid) as Member;
  res.status(201).json(member);
});

router.put('/:id', (req, res) => {
  const { name, color } = req.body;
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Member | undefined;
  if (!existing) return res.status(404).json({ error: 'Member not found' });
  db.prepare('UPDATE members SET name = ?, color = ? WHERE id = ?').run(
    name ?? existing.name,
    color ?? existing.color,
    id
  );
  const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Member;
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Member not found' });
  db.prepare('DELETE FROM members WHERE id = ?').run(id);
  res.status(204).send();
});

export default router;
