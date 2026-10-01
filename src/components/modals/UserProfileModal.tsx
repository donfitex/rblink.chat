import React, { useState, useEffect } from 'react';
import { X, Mail, Shield, Clock, Edit2, MessageSquare, Check, User as UserIcon } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { User } from '../../types';

export const UserProfileModal: React.FC = () => {
  const {
    viewingUserProfile,
    setViewingUserProfile,
    activeUser,
    updateProfile,
    createDirectMessage,
    toggleBlockUser,
    blockedUserIds
  } = useChat();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (viewingUserProfile) {
      setName(viewingUserProfile.name);
      setUsername(viewingUserProfile.username);
      setBio(viewingUserProfile.bio || '');
      setDepartment(viewingUserProfile.department || '');
      setAvatarUrl(viewingUserProfile.avatar);
      setIsEditing(false);
    }
  }, [viewingUserProfile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewingUserProfile(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setViewingUserProfile]);

  if (!viewingUserProfile) return null;

  const isSelf = viewingUserProfile.id === activeUser.id;
  const isBlocked = blockedUserIds.includes(viewingUserProfile.id);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim(),
      username: username.trim(),
      bio: bio.trim(),
      department: department.trim(),
      avatar: avatarUrl.trim() || viewingUserProfile.avatar
    });
    setIsEditing(false);
  };

  const handleStartDm = () => {
    createDirectMessage([viewingUserProfile.id]);
    setViewingUserProfile(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={() => setViewingUserProfile(null)}
    >
      <div
        className="w-full max-w-md bg-[#222529] border border-[#383F45] rounded-xl shadow-2xl overflow-hidden text-[#D1D2D3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-[#1264A3] to-[#2BAC76] relative p-4">
          <button
            onClick={() => setViewingUserProfile(null)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Avatar & Header */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <img
                src={isEditing ? avatarUrl || viewingUserProfile.avatar : viewingUserProfile.avatar}
                alt={viewingUserProfile.name}
                className="w-24 h-24 rounded-2xl border-4 border-[#222529] object-cover shadow-lg bg-[#1A1D21]"
              />
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#222529] ${
                  viewingUserProfile.presence === 'online'
                    ? 'bg-emerald-500'
                    : viewingUserProfile.presence === 'away'
                    ? 'bg-amber-500'
                    : viewingUserProfile.presence === 'dnd'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              {isSelf ? (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D3136] hover:bg-[#383F45] text-xs font-semibold text-white transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              ) : (
                <button
                  onClick={handleStartDm}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1264A3] hover:bg-[#1164A3] text-xs font-semibold text-white transition-colors shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1264A3]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1264A3]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1264A3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
                  Department / Role
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1264A3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
                  Bio
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1264A3] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#2D3136] text-xs font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#1264A3] text-xs font-semibold text-white shadow"
                >
                  Save Profile
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="mb-3">
                <h3 className="font-bold text-white text-lg">{viewingUserProfile.name}</h3>
                <p className="text-xs text-[#8D9197]">@{viewingUserProfile.username}</p>
                {viewingUserProfile.department && (
                  <p className="text-xs text-[#1D9BD1] font-medium mt-0.5">
                    {viewingUserProfile.department}
                  </p>
                )}
              </div>

              {/* Status Message */}
              {viewingUserProfile.customStatus && (
                <div className="p-2.5 rounded-lg bg-[#1A1D21] border border-[#383F45] mb-4 flex items-center gap-2">
                  <span className="text-base">{viewingUserProfile.customStatus.emoji}</span>
                  <span className="text-xs text-white font-medium">
                    {viewingUserProfile.customStatus.text}
                  </span>
                </div>
              )}

              {/* Bio */}
              {viewingUserProfile.bio && (
                <p className="text-xs text-[#ABABAD] mb-4 leading-relaxed bg-[#1E2228] p-3 rounded-lg border border-[#383F45]">
                  {viewingUserProfile.bio}
                </p>
              )}

              {/* Metadata details */}
              <div className="space-y-2 pt-2 border-t border-[#383F45] text-xs text-[#8D9197]">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#ABABAD]" />
                  <span>{viewingUserProfile.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-[#ABABAD]" />
                  <span className="capitalize">{viewingUserProfile.role}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#ABABAD]" />
                  <span>Active {viewingUserProfile.lastActive || 'recently'}</span>
                </div>
              </div>

              {/* Moderation: Block User */}
              {!isSelf && (
                <div className="mt-4 pt-3 border-t border-[#383F45] flex justify-end">
                  <button
                    onClick={() => toggleBlockUser(viewingUserProfile.id)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    {isBlocked ? 'Unblock user' : 'Block user'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
