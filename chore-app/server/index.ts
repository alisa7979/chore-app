import express from 'express';
import cors from 'cors';
import membersRouter from './routes/members';
import choresRouter from './routes/chores';
import instancesRouter from './routes/instances';
import db from './db';
import { Chore, Member, ChoreInstance } from './types';
import { generateDueDates } from './routes/instances';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/members', membersRouter);
app.use('/api/chores', choresRouter);
app.use('/api/instances', instancesRouter);

app.get('/api/reminders', (_req, res) => {
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);
  const end = endDate.toISOString().slice(0, 10);

  const chores = db.prepare('SELECT * FROM chores').all() as Chore[];
  const members = db.prepare('SELECT * FROM members').all() as Member[];
  const memberMap = new Map(members.map(m => [m.id, m]));

  const completions = db.prepare(
    'SELECT * FROM completions WHERE due_date >= ? AND due_date <= ?'
  ).all(start, end) as { chore_id: number; due_date: string; completed_at: string }[];
  const completionSet = new Set(completions.map(c => `${c.chore_id}:${c.due_date}`));

  const instances: ChoreInstance[] = [];
  for (const chore of chores) {
    const dueDates = generateDueDates(chore, start, end);
    for (const due_date of dueDates) {
      const key = `${chore.id}:${due_date}`;
      if (!completionSet.has(key)) {
        instances.push({
          chore_id: chore.id,
          title: chore.title,
          description: chore.description,
          assignee: chore.assignee_id ? (memberMap.get(chore.assignee_id) ?? null) : null,
          due_date,
          completed: false,
          completed_at: null,
        });
      }
    }
  }

  instances.sort((a, b) => a.due_date.localeCompare(b.due_date));
  res.json(instances);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
