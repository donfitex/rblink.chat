import React, { useState, useEffect } from 'react';
import { X, BookOpen, Edit3, Eye, Check, Save } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { MarkdownContent } from '../chat/MarkdownContent';

export const ChannelCanvas: React.FC = () => {
  const { isCanvasOpen, setIsCanvasOpen, currentChannel, updateChannelCanvas, users, showToast } =
    useChat();

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (currentChannel) {
      setContent(currentChannel.canvas || `# #${currentChannel.name} Canvas\n\nTake shared team notes here.`);
    }
  }, [currentChannel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCanvasOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCanvasOpen]);

  if (!isCanvasOpen || !currentChannel) return null;

  const handleSave = () => {
    updateChannelCanvas(currentChannel.id, content);
    setIsEditing(false);
    showToast('Channel canvas saved', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className="w-full max-w-4xl h-[85vh] bg-[#1A1D21] border border-[#383F45] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#D1D2D3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#222529] border-b border-[#383F45]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1264A3]/20 text-[#68CDFF]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                #{currentChannel.name} Canvas & Notes
              </h3>
              <p className="text-xs text-[#8D9197]">
                Shared collaborative workspace document for this channel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D3136] hover:bg-[#383F45] text-xs font-semibold text-white transition-colors"
            >
              {isEditing ? (
                <>
                  <Eye className="w-3.5 h-3.5" /> Preview
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" /> Edit Markdown
                </>
              )}
            </button>

            {isEditing && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1264A3] hover:bg-[#1164A3] text-xs font-semibold text-white transition-colors shadow"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            )}

            <button
              onClick={() => setIsCanvasOpen(false)}
              className="p-1.5 rounded-lg hover:bg-[#2D3136] text-[#ABABAD] hover:text-white transition-colors ml-2"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#1A1D21]">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full bg-[#121417] text-white font-mono text-sm p-4 rounded-lg border border-[#383F45] focus:outline-none focus:border-[#1264A3] resize-none leading-relaxed"
              placeholder="Write channel notes in markdown..."
            />
          ) : (
            <div className="max-w-3xl mx-auto py-2">
              <MarkdownContent content={content} users={users} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
