import React from 'react';
import { SchoolBuildingIllustration } from './SchoolBuildingIllustration';

export const StudentIllustration: React.FC<{ className?: string }> = ({ className = 'w-full max-w-[220px] mx-auto' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Background School Building */}
      <div className="opacity-70 scale-95 transition-transform duration-500 hover:scale-100">
        <SchoolBuildingIllustration className="w-56 h-auto" />
      </div>

      {/* Foreground Student Character */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10 animate-float">
        <svg
          viewBox="0 0 100 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-24 h-auto drop-shadow-md"
        >
          {/* Backpack body behind */}
          <rect x="24" y="44" width="52" height="42" rx="10" fill="#22C55E" />
          <rect x="28" y="38" width="44" height="12" rx="6" fill="#16A34A" />

          {/* Shoes */}
          <rect x="34" y="118" width="14" height="7" rx="3.5" fill="#334155" />
          <rect x="52" y="118" width="14" height="7" rx="3.5" fill="#334155" />

          {/* Legs (Purple Trousers) */}
          <rect x="35" y="86" width="12" height="34" rx="3" fill="#8B5CF6" />
          <rect x="53" y="86" width="12" height="34" rx="3" fill="#8B5CF6" />

          {/* Torso (Purple Sweater) */}
          <rect x="30" y="42" width="40" height="46" rx="8" fill="#8B5CF6" />

          {/* White Shirt Collar & Yellow Tie */}
          <polygon points="42,42 58,42 50,54" fill="#FFFFFF" />
          <polygon points="48,47 52,47 54,64 50,68 46,64" fill="#F59E0B" />

          {/* Backpack Straps */}
          <path d="M33 44C33 55 35 70 38 75" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" />
          <path d="M67 44C67 55 65 70 62 75" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" />

          {/* Arms (holding straps) */}
          {/* Left Arm */}
          <path
            d="M31 46L21 62C19 66 22 72 27 70L36 65"
            stroke="#8B5CF6"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right Arm */}
          <path
            d="M69 46L79 62C81 66 78 72 73 70L64 65"
            stroke="#8B5CF6"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hands */}
          <circle cx="34" cy="65" r="4.5" fill="#FCD34D" />
          <circle cx="66" cy="65" r="4.5" fill="#FCD34D" />

          {/* Neck */}
          <rect x="46" y="34" width="8" height="9" fill="#FCD34D" />

          {/* Head & Face */}
          <ellipse cx="50" cy="24" rx="14" ry="15" fill="#FCD34D" />

          {/* Hair (Black/Dark Brown styled) */}
          <path
            d="M36 21C36 12 42 7 50 7C58 7 64 12 64 21C64 21 61 17 56 18C51 19 46 16 41 19C38 21 36 21 36 21Z"
            fill="#1E293B"
          />
          {/* Hair sideburns */}
          <path d="M36 21V26L39 23V21H36Z" fill="#1E293B" />
          <path d="M64 21V26L61 23V21H64Z" fill="#1E293B" />

          {/* Eyes (Smiling Happy Eyes) */}
          <path d="M42 22C43 20.5 45 20.5 46 22" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M54 22C55 20.5 57 20.5 58 22" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />

          {/* Rosy Cheeks */}
          <ellipse cx="40" cy="27" rx="2" ry="1.2" fill="#FCA5A5" opacity="0.7" />
          <ellipse cx="60" cy="27" rx="2" ry="1.2" fill="#FCA5A5" opacity="0.7" />

          {/* Smile */}
          <path d="M46 28C48 31 52 31 54 28" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </div>
  );
};
