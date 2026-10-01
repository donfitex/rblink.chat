import React from 'react';
import { FileText, Image as ImageIcon, Download, Copy, Check, FileCode, FileSpreadsheet, Paperclip } from 'lucide-react';
import { Attachment } from '../../types';
import { formatFileSize } from '../../utils/formatters';

interface FileAttachmentCardProps {
  attachment: Attachment;
  onPreviewImage?: (attachment: Attachment) => void;
  onPreviewPdf?: (attachment: Attachment) => void;
}

export const FileAttachmentCard: React.FC<FileAttachmentCardProps> = ({
  attachment,
  onPreviewImage,
  onPreviewPdf,
}) => {
  const [copied, setCopied] = React.useState(false);
  const isImage = attachment.type.startsWith('image/');
  const isPdf = attachment.type === 'application/pdf';

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + attachment.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="w-5 h-5 text-blue-400" />;
    if (isPdf) return <FileText className="w-5 h-5 text-red-400" />;
    if (attachment.name.endsWith('.js') || attachment.name.endsWith('.ts') || attachment.name.endsWith('.json')) {
      return <FileCode className="w-5 h-5 text-yellow-400" />;
    }
    if (attachment.name.endsWith('.csv') || attachment.name.endsWith('.xlsx')) {
      return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
    }
    return <Paperclip className="w-5 h-5 text-gray-400" />;
  };

  if (isImage) {
    return (
      <div className="my-2 max-w-sm rounded-lg border border-[#383F45] bg-[#222529] overflow-hidden group shadow-md">
        <div
          onClick={() => onPreviewImage?.(attachment)}
          className="relative max-h-60 overflow-hidden cursor-pointer bg-[#121417] flex items-center justify-center"
        >
          <img
            src={attachment.previewUrl || attachment.url}
            alt={attachment.name}
            loading="lazy"
            className="w-full h-auto object-cover max-h-60 transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="px-3 py-1 rounded-full bg-black/70 text-white text-xs font-medium">
              Click to enlarge
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between p-2.5 bg-[#1B1D21] border-t border-[#2D3136] text-xs text-[#ABABAD]">
          <div className="truncate pr-2">
            <p className="font-medium text-white truncate">{attachment.name}</p>
            <p className="text-[11px] text-[#8D9197]">{formatFileSize(attachment.size)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded hover:bg-[#2D3136] text-[#ABABAD] hover:text-white"
              title="Copy link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={attachment.url}
              download={attachment.name}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-[#2D3136] text-[#ABABAD] hover:text-white"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => isPdf ? onPreviewPdf?.(attachment) : null}
      className={`my-2 max-w-sm flex items-center justify-between p-3 rounded-lg border border-[#383F45] bg-[#222529] hover:border-[#565D65] transition-all shadow-md ${
        isPdf ? 'cursor-pointer group' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div className="p-2 rounded-md bg-[#1A1D21] border border-[#2D3136]">
          {getFileIcon()}
        </div>
        <div className="truncate">
          <p className="font-medium text-white text-sm truncate group-hover:text-[#1D9BD1] transition-colors">
            {attachment.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-[#8D9197]">
            <span>{formatFileSize(attachment.size)}</span>
            {isPdf && <span className="text-[#1D9BD1] font-medium">• Click to view PDF</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={handleCopyLink}
          className="p-1.5 rounded hover:bg-[#2D3136] text-[#ABABAD] hover:text-white"
          title="Copy link"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
        <a
          href={attachment.url}
          download={attachment.name}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded hover:bg-[#2D3136] text-[#ABABAD] hover:text-white"
          title="Download"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
