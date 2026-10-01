import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const ReportMessageModal: React.FC = () => {
  const { reportMessageTarget, setReportMessageTarget, reportMessage } = useChat();

  const [reason, setReason] = useState('Harassment or Bullying');
  const [details, setDetails] = useState('');

  if (!reportMessageTarget) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reportMessage(reportMessageTarget.id, `${reason}: ${details}`);
  };

  const reasons = [
    'Harassment or Bullying',
    'Spam or Malicious Links',
    'Inappropriate Content',
    'Violates Code of Conduct',
    'Other reason'
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={() => setReportMessageTarget(null)}
    >
      <div
        className="w-full max-w-md bg-[#222529] border border-[#383F45] rounded-xl shadow-2xl p-6 text-[#D1D2D3]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#383F45] mb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Flag className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Report Inappropriate Message</h3>
          </div>
          <button
            onClick={() => setReportMessageTarget(null)}
            className="text-[#8D9197] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-[#1A1D21] border border-[#383F45] rounded-lg mb-4 text-xs text-[#ABABAD] italic truncate">
          "{reportMessageTarget.content}"
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#ABABAD] mb-2">
              Reason for report
            </label>
            <div className="space-y-1.5">
              {reasons.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2.5 p-2 rounded-lg border border-[#383F45] bg-[#1A1D21] hover:bg-[#25282D] cursor-pointer text-xs text-white"
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-[#1264A3] bg-[#1A1D21] border-[#383F45]"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
              Additional Details (optional)
            </label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide more context for workspace moderators..."
              className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#1264A3] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#383F45]">
            <button
              type="button"
              onClick={() => setReportMessageTarget(null)}
              className="px-4 py-2 rounded-lg bg-[#2D3136] text-xs font-semibold text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
