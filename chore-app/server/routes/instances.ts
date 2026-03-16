import { Router, Request, Response } from 'express';
import db from '../db';
import { Chore, Member, ChoreInstance } from '../types';

const router = Router();

function getDaysInRange(start: string, end: string): string[] {
  const days: string[] = [];
  const cur = new Date(start + 'T00:00:00Z');
  const endDate = new Date(end + 'T00:00:00Z');
  while (cur <= endDate) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

function generateDueDates(chore: Chore, rangeStart: string, rangeEnd: string): string[] {
  const dates: string[] = [];
  const choreStart = chore.start_date;
  const choreEnd = chore.end_date;
  const effectiveStart = choreStart > rangeStart ? choreStart : rangeStart;
  const effectiveEnd = choreEnd && choreEnd < rangeEnd ? choreEnd : rangeEnd;

  if (effectiveStart > effectiveEnd) return dates;

  if (chore.recurrence === 'none') {
    if (chore.start_date >= rangeStart && chore.start_date <= rangeEnd) {
      dates.push(chore.start_date);
    }
    return dates;
  }

  if (chore.recurrence === 'daily') {
    return getDaysInRange(effectiveStart, effectiveEnd);
  }

  if (chore.recurrence === 'weekly') {
    // Support multiple days via recurrence_days (JSON array), fall back to recurrence_day
    const targetDays: number[] = chore.recurrence_days
      ? JSON.parse(chore.recurrence_days)
      : [chore.recurrence_day ?? 0];
    const days = getDaysInRange(effectiveStart, effectiveEnd);
    for (const day of days) {
      const d = new Date(day + 'T00:00:00Z');
      // JS getUTCDay: 0=Sun,1=Mon...6=Sat → convert to Mon=0
      const jsDay = d.getUTCDay();
      const monBasedDay = jsDay === 0 ? 6 : jsDay - 1;
      if (targetDays.includes(monBasedDay)) dates.push(day);
    }
    return dates;
  }

  if (chore.recurrence === 'monthly') {
    const targetDayOfMonth = chore.recurrence_day ?? 1;
    const start = new Date(effectiveStart + 'T00:00:00Z');
    const end = new Date(effectiveEnd + 'T00:00:00Z');
    const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    while (cur <= end) {
      const daysInMonth = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 0)).getUTCDate();
      const day = Math.min(targetDayOfMonth, daysInMonth);
      const candidate = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), day));
      if (candidate >= start && candidate <= end) {
        dates.push(candidate.toISOString().slice(0, 10));
      }
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
    return dates;
  }

  return dates;
}

router.get('/', (req: Request, res: Response) => {
  const { start, end } = req.query as { start: string; end: string };
  if (!start || !end) return res.status(400).json({ error: 'start and end query params required' });

  const chores = db.prepare('SELECT * FROM chores').all() as Chore[];
  const members = db.prepare('SELECT * FROM members').all() as Member[];
  const memberMap = new Map(members.map(m => [m.id, m]));

  const completions = db.prepare(
    'SELECT * FROM completions WHERE due_date >= ? AND due_date <= ?'
  ).all(start, end) as { chore_id: number; due_date: string; completed_at: string }[];
  const completionMap = new Map(completions.map(c => [`${c.chore_id}:${c.due_date}`, c]));

  const instances: ChoreInstance[] = [];
  for (const chore of chores) {
    const dueDates = generateDueDates(chore, start, end);
    for (const due_date of dueDates) {
      const key = `${chore.id}:${due_date}`;
      const completion = completionMap.get(key);
      instances.push({
        chore_id: chore.id,
        title: chore.title,
        description: chore.description,
        assignee: chore.assignee_id ? (memberMap.get(chore.assignee_id) ?? null) : null,
        due_date,
        start_time: chore.start_time ?? null,
        end_time: chore.end_time ?? null,
        completed: !!completion,
        completed_at: completion?.completed_at ?? null,
      });
    }
  }

  instances.sort((a, b) => a.due_date.localeCompare(b.due_date));
  res.json(instances);
});

router.post('/:choreId/:dueDate/complete', (req: Request, res: Response) => {
  const { choreId, dueDate } = req.params;
  const chore = db.prepare('SELECT * FROM chores WHERE id = ?').get(choreId);
  if (!chore) return res.status(404).json({ error: 'Chore not found' });
  try {
    db.prepare(
      'INSERT OR REPLACE INTO completions (chore_id, due_date, completed_at) VALUES (?, ?, ?)'
    ).run(choreId, dueDate, new Date().toISOString());
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to mark complete' });
  }
});

router.delete('/:choreId/:dueDate/complete', (req: Request, res: Response) => {
  const { choreId, dueDate } = req.params;
  db.prepare('DELETE FROM completions WHERE chore_id = ? AND due_date = ?').run(choreId, dueDate);
  res.status(204).send();
});

export { generateDueDates };
export default router;
