import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Folder, Image, FileText, Download, Copy, Check } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Attachment } from '../../types';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';

export const FilesGalleryModal: React.FC = () => {
  const {
    isFilesGalleryOpen,
    setIsFilesGalleryOpen,
    currentMessages,
    currentChannel,
    setPreviewImage,
    setPreviewPdf,
    showToast
  } = useChat();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'documents'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilesGalleryOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsFilesGalleryOpen]);

  // Aggregate all attachments from channel messages
  const allAttachments = useMemo(() => {
    const list: (Attachment & { messageTimestamp: string })[] = [];
    currentMessages.forEach((msg) => {
      if (msg.attachments) {
        msg.attachments.forEach((att) => {
          list.push({ ...att, messageTimestamp: msg.timestamp });
        });
      }
    });
    return list;
  }, [currentMessages]);

  const filtered = useMemo(() => {
    return allAttachments.filter((att) => {
      const matchSearch = att.name.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (filterType === 'images') return att.type.startsWith('image/');
      if (filterType === 'documents') return !att.type.startsWith('image/');
      return true;
    });
  }, [allAttachments, search, filterType]);

  if (!isFilesGalleryOpen) return null;

  const handleCopy = (att: Attachment) => {
    navigator.clipboard.writeText(window.location.origin + att.url);
    setCopiedId(att.id);
    showToast('File link copied', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className="w-full max-w-3xl h-[80vh] bg-[#1A1D21] border border-[#383F45] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#D1D2D3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#222529] border-b border-[#383F45]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1264A3]/20 text-[#68CDFF]">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Channel Files & Gallery</h3>
              <p className="text-xs text-[#8D9197]">
                Browsing shared files in #{currentChannel?.name || 'conversation'} ({allAttachments.length} items)
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsFilesGalleryOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#2D3136] text-[#ABABAD] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#1E2228] border-b border-[#383F45]">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8D9197]" />
            <input
              type="text"
              placeholder="Search files by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#8D9197] focus:outline-none focus:border-[#1264A3]"
            />
          </div>

          <div className="flex items-center gap-1 self-start sm:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'all'
                  ? 'bg-[#1264A3] text-white'
                  : 'bg-[#2D3136] text-[#ABABAD] hover:text-white'
              }`}
            >
              All Files
            </button>
            <button
              onClick={() => setFilterType('images')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'images'
                  ? 'bg-[#1264A3] text-white'
                  : 'bg-[#2D3136] text-[#ABABAD] hover:text-white'
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setFilterType('documents')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'documents'
                  ? 'bg-[#1264A3] text-white'
                  : 'bg-[#2D3136] text-[#ABABAD] hover:text-white'
              }`}
            >
              Documents & PDFs
            </button>
          </div>
        </div>

        {/* Content Grid / List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-[#8D9197]">
              <Folder className="w-12 h-12 mx-auto mb-2 text-[#565D65]" />
              <p className="text-sm font-medium">No files found</p>
              <p className="text-xs">Drop or attach files into this channel to see them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map((att) => {
                const isImage = att.type.startsWith('image/');
                const isPdf = att.type === 'application/pdf';

                return (
                  <div
                    key={att.id}
                    className="flex flex-col rounded-lg border border-[#383F45] bg-[#222529] overflow-hidden hover:border-[#565D65] transition-all group"
                  >
                    {isImage ? (
                      <div
                        onClick={() => setPreviewImage(att)}
                        className="h-32 bg-[#121417] cursor-pointer overflow-hidden flex items-center justify-center relative"
                      >
                        <img
                          src={att.previewUrl || att.url}
                          alt={att.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="text-xs bg-black/70 text-white px-2 py-1 rounded">
                            Preview
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => isPdf && setPreviewPdf(att)}
                        className={`h-32 bg-[#1B1D21] flex flex-col items-center justify-center ${
                          isPdf ? 'cursor-pointer hover:bg-[#25282D]' : ''
                        }`}
                      >
                        <FileText className="w-10 h-10 text-red-400 mb-1" />
                        <span className="text-xs text-[#8D9197]">
                          {isPdf ? 'PDF Document' : 'File'}
                        </span>
                      </div>
                    )}

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="font-semibold text-xs text-white truncate" title={att.name}>
                          {att.name}
                        </p>
                        <p className="text-[11px] text-[#8D9197] mt-0.5">
                          {formatFileSize(att.size)} • {formatRelativeTime(att.messageTimestamp)}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-[#383F45]/50">
                        <button
                          onClick={() => handleCopy(att)}
                          className="p-1 rounded hover:bg-[#2D3136] text-[#ABABAD] hover:text-white"
                          title="Copy file link"
                        >
                          {copiedId === att.id ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={att.url}
                          download={att.name}
                          className="p-1 rounded hover:bg-[#2D3136] text-[#ABABAD] hover:text-white"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
