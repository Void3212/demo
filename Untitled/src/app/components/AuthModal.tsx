import type { ReactNode } from "react";

interface AuthModalProps {
  children: ReactNode;
  onClose: () => void;
}

export default function AuthModal({ children, onClose }: AuthModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[1120px] rounded-[40px] bg-white shadow-[0_40px_120px_rgba(0,0,0,0.18)]">
        {children}
      </div>
    </div>
  );
}
