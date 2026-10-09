import React, { useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { TopNavbar } from './TopNavbar';
import { Sidebar } from './Sidebar';
import { ChannelHeader } from '../chat/ChannelHeader';
import { MessageList } from '../chat/MessageList';
import { MessageComposer } from '../chat/MessageComposer';
import { ThreadDrawer } from '../chat/ThreadDrawer';
import { ChannelCanvas } from '../collaboration/ChannelCanvas';
import { FilesGalleryModal } from '../files/FilesGalleryModal';
import { ImageLightbox } from '../files/ImageLightbox';
import { PdfViewerModal } from '../files/PdfViewerModal';
import { CreateChannelModal } from '../modals/CreateChannelModal';
import { BrowseChannelsModal } from '../modals/BrowseChannelsModal';
import { DirectMessageModal } from '../modals/DirectMessageModal';
import { SearchModal } from '../modals/SearchModal';
import { UserProfileModal } from '../modals/UserProfileModal';
import { StatusModal } from '../modals/StatusModal';
import { WorkspaceSettingsModal } from '../modals/WorkspaceSettingsModal';
import { OnboardingModal } from '../modals/OnboardingModal';
import { KeyboardShortcutsModal } from '../modals/KeyboardShortcutsModal';
import { ReportMessageModal } from '../modals/ReportMessageModal';
import { SavedItemsDrawer } from '../modals/SavedItemsDrawer';
import { PinnedItemsDrawer } from '../modals/PinnedItemsDrawer';
import { ToastContainer } from '../ui/Toast';
import { X } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const {
    currentChannel,
    currentDm,
    activeThread,
    mobileNavOpen,
    setMobileNavOpen,
    setIsSearchOpen,
    setIsShortcutsOpen,
    previewImage,
    setPreviewImage,
    previewPdf,
    setPreviewPdf,
    users
  } = useChat();

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K and Ctrl+/ / Cmd+/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen, setIsShortcutsOpen]);

  const targetDmUser =
    currentDm && !currentDm.isGroup
      ? users.find((u) => currentDm.participantIds.includes(u.id))
      : null;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#1A1D21] text-[#D1D2D3]">
      {/* Top Navigation */}
      <TopNavbar />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex h-full">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay Drawer */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-40 flex bg-black/60 backdrop-blur-sm md:hidden animate-fadeIn"
            onClick={() => setMobileNavOpen(false)}
          >
            <div
              className="w-72 h-full bg-[#19171D] shadow-2xl relative animate-slideInLeft"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setMobileNavOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-[#ABABAD] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <Sidebar />
            </div>
          </div>
        )}

        {/* Center Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#1A1D21] h-full overflow-hidden">
          <ChannelHeader />
          <MessageList />
          <MessageComposer
            channelName={currentChannel?.name}
            dmName={currentDm?.isGroup ? currentDm.name : targetDmUser?.name}
          />
        </main>

        {/* Right Side Thread Panel */}
        {activeThread && <ThreadDrawer />}
      </div>

      {/* Collaboration Modals & Drawers */}
      <ChannelCanvas />
      <FilesGalleryModal />
      <CreateChannelModal />
      <BrowseChannelsModal />
      <DirectMessageModal />
      <SearchModal />
      <UserProfileModal />
      <StatusModal />
      <WorkspaceSettingsModal />
      <OnboardingModal />
      <KeyboardShortcutsModal />
      <ReportMessageModal />
      <SavedItemsDrawer />
      <PinnedItemsDrawer />

      {/* File Lightboxes */}
      <ImageLightbox attachment={previewImage} onClose={() => setPreviewImage(null)} />
      <PdfViewerModal attachment={previewPdf} onClose={() => setPreviewPdf(null)} />

      {/* Floating Toast Notification Stack */}
      <ToastContainer />
    </div>
  );
};
