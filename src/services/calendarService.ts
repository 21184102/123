import { Task } from '../types';

export interface CalendarSyncResult {
  eventId: string;
  htmlLink: string;
}

export async function syncTaskToGoogleCalendar(
  task: Task,
  accessToken: string
): Promise<CalendarSyncResult> {
  if (!task.dueDate) {
    throw new Error('任務需設定截止日期方能同步至 Google 日曆');
  }

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei';
  const reminderMinutes = task.reminderMinutes !== undefined ? task.reminderMinutes : 15;

  let startDateTime: string;
  let endDateTime: string;
  let isAllDay = false;

  if (task.dueTime) {
    // Exact time
    startDateTime = `${task.dueDate}T${task.dueTime}:00`;
    // End time 30 mins after start
    const d = new Date(startDateTime);
    d.setMinutes(d.getMinutes() + 30);
    const endHour = String(d.getHours()).padStart(2, '0');
    const endMin = String(d.getMinutes()).padStart(2, '0');
    endDateTime = `${task.dueDate}T${endHour}:${endMin}:00`;
  } else {
    isAllDay = true;
    startDateTime = task.dueDate;
    endDateTime = task.dueDate;
  }

  const requestBody: Record<string, unknown> = {
    summary: `[待辦] ${task.title}`,
    description: `${task.description ? `${task.description}\n\n` : ''}優先級: ${
      task.priority === 'high' ? '高' : task.priority === 'low' ? '低' : '中'
    }\n分類: ${task.category || '一般'}\n\n來自「雲端與離線待辦清單」`,
    reminders: {
      useDefault: false,
      overrides: [
        // 1. Popup notification (pushes to iOS / Android Google Calendar app & desktop)
        { method: 'popup', minutes: reminderMinutes },
        // 2. Real Gmail notification email sent to user's inbox
        { method: 'email', minutes: reminderMinutes },
      ],
    },
  };

  if (isAllDay) {
    requestBody.start = { date: startDateTime };
    requestBody.end = { date: endDateTime };
  } else {
    requestBody.start = { dateTime: new Date(startDateTime).toISOString(), timeZone: userTimeZone };
    requestBody.end = { dateTime: new Date(endDateTime).toISOString(), timeZone: userTimeZone };
  }

  const isExisting = Boolean(task.googleEventId);
  const url = isExisting
    ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.googleEventId}`
    : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  const response = await fetch(url, {
    method: isExisting ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Calendar API Error:', errorText);
    throw new Error(`Google 行事曆建立失敗 (${response.status})`);
  }

  const data = await response.json();
  return {
    eventId: data.id,
    htmlLink: data.htmlLink,
  };
}

export async function deleteTaskFromGoogleCalendar(
  eventId: string,
  accessToken: string
): Promise<void> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    console.error('Google Calendar Delete Error:', errorText);
    throw new Error(`Google 行事曆刪除失敗 (${response.status})`);
  }
}
