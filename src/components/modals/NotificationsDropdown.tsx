import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  AtSign,
  MessageSquare,
  MessageCircle,
  Settings,
  Check
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { formatRelativeTime } from '../../utils/formatters';

interface NotificationsDropdownProps {
  onClose: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ onClose }) => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    jumpToMessage,
    users,
    notificationSettings,
    updateNotificationSettings
  } = useChat();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'settings'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    return true;
  });

  const handleClickNotification = (n: any) => {
    markNotificationRead(n.id);
    if (n.messageId) {
      const targetId = n.channelId || n.dmId || '';
      jumpToMessage(targetId, n.messageId, Boolean(n.dmId));
    }
    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <AtSign className="w-4 h-4 text-[#68CDFF]" />;
      case 'dm':
        return <MessageCircle className="w-4 h-4 text-emerald-400" />;
      case 'thread_reply':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div
      className="absolute top-12 right-0 z-50 w-80 sm:w-96 rounded-xl bg-[#222529] border border-[#383F45] shadow-2xl overflow-hidden flex flex-col text-[#D1D2D3] animate-fadeIn"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#383F45] bg-[#1A1D21]">
        <h4 className="font-bold text-white text-sm">Notifications</h4>
        <div className="flex items-center gap-1">
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#1D9BD1] hover:underline px-2 py-1 rounded hover:bg-[#2D3136]"
            title="Mark all as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
          <button
            onClick={onClose}
            className="text-[#8D9197] hover:text-white p-1 rounded hover:bg-[#2D3136]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#383F45] bg-[#1E2228] text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-[#1264A3] text-white'
                : 'text-[#ABABAD] hover:bg-[#2D3136]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              activeTab === 'unread'
                ? 'bg-[#1264A3] text-white'
                : 'text-[#ABABAD] hover:bg-[#2D3136]'
            }`}
          >
            Unread
          </button>
        </div>

        <button
          onClick={() => setActiveTab(activeTab === 'settings' ? 'all' : 'settings')}
          className={`p-1.5 rounded-md hover:bg-[#2D3136] text-[#ABABAD] hover:text-white ${
            activeTab === 'settings' ? 'text-white bg-[#2D3136]' : ''
          }`}
          title="Notification Preferences"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List or Settings */}
      <div className="max-h-80 overflow-y-auto">
        {activeTab === 'settings' ? (
          <div className="p-4 space-y-3 text-xs">
            <h5 className="font-semibold text-white uppercase text-[11px] mb-2">
              Notification Preferences
            </h5>
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-[#1A1D21] border border-[#383F45]">
              <span>Direct message notifications</span>
              <input
                type="checkbox"
                checked={notificationSettings.dmNotifications}
                onChange={(e) =>
                  updateNotificationSettings({ dmNotifications: e.target.checked })
                }
                className="rounded bg-[#222529] border-[#383F45] text-[#1264A3]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-[#1A1D21] border border-[#383F45]">
              <span>@mention notifications</span>
              <input
                type="checkbox"
                checked={notificationSettings.mentionNotifications}
                onChange={(e) =>
                  updateNotificationSettings({ mentionNotifications: e.target.checked })
                }
                className="rounded bg-[#222529] border-[#383F45] text-[#1264A3]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-[#1A1D21] border border-[#383F45]">
              <span>Thread reply notifications</span>
              <input
                type="checkbox"
                checked={notificationSettings.threadNotifications}
                onChange={(e) =>
                  updateNotificationSettings({ threadNotifications: e.target.checked })
                }
                className="rounded bg-[#222529] border-[#383F45] text-[#1264A3]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-[#1A1D21] border border-[#383F45]">
              <span>In-app alert sounds</span>
              <input
                type="checkbox"
                checked={notificationSettings.soundEnabled}
                onChange={(e) =>
                  updateNotificationSettings({ soundEnabled: e.target.checked })
                }
                className="rounded bg-[#222529] border-[#383F45] text-[#1264A3]"
              />
            </label>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 text-center text-[#8D9197] text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 text-[#565D65]" />
            <p>You're all caught up!</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const actor = users.find((u) => u.id === notif.actorId);

            return (
              <div
                key={notif.id}
                onClick={() => handleClickNotification(notif)}
                className={`flex items-start gap-3 p-3 border-b border-[#383F45]/50 hover:bg-[#282B30] cursor-pointer transition-colors ${
                  !notif.isRead ? 'bg-[#1264A3]/10' : ''
                }`}
              >
                <div className="p-1.5 rounded-lg bg-[#1A1D21] border border-[#383F45] shrink-0 mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-semibold text-white truncate">{notif.title}</p>
                    <span className="text-[10px] text-[#8D9197] shrink-0">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-[#ABABAD] line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {!notif.isRead && (
                  <span className="w-2 h-2 rounded-full bg-[#1264A3] shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
