export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface DailyHours {
  [dayIndex: number]: number; // 0=Mon, 1=Tue, ... 4=Fri
}

export interface TimesheetEntry {
  projectId: string;
  hours: DailyHours;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
}

export type TaskStatus = 'todo' | 'doing' | 'done';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  content: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  checklist: ChecklistItem[];
}

export interface SyncedData {
  projects: Project[];
  entries: TimesheetEntry[];
  notes: Note[];
  tasks: Task[];
  lastUpdated: string;
}

export const DAYS_OF_WEEK = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];