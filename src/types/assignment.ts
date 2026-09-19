// Campora — Assignment Types

import type { ID, Priority } from './common';

export type AssignmentStatus = 'pending' | 'completed' | 'overdue';

export interface Assignment {
  id: ID;
  title: string;
  subjectId: ID;
  dueDate: string;       // "2026-09-20"
  priority: Priority;
  status: AssignmentStatus;
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}
