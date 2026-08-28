import React from 'react';
import { SchoolBuildingIllustration } from './SchoolBuildingIllustration';

export const TeacherIllustration: React.FC<{ className?: string }> = ({ className = 'w-full max-w-[220px] mx-auto' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Background School Building */}
      <div className="opacity-70 scale-95 transition-transform duration-500 hover:scale-100">
        <SchoolBuildingIllustration className="w-56 h-auto" />
      </div>

      {/* Foreground Teacher Character */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10 animate-float">
        <svg
          viewBox="0 0 110 135"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-24 h-auto drop-shadow-md"
        >
          {/* Shoes / Heels */}
          <polygon points="41,126 49,126 47,121 43,121" fill="#1E293B" />
          <polygon points="59,126 67,126 65,121 61,121" fill="#1E293B" />
          <rect x="41" y="125" width="8" height="3" rx="1" fill="#1E293B" />
          <rect x="59" y="125" width="8" height="3" rx="1" fill="#1E293B" />

          {/* Legs (Skin tone) */}
          <rect x="43" y="96" width="7" height="26" fill="#FCD34D" />
          <rect x="60" y="96" width="7" height="26" fill="#FCD34D" />

          {/* Pencil Skirt (Green) */}
          <polygon points="39,72 71,72 68,97 42,97" fill="#10B981" />

          {/* Teacher Jacket/Top (Green) */}
          <rect x="36" y="44" width="38" height="32" rx="6" fill="#10B981" />

          {/* White Shirt Collar */}
          <polygon points="48,44 62,44 55,54" fill="#FFFFFF" />

          {/* Document Binder / Folder held in Right Arm (Viewer's Left) */}
          <g>
            {/* White Papers */}
            <rect x="23" y="48" width="16" height="24" rx="2" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" transform="rotate(-6 23 48)" />
            <rect x="25" y="50" width="16" height="24" rx="2" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" transform="rotate(-2 25 50)" />
            {/* Green Binder cover */}
            <rect x="24" y="52" width="17" height="24" rx="2" fill="#059669" />
          </g>

          {/* Right Arm (bent holding binder) */}
          <path
            d="M39 48L28 62C27 66 31 70 36 69L45 66"
            stroke="#10B981"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right Hand */}
          <circle cx="37" cy="65" r="4" fill="#FCD34D" />

          {/* Left Arm (holding briefcase downwards) */}
          <path
            d="M72 48L77 64L80 84"
            stroke="#10B981"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Left Hand */}
          <circle cx="80" cy="85" r="4" fill="#FCD34D" />

          {/* Purple Teacher Briefcase */}
          <g className="transition-transform duration-300">
            {/* Briefcase Handle */}
            <path d="M76 83C76 79 84 79 84 83" stroke="#7C3AED" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Briefcase Body */}
            <rect x="70" y="83" width="22" height="18" rx="3" fill="#8B5CF6" />
            <rect x="70" y="83" width="22" height="7" rx="2" fill="#7C3AED" />
            {/* Buckle */}
            <rect x="79" y="88" width="4" height="4" rx="1" fill="#FBBF24" />
          </g>

          {/* Neck */}
          <rect x="51" y="36" width="8" height="9" fill="#FCD34D" />

          {/* Head & Face */}
          <ellipse cx="55" cy="25" rx="13" ry="14" fill="#FCD34D" />

          {/* Hair (Dark bob style) */}
          <path
            d="M42 22C42 12 48 7 56 7C64 7 69 12 69 22V32C69 34 67 36 65 36C63 36 63 32 63 32L61 22C61 22 58 17 54 18C50 19 46 17 43 21V32C43 34 41 36 39 36C37 36 37 32 37 32L42 22Z"
            fill="#1E293B"
          />

          {/* Eyes (Smiling with eyelashes) */}
          <path d="M48 23C49 21.5 51 21.5 52 23" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M59 23C60 21.5 62 21.5 63 23" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" />

          {/* Rosy Cheeks */}
          <ellipse cx="46" cy="27" rx="2" ry="1.2" fill="#FCA5A5" opacity="0.8" />
          <ellipse cx="64" cy="27" rx="2" ry="1.2" fill="#FCA5A5" opacity="0.8" />

          {/* Warm Friendly Smile */}
          <path d="M51 28C53 31.5 57 31.5 59 28" stroke="#E11D48" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </div>
  );
};
