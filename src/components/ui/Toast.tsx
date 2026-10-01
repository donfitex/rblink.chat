import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useChat();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
            case 'error':
              return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
            case 'warning':
              return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
            default:
              return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
          }
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-[#222529] border border-[#383F45] text-white shadow-xl text-sm min-w-[280px] max-w-sm animate-slideInRight"
          >
            <div className="flex items-center gap-2.5">
              {getIcon()}
              <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-[#8D9197] hover:text-white p-1 rounded hover:bg-[#2D3136]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
