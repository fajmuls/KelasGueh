import React from 'react';

export const ScotchTape: React.FC<{ className?: string; rotate?: string }> = ({ 
  className = '', 
  rotate = 'rotate-[-3deg]' 
}) => (
  <div 
    className={`w-20 h-6 bg-amber-100/75 border border-amber-300/40 rounded-xs shadow-xs pointer-events-none ${rotate} ${className}`}
    style={{
      backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.02) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.02) 75%, transparent 75%, transparent)',
      backgroundSize: '8px 8px'
    }}
  />
);

export const PaperClip: React.FC<{ className?: string }> = ({ className = 'w-6 h-10 text-slate-700' }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 40" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M16 8v20a5 5 0 0 1-10 0V9a3 3 0 0 1 6 0v18a1 1 0 0 1-2 0V11" />
  </svg>
);

export const PushPin: React.FC<{ className?: string }> = ({ className = 'w-6 h-6 text-red-500' }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    stroke="#1E293B" 
    strokeWidth="1.5"
  >
    <circle cx="12" cy="7" r="5" />
    <path d="M10 12h4l-1 7h-2z" fill="#94A3B8" />
    <path d="M12 19v4" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const DoodleCoin: React.FC<{ className?: string }> = ({ className = 'w-6 h-6 text-amber-500' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" fill="#FDE047" />
    <circle cx="12" cy="12" r="6" strokeDasharray="2 2" />
    <path d="M12 9v6M10 10.5h3.5a1.5 1.5 0 0 1 0 3H10" />
  </svg>
);

export const DoodleReceipt: React.FC<{ className?: string }> = ({ className = 'w-6 h-6 text-slate-800' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 3v18l3-2 3 2 3-2 3 2 3-2 3 2V3l-3 2-3-2-3 2-3-2-3 2-3-2z" fill="#FFFFFF" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="8" y1="16" x2="12" y2="16" />
  </svg>
);

export const DoodleCrown: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 text-amber-500' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#FBBF24" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18h18l-2-11-5 5-2-7-2 7-5-5-2 11z" />
    <circle cx="12" cy="5" r="1" fill="#DC2626" />
    <circle cx="5" cy="7" r="1" fill="#2563EB" />
    <circle cx="19" cy="7" r="1" fill="#16A34A" />
  </svg>
);
