import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Copy, Check } from 'lucide-react';
import { Attachment } from '../../types';

interface ImageLightboxProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ attachment, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!attachment) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(attachment.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div
        className="flex items-center justify-between px-6 py-4 bg-black/60 text-white border-b border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="truncate mr-4">
          <h3 className="text-sm font-semibold truncate">{attachment.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            title="Copy Link"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <a
            href={attachment.url}
            download={attachment.name}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/20 hover:bg-red-500 text-white transition-colors ml-2"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-[85vh] max-w-[90vw] object-contain transition-transform duration-200 shadow-2xl select-none"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};
