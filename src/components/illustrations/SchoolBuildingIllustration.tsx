import React from 'react';

export const SchoolBuildingIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-auto max-w-[240px]' }) => {
  return (
    <svg
      viewBox="0 0 240 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Base Foundation */}
      <rect x="20" y="112" width="200" height="8" rx="2" fill="#E2E8F0" />
      <rect x="25" y="116" width="190" height="4" rx="1" fill="#CBD5E1" />

      {/* Main Left & Right Wings */}
      <rect x="35" y="48" width="65" height="66" rx="2" fill="#E2E8F0" />
      <rect x="140" y="48" width="65" height="66" rx="2" fill="#E2E8F0" />

      {/* Wing Roofs */}
      <polygon points="30,48 105,48 100,42 35,42" fill="#94A3B8" />
      <polygon points="135,48 210,48 205,42 140,42" fill="#94A3B8" />

      {/* Center Main Building */}
      <rect x="88" y="32" width="64" height="82" rx="2" fill="#CBD5E1" />

      {/* Center Triangle Pediment */}
      <polygon points="84,32 156,32 120,12" fill="#94A3B8" />

      {/* Clock in Pediment */}
      <circle cx="120" cy="24" r="5" fill="#FFFFFF" />
      <path d="M120 21V24H122" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" />

      {/* Center Main Entrance Arch */}
      <path
        d="M107 114V90C107 83 133 83 133 90V114H107Z"
        fill="#FFFFFF"
        opacity="0.9"
      />
      <line x1="120" y1="88" x2="120" y2="114" stroke="#CBD5E1" strokeWidth="1.5" />

      {/* Left Wing Windows */}
      <g fill="#FFFFFF" opacity="0.95">
        {/* Top Row */}
        <rect x="42" y="56" width="11" height="13" rx="1" />
        <rect x="58" y="56" width="11" height="13" rx="1" />
        <rect x="74" y="56" width="11" height="13" rx="1" />
        {/* Bottom Row */}
        <rect x="42" y="78" width="11" height="13" rx="1" />
        <rect x="58" y="78" width="11" height="13" rx="1" />
        <rect x="74" y="78" width="11" height="13" rx="1" />
      </g>

      {/* Right Wing Windows */}
      <g fill="#FFFFFF" opacity="0.95">
        {/* Top Row */}
        <rect x="155" y="56" width="11" height="13" rx="1" />
        <rect x="171" y="56" width="11" height="13" rx="1" />
        <rect x="187" y="56" width="11" height="13" rx="1" />
        {/* Bottom Row */}
        <rect x="155" y="78" width="11" height="13" rx="1" />
        <rect x="171" y="78" width="11" height="13" rx="1" />
        <rect x="187" y="78" width="11" height="13" rx="1" />
      </g>

      {/* Center Windows */}
      <g fill="#FFFFFF" opacity="0.95">
        <rect x="96" y="44" width="12" height="15" rx="1" />
        <rect x="132" y="44" width="12" height="15" rx="1" />
        <rect x="96" y="66" width="12" height="15" rx="1" />
        <rect x="132" y="66" width="12" height="15" rx="1" />
      </g>
    </svg>
  );
};
