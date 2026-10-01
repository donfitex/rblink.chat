import React, { useState, useEffect } from 'react';
import { X, Building2, Users, Mail, UserPlus, Shield, Trash2, Search } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { UserRole } from '../../types';

export const WorkspaceSettingsModal: React.FC = () => {
  const {
    isWorkspaceSettingsOpen,
    setIsWorkspaceSettingsOpen,
    workspace,
    updateWorkspace,
    users,
    inviteMember,
    cancelInvite,
    removeMember,
    updateMemberRole,
    activeUser
  } = useChat();

  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'invites'>('general');
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description);
  const [logoUrl, setLogoUrl] = useState(workspace.logoUrl);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsWorkspaceSettingsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsWorkspaceSettingsOpen]);

  if (!isWorkspaceSettingsOpen) return null;

  const isOwnerOrAdmin = activeUser.role === 'owner' || activeUser.role === 'admin';

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkspace({ name, description, logoUrl });
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail.trim()) {
      inviteMember(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
    }
  };

  const filteredMembers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(memberSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={() => setIsWorkspaceSettingsOpen(false)}
    >
      <div
        className="w-full max-w-2xl h-[75vh] bg-[#222529] border border-[#383F45] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#D1D2D3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#383F45] bg-[#1A1D21]">
          <div className="flex items-center gap-3">
            <img src={workspace.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h3 className="font-bold text-white text-base">Workspace Settings</h3>
              <p className="text-xs text-[#8D9197]">{workspace.name}</p>
            </div>
          </div>
          <button
            onClick={() => setIsWorkspaceSettingsOpen(false)}
            className="text-[#8D9197] hover:text-white p-1 rounded hover:bg-[#2D3136]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2 border-b border-[#383F45] bg-[#1E2228] text-xs">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'general' ? 'bg-[#1264A3] text-white' : 'text-[#ABABAD] hover:bg-[#2D3136]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> General
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'members' ? 'bg-[#1264A3] text-white' : 'text-[#ABABAD] hover:bg-[#2D3136]'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Members ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'invites' ? 'bg-[#1264A3] text-white' : 'text-[#ABABAD] hover:bg-[#2D3136]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Pending Invites ({workspace.pendingInvites.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1264A3]"
                  disabled={!isOwnerOrAdmin}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
                  Workspace Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1264A3] resize-none"
                  disabled={!isOwnerOrAdmin}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
                  Workspace Logo URL
                </label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1264A3]"
                  disabled={!isOwnerOrAdmin}
                />
              </div>

              {isOwnerOrAdmin && (
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1264A3] hover:bg-[#1164A3] text-xs font-semibold text-white shadow"
                >
                  Save Workspace Changes
                </button>
              )}
            </form>
          )}

          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8D9197]" />
                <input
                  type="text"
                  placeholder="Search workspace members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#1264A3]"
                />
              </div>

              <div className="space-y-2">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#1A1D21] border border-[#383F45]"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">{member.name}</span>
                          <span className="text-[11px] text-[#8D9197]">@{member.username}</span>
                        </div>
                        <p className="text-[11px] text-[#8D9197]">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwnerOrAdmin && member.id !== activeUser.id && member.role !== 'owner' ? (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) => updateMemberRole(member.id, e.target.value as any)}
                            className="bg-[#2D3136] border border-[#383F45] text-xs text-white rounded px-2 py-1 focus:outline-none"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="guest">Guest</option>
                          </select>
                          <button
                            onClick={() => removeMember(member.id)}
                            className="p-1.5 text-[#8D9197] hover:text-red-400 hover:bg-[#2D3136] rounded"
                            title="Remove from workspace"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded bg-[#2D3136] text-[#ABABAD] capitalize font-medium">
                          {member.role}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'invites' && (
            <div className="space-y-4">
              {/* Send Invite Form */}
              {isOwnerOrAdmin && (
                <form
                  onSubmit={handleSendInvite}
                  className="p-4 rounded-xl bg-[#1A1D21] border border-[#383F45] space-y-3"
                >
                  <h4 className="font-semibold text-xs text-white uppercase tracking-wider">
                    Invite new teammate
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      placeholder="teammate@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 bg-[#222529] border border-[#383F45] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1264A3]"
                      required
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="bg-[#222529] border border-[#383F45] text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="guest">Guest</option>
                    </select>
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1264A3] hover:bg-[#1164A3] text-xs font-semibold text-white shadow"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Invite
                    </button>
                  </div>
                </form>
              )}

              {/* Pending Invites List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#8D9197] uppercase">
                  Pending Invitations ({workspace.pendingInvites.length})
                </h4>
                {workspace.pendingInvites.length === 0 ? (
                  <p className="text-xs text-[#8D9197] py-4">No pending invitations.</p>
                ) : (
                  workspace.pendingInvites.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#1A1D21] border border-[#383F45]"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">{inv.email}</p>
                        <p className="text-[11px] text-[#8D9197]">Role: {inv.role}</p>
                      </div>
                      <button
                        onClick={() => cancelInvite(inv.id)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Cancel invite
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
