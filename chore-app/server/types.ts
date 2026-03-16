export interface Member {
  id: number;
  name: string;
  color: string;
}

export interface Chore {
  id: number;
  title: string;
  description: string | null;
  assignee_id: number | null;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrence_day: number | null;
  start_date: string;
  end_date: string | null;
}

export interface Completion {
  id: number;
  chore_id: number;
  due_date: string;
  completed_at: string;
}

export interface ChoreInstance {
  chore_id: number;
  title: string;
  description: string | null;
  assignee: Member | null;
  due_date: string;
  completed: boolean;
  completed_at: string | null;
}
