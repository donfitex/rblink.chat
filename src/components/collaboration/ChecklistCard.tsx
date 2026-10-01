import React from 'react';
import { CheckSquare, Square, ListChecks } from 'lucide-react';
import { Checklist, User } from '../../types';

interface ChecklistCardProps {
  checklist: Checklist;
  currentUserId: string;
  users: User[];
  onToggleItem: (checklistId: string, itemId: string) => void;
}

export const ChecklistCard: React.FC<ChecklistCardProps> = ({
  checklist,
  currentUserId,
  users,
  onToggleItem,
}) => {
  const completedCount = checklist.items.filter((i) => i.completed).length;
  const totalCount = checklist.items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getUserName = (userId?: string) => {
    if (!userId) return null;
    return users.find((u) => u.id === userId)?.name || 'Someone';
  };

  return (
    <div className="my-2.5 max-w-lg rounded-lg border border-[#383F45] bg-[#222529] p-4 text-[#D1D2D3] shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400">
            <ListChecks className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-white text-sm sm:text-base">
            {checklist.title}
          </h4>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#2D3136] text-[#ABABAD]">
          {completedCount} / {totalCount} completed
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#1A1D21] rounded-full h-1.5 mb-3 overflow-hidden">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-1.5">
        {checklist.items.map((item) => {
          const completedByName = getUserName(item.completedBy);

          return (
            <button
              key={item.id}
              onClick={() => onToggleItem(checklist.id, item.id)}
              className={`w-full flex items-start gap-2.5 p-2 rounded-md transition-colors text-left text-sm group ${
                item.completed
                  ? 'bg-[#1A1D21]/60 text-[#8D9197]'
                  : 'hover:bg-[#1A1D21] text-[#D1D2D3]'
              }`}
            >
              <div className="mt-0.5 text-emerald-400 group-hover:scale-110 transition-transform">
                {item.completed ? (
                  <CheckSquare className="w-4 h-4 fill-emerald-500 text-[#222529]" />
                ) : (
                  <Square className="w-4 h-4 text-[#565D65] group-hover:text-[#ABABAD]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className={item.completed ? 'line-through text-[#8D9197]' : 'text-white'}>
                  {item.text}
                </span>
                {item.completed && completedByName && (
                  <span className="block text-[11px] text-[#6E737A]">
                    Completed by {completedByName}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
