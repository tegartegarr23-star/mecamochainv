import React, { useState } from 'react';
import logoImg from '../assets/images/mecamocha_logo_1785676919844.jpg';

interface MecamochaBrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'login';
  showText?: boolean;
}

export const MecamochaBrandLogo: React.FC<MecamochaBrandLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
    login: 'w-24 h-24 sm:w-28 sm:h-28 rounded-2xl',
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={`relative overflow-hidden shrink-0 shadow-lg border border-orange-500/40 bg-[#ea580c] flex items-center justify-center ${sizeClasses[size]}`}
      >
        {!imgFailed ? (
          <img
            src={logoImg}
            alt="Mecamocha Coffee Logo"
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          /* SVG Vector Fallback matching the Mecamocha emblem */
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full p-2"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top M-shaped curves */}
            <path
              d="M30 48 L48 24 C50 21 54 21 56 24 L70 48"
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M48 48 L58 32 C60 29 64 29 66 32 L78 48"
              stroke="white"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Bottom concentric ripple rings */}
            <path
              d="M26 56 C26 72 74 72 74 56"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M34 62 C34 74 66 74 66 62"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M42 68 C42 75 58 75 58 68"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-white font-black tracking-wider text-lg leading-tight">
            MECAMOCHA
          </span>
          <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">
            Coffee & Inventory
          </span>
        </div>
      )}
    </div>
  );
};
