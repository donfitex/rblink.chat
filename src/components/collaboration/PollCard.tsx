import React from 'react';
import { BarChart3, CheckCircle2, Users } from 'lucide-react';
import { Poll, User } from '../../types';

interface PollCardProps {
  poll: Poll;
  currentUserId: string;
  users: User[];
  onVote: (pollId: string, optionId: string) => void;
}

export const PollCard: React.FC<PollCardProps> = ({
  poll,
  currentUserId,
  users,
  onVote,
}) => {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || 'Someone';
  };

  return (
    <div className="my-2.5 max-w-lg rounded-lg border border-[#383F45] bg-[#222529] p-4 text-[#D1D2D3] shadow-md">
      {/* Poll Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#1264A3]/20 text-[#68CDFF]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#ABABAD]">
            Interactive Poll
          </span>
        </div>
        <span className="text-xs text-[#ABABAD] flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      <h4 className="font-semibold text-white text-base mb-3 leading-snug">
        {poll.question}
      </h4>

      {/* Options List */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const hasVoted = option.votes.includes(currentUserId);
          const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
          const voterNames = option.votes.map(getUserName).join(', ');

          return (
            <button
              key={option.id}
              onClick={() => onVote(poll.id, option.id)}
              disabled={poll.isClosed}
              className={`w-full text-left relative overflow-hidden rounded-md border p-2.5 transition-all text-sm group ${
                hasVoted
                  ? 'border-[#1264A3] bg-[#1264A3]/10 text-white'
                  : 'border-[#383F45] bg-[#1A1D21] hover:border-[#565D65] text-[#D1D2D3]'
              }`}
            >
              {/* Vote Percentage Fill Bar */}
              <div
                className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ease-out ${
                  hasVoted ? 'bg-[#1264A3]/30' : 'bg-[#2D3136]/50'
                }`}
                style={{ width: `${percentage}%` }}
              />

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
                      hasVoted
                        ? 'border-[#1264A3] bg-[#1264A3] text-white'
                        : 'border-[#565D65] group-hover:border-[#ABABAD]'
                    }`}
                  >
                    {hasVoted && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                  <span className="font-medium">{option.text}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="text-[#ABABAD]">{option.votes.length}</span>
                  <span className="w-8 text-right text-white">{percentage}%</span>
                </div>
              </div>

              {/* Voter Avatars / Names tooltip */}
              {option.votes.length > 0 && (
                <div className="relative z-10 mt-1 pl-6 text-xs text-[#8D9197] truncate" title={voterNames}>
                  Voted by: {voterNames}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2.5 border-t border-[#2D3136] flex items-center justify-between text-xs text-[#8D9197]">
        <span>{poll.allowMultiple ? 'Multiple votes allowed' : 'Select one option'}</span>
        <span>Click an option to cast or retract vote</span>
      </div>
    </div>
  );
};
