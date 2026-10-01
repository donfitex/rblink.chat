import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Play, Globe } from 'lucide-react';
import { LinkPreview } from '../../types';

interface LinkPreviewCardProps {
  preview: LinkPreview;
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ preview }) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(preview.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return preview.siteName || 'External link';
    }
  };

  return (
    <div className="my-2 max-w-lg rounded-lg border border-[#383F45] bg-[#222529] overflow-hidden text-sm shadow-md transition-all hover:border-[#565D65]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1B1D21] border-b border-[#2D3136] text-xs text-[#ABABAD]">
        <div className="flex items-center gap-1.5 truncate">
          {preview.favicon ? (
            <img src={preview.favicon} alt="" className="w-3.5 h-3.5 rounded-sm" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-[#8D9197]" />
          )}
          <span className="font-medium truncate">{preview.siteName || getDomain(preview.url)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-[#2D3136] text-[#ABABAD] hover:text-white transition-colors"
            title="Copy link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-[#2D3136] text-[#ABABAD] hover:text-white transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Video Embed or Media Image */}
      {preview.type === 'youtube' && preview.videoId ? (
        isPlayingVideo ? (
          <div className="relative aspect-video w-full bg-black">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${preview.videoId}?autoplay=1`}
              title={preview.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div
            onClick={() => setIsPlayingVideo(true)}
            className="relative aspect-video w-full bg-[#121417] cursor-pointer group overflow-hidden"
          >
            {preview.imageUrl && (
              <img
                src={preview.imageUrl}
                alt={preview.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-colors group-hover:bg-black/25">
              <div className="w-12 h-12 rounded-full bg-[#E01E5A] flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>
          </div>
        )
      ) : preview.imageUrl ? (
        <a href={preview.url} target="_blank" rel="noopener noreferrer" className="block max-h-48 overflow-hidden bg-black/20">
          <img
            src={preview.imageUrl}
            alt={preview.title}
            className="w-full h-full object-cover max-h-48 hover:opacity-90 transition-opacity"
          />
        </a>
      ) : null}

      {/* Title & Description */}
      <a
        href={preview.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-3 hover:bg-[#282B30] transition-colors"
      >
        <h4 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-[#1D9BD1]">
          {preview.title}
        </h4>
        {preview.description && (
          <p className="text-xs text-[#ABABAD] mt-1 line-clamp-2 leading-relaxed">
            {preview.description}
          </p>
        )}
      </a>
    </div>
  );
};
