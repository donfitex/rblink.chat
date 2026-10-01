import React, { useState, useEffect } from 'react';
import { X, Hash, Lock, Globe, AlertCircle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Channel } from '../../types';

export const CreateChannelModal: React.FC = () => {
  const { isCreateChannelOpen, setIsCreateChannelOpen, createChannel } = useChat();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [category, setCategory] = useState<Channel['category']>('general');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCreateChannelOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCreateChannelOpen]);

  if (!isCreateChannelOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Auto sanitize to lowercase and hyphens
    const sanitized = raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setName(sanitized);
    if (sanitized.length > 0) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a channel name.');
      return;
    }
    const success = createChannel(name, description, topic, isPrivate, category);
    if (success) {
      setName('');
      setDescription('');
      setTopic('');
      setIsPrivate(false);
      setIsCreateChannelOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={() => setIsCreateChannelOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-[#222529] border border-[#383F45] rounded-xl shadow-2xl p-6 text-[#D1D2D3]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#383F45]">
          <h3 className="font-bold text-white text-lg">Create a channel</h3>
          <button
            onClick={() => setIsCreateChannelOpen(false)}
            className="text-[#8D9197] hover:text-white p-1 rounded hover:bg-[#2D3136]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#ABABAD] mt-2 mb-4 leading-relaxed">
          Channels are where your team collaborates on projects, topics, or ideas.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Channel Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
              Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D9197] font-semibold text-sm">
                #
              </span>
              <input
                type="text"
                placeholder="e.g. project-apollo"
                value={name}
                onChange={handleNameChange}
                maxLength={40}
                className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#1264A3]"
                autoFocus
              />
            </div>
            {error ? (
              <p className="flex items-center gap-1 text-xs text-red-400 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            ) : (
              <p className="text-[11px] text-[#8D9197] mt-1">
                Names must be lowercase, alphanumeric, with hyphens.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
              Description <span className="text-[#8D9197] lowercase font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="What is this channel about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1264A3]"
            />
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
              Topic <span className="text-[#8D9197] lowercase font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Set a topic for your teammates..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1264A3]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1264A3]"
            >
              <option value="general">General</option>
              <option value="engineering">Engineering</option>
              <option value="product">Product & Design</option>
              <option value="announcements">Announcements</option>
              <option value="random">Random & Social</option>
            </select>
          </div>

          {/* Private Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-[#383F45] bg-[#1A1D21]">
            <div className="flex items-center gap-3">
              {isPrivate ? (
                <Lock className="w-5 h-5 text-amber-400" />
              ) : (
                <Globe className="w-5 h-5 text-[#1D9BD1]" />
              )}
              <div>
                <p className="font-semibold text-xs text-white">
                  {isPrivate ? 'Make Private' : 'Public Channel'}
                </p>
                <p className="text-[11px] text-[#8D9197]">
                  {isPrivate
                    ? 'Only invited members can view or join this channel.'
                    : 'Anyone in your workspace can view and join.'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#383F45] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1264A3]"></div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#383F45]">
            <button
              type="button"
              onClick={() => setIsCreateChannelOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#2D3136] hover:bg-[#383F45] text-xs font-semibold text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#1264A3] hover:bg-[#1164A3] text-xs font-semibold text-white shadow-md"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
