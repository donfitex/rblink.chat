import React, { useEffect } from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';
import { Attachment } from '../../types';
import { formatFileSize } from '../../utils/formatters';

interface PdfViewerModalProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ attachment, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!attachment) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[85vh] rounded-xl bg-[#1A1D21] border border-[#383F45] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#222529] border-b border-[#383F45]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-red-500/20 text-red-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base truncate">{attachment.name}</h3>
              <p className="text-xs text-[#8D9197]">{formatFileSize(attachment.size)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D3136] hover:bg-[#383F45] text-xs font-medium text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open New Tab
            </a>
            <a
              href={attachment.url}
              download={attachment.name}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1264A3] hover:bg-[#1164A3] text-xs font-medium text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#2D3136] text-[#ABABAD] hover:text-white transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded PDF iframe */}
        <div className="flex-1 bg-[#121417]">
          <iframe
            src={`${attachment.url}#toolbar=1`}
            title={attachment.name}
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
