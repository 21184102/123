import { Task } from '../types';

export function getTaskDueDateTime(task: Task): Date | null {
  if (!task.dueDate) return null;
  const timeStr = task.dueTime ? task.dueTime : '23:59';
  const isoStr = `${task.dueDate}T${timeStr}:00`;
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? null : d;
}

export function isTaskOverdue(task: Task): boolean {
  if (task.completed) return false;
  const dueDateTime = getTaskDueDateTime(task);
  if (!dueDateTime) return false;
  return dueDateTime.getTime() < Date.now();
}

export function getTaskDueStatus(task: Task): {
  isOverdue: boolean;
  isToday: boolean;
  displayStr: string;
  reminderLabel?: string;
} | null {
  if (!task.dueDate) return null;

  const dueDateTime = getTaskDueDateTime(task);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const isToday = task.dueDate === todayStr;
  const isOverdue = !task.completed && (dueDateTime ? dueDateTime.getTime() < now.getTime() : false);

  let displayStr = '';
  if (isToday) {
    displayStr = task.dueTime ? `今天 ${task.dueTime}` : '今天截止';
  } else {
    displayStr = task.dueTime ? `${task.dueDate} ${task.dueTime}` : task.dueDate;
  }

  let reminderLabel: string | undefined;
  if (task.reminderMinutes !== undefined) {
    if (task.reminderMinutes === 0) reminderLabel = '到期時提醒';
    else if (task.reminderMinutes === 15) reminderLabel = '到期前 15 分鐘提醒';
    else if (task.reminderMinutes === 30) reminderLabel = '到期前 30 分鐘提醒';
    else if (task.reminderMinutes === 60) reminderLabel = '到期前 1 小時提醒';
    else if (task.reminderMinutes === 1440) reminderLabel = '到期前 1 天提醒';
    else reminderLabel = `到期前 ${task.reminderMinutes} 分鐘提醒`;
  }

  return {
    isOverdue,
    isToday,
    displayStr,
    reminderLabel,
  };
}
