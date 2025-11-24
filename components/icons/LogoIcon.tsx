
import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="48"
    height="48"
    {...props}
  >
    <g>
      {/* Main document shape */}
      <path
        d="M15 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7l-5-5z"
        fill="#4F46E5"
      />
      {/* Page fold */}
      <path
        d="M15 2v5h5l-5-5z"
        fill="#A5B4FC"
      />
      {/* Sparkle icon */}
      <path
        d="M12 8l-1.09 2.73L8 12l2.91 1.27L12 16l1.09-2.73L16 12l-2.91-1.27L12 8zM9 7v2m6 6v2M8 8h2m4 6h2"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);
