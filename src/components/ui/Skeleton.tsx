import React from 'react';

export const MessageSkeleton: React.FC = () => {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
      <div className="w-9 h-9 rounded-md bg-[#2D3136] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-24 h-4 rounded bg-[#2D3136]" />
          <div className="w-14 h-3 rounded bg-[#25282C]" />
        </div>
        <div className="w-3/4 h-4 rounded bg-[#282B30]" />
        <div className="w-1/2 h-3.5 rounded bg-[#25282C]" />
      </div>
    </div>
  );
};

export const ChannelSkeleton: React.FC = () => {
  return (
    <div className="space-y-1.5 px-3 py-2 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-2 h-7 rounded px-2">
          <div className="w-4 h-4 rounded bg-[#282B30]" />
          <div className="w-24 h-3 rounded bg-[#282B30]" />
        </div>
      ))}
    </div>
  );
};
