import React, { useRef, useState } from 'react';

// Press to record, press again to stop. Returns the recording as a File via onDone.
export const VoiceRecorder = ({ onDone, disabled }: { onDone: (f: File) => void; disabled?: boolean }) => {
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const mr = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<any>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const r = new MediaRecorder(stream, { mimeType: mime });
      chunks.current = [];
      r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timer.current);
        setRec(false);
        const ext = mime === 'audio/webm' ? 'webm' : 'm4a';
        if (chunks.current.length) onDone(new File(chunks.current, `voice-${Date.now()}.${ext}`, { type: mime }));
      };
      r.start();
      mr.current = r;
      setRec(true);
      setSecs(0);
      timer.current = setInterval(() => {
        setSecs((s) => {
          if (s >= 119 && r.state === 'recording') r.stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      alert('Microphone access is needed to record a voice note.');
    }
  };
  const stop = () => { if (mr.current && mr.current.state === 'recording') mr.current.stop(); };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={rec ? stop : start}
      title={rec ? 'Stop and send' : 'Record a voice note'}
      className={`rounded-md border px-2.5 py-1.5 text-sm disabled:opacity-50 ${rec ? 'animate-pulse border-red-500 text-red-400' : 'border-[#383F45] text-white hover:bg-[#2D3136]'}`}
    >
      {rec ? `Stop ${secs}s` : '🎤 Voice'}
    </button>
  );
};
