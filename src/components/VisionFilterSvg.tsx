import React from 'react';

export const VisionFilterSvg: React.FC = () => {
  return (
    <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
      <defs>
        {/* Protanopia (sem vermelho) */}
        <filter id="protanopia-filter">
          <feColorMatrix
            type="matrix"
            values="0.56667 0.43333 0 0 0
                    0.55833 0.44167 0 0 0
                    0 0.24167 0.75833 0 0
                    0 0 0 1 0"
          />
        </filter>

        {/* Deuteranopia (sem verde) */}
        <filter id="deuteranopia-filter">
          <feColorMatrix
            type="matrix"
            values="0.625 0.375 0 0 0
                    0.7 0.3 0 0 0
                    0 0.3 0.7 0 0
                    0 0 0 1 0"
          />
        </filter>

        {/* Tritanopia (sem azul) */}
        <filter id="tritanopia-filter">
          <feColorMatrix
            type="matrix"
            values="0.95 0.05 0 0 0
                    0 0.43333 0.56667 0 0
                    0 0.475 0.525 0 0
                    0 0 0 1 0"
          />
        </filter>

        {/* Acromatopsia (monocromático) */}
        <filter id="achromatopsia-filter">
          <feColorMatrix
            type="matrix"
            values="0.299 0.587 0.114 0 0
                    0.299 0.587 0.114 0 0
                    0.299 0.587 0.114 0 0
                    0 0 0 1 0"
          />
        </filter>
      </defs>
    </svg>
  );
};
