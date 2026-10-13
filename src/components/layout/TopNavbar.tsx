import React, { useState } from 'react';
import {
  Search,
  Bell,
  HelpCircle,
  Menu,
  ChevronDown,
  UserCheck,
  Sparkles,
  Settings,
  Smile,
  LogOut,
  Command
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { NotificationsDropdown } from '../modals/NotificationsDropdown';

export const TopNavbar: React.FC = () => {
  const {
    workspace,
    activeUser,
    users,
    switchActiveUser,
    unreadNotificationCount,
    setIsSearchOpen,
    setIsShortcutsOpen,
    setIsWorkspaceSettingsOpen,
    setIsOnboardingOpen,
    setStatusModalOpen,
    setViewingUserProfile,
    setMobileNavOpen
  } = useChat();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-11 bg-[#121417] border-b border-[#383F45] px-3 flex items-center justify-between shrink-0 select-none z-30">
      {/* Left: Mobile Menu Toggle + Workspace Badge */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden p-1.5 rounded-lg text-[#ABABAD] hover:text-white hover:bg-[#2D3136]"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsWorkspaceSettingsOpen(true)}
          className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-[#2D3136] text-white font-bold text-sm transition-colors group"
        >
          <img
            src={workspace.logoUrl}
            alt=""
            className="w-5 h-5 rounded object-cover shadow-sm"
          />
          <span className="tracking-tight">{workspace.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#8D9197] group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Center: Global Search Bar Trigger (Ctrl+K) */}
      <div className="flex-1 max-w-xl mx-4">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1 bg-[#222529] hover:bg-[#282B30] border border-[#383F45] rounded-lg text-xs text-[#8D9197] transition-all group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#8D9197] group-hover:text-white" />
            <span className="group-hover:text-[#D1D2D3]">Search messages, files, people...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-[#1A1D21] border border-[#383F45] rounded text-[#8D9197]">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Switch User + Notifications + Help */}
      <div className="flex items-center gap-1.5">
        {/* Switch Active User Dropdown (Pair testing simulation) */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1A1D21] border border-[#383F45] hover:border-[#565D65] text-xs text-white transition-colors"
            title="Account menu"
          >
            <div className="relative">
              <img
                src={activeUser.avatar}
                alt={activeUser.name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                  activeUser.presence === 'online'
                    ? 'bg-emerald-500'
                    : activeUser.presence === 'away'
                    ? 'bg-amber-500'
                    : activeUser.presence === 'dnd'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                }`}
              />
            </div>
            <span className="hidden md:inline font-semibold text-xs truncate max-w-[90px]">
              {activeUser.name.split(' ')[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-[#8D9197]" />
          </button>

          {/* User Menu Popover */}
          {showUserMenu && (
            <div
              className="absolute right-0 top-10 z-50 w-64 rounded-xl bg-[#222529] border border-[#383F45] shadow-2xl py-2 text-[#D1D2D3] animate-fadeIn text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 pb-2 border-b border-[#383F45]">
                <p className="font-bold text-white text-sm">{activeUser.name}</p>
                <p className="text-[#8D9197]">@{activeUser.username}</p>
                {activeUser.customStatus && (
                  <p className="text-[#1D9BD1] mt-1 font-medium">
                    {activeUser.customStatus.emoji} {activeUser.customStatus.text}
                  </p>
                )}
              </div>

              {/* Status & Profile Actions */}
              <div className="py-1 border-b border-[#383F45]">
                <button
                  onClick={() => {
                    setStatusModalOpen(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-[#2D3136] text-left"
                >
                  <Smile className="w-3.5 h-3.5 text-amber-400" />
                  Set status & presence
                </button>
                <button
                  onClick={() => {
                    setViewingUserProfile(activeUser);
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-[#2D3136] text-left"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#1D9BD1]" />
                  View & edit profile
                </button>
                <button
                  onClick={() => {
                    setIsOnboardingOpen(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-[#2D3136] text-left text-[#68CDFF]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Restart welcome onboarding
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg hover:bg-[#2D3136] text-[#ABABAD] hover:text-white transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute 0 top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#E01E5A] ring-2 ring-[#121417]" />
            )}
          </button>

          {showNotifications && (
            <NotificationsDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* Shortcuts Cheat Sheet */}
        <button
          onClick={() => setIsShortcutsOpen(true)}
          className="p-1.5 rounded-lg hover:bg-[#2D3136] text-[#ABABAD] hover:text-white transition-colors"
          title="Keyboard Shortcuts (Ctrl+/)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
