import React, { useEffect } from 'react';
import { useChat } from '../context/ChatContext';

export interface Reminder { id: string; userId: string; at: number; text: string; messageId: string }
const K = 'rblink_reminders';
export const getReminders = (): Reminder[] => { try { return JSON.parse(localStorage.getItem(K) || '[]'); } catch { return []; } };

export function addReminder(userId: string, message: { id: string; content: string }, minutes: number) {
  const r: Reminder = { id: `r_${Date.now()}`, userId, at: Date.now() + minutes * 60000, text: message.content.slice(0, 120), messageId: message.id };
  localStorage.setItem(K, JSON.stringify([...getReminders(), r]));
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  return r;
}

// Checks every 10 seconds; fires a toast and a browser notification when a reminder is due.
export const RemindersRunner: React.FC = () => {
  const { activeUser, showToast } = useChat();
  useEffect(() => {
    const t = setInterval(() => {
      const all = getReminders(), due = all.filter((r) => r.userId === activeUser.id && r.at <= Date.now());
      if (!due.length) return;
      localStorage.setItem(K, JSON.stringify(all.filter((r) => !due.includes(r))));
      due.forEach((r) => {
        showToast(`Reminder: ${r.text}`, 'info');
        if ('Notification' in window && Notification.permission === 'granted') new Notification('rblink.chat reminder', { body: r.text });
      });
    }, 10000);
    return () => clearInterval(t);
  }, [activeUser.id, showToast]);
  return null;
};
