import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  variant?: 'light' | 'dark';
}

const sizeMap = {
  sm: { box: 'w-8 h-8 text-sm', title: 'text-sm', sub: 'text-[10px]' },
  md: { box: 'w-10 h-10 text-base', title: 'text-base', sub: 'text-[11px]' },
  lg: { box: 'w-12 h-12 text-xl', title: 'text-lg', sub: 'text-xs' },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  variant = 'light',
}) => {
  const s = sizeMap[size];
  const titleColor = variant === 'dark' ? 'text-white' : 'text-slate-900';
  const subColor = variant === 'dark' ? 'text-slate-300' : 'text-slate-500';

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${s.box} rounded-xl bg-gradient-to-br from-brand-600 via-brand-500 to-ai-500 text-white font-black flex items-center justify-center shadow-md shrink-0`}
      >
        DF
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`${s.title} font-extrabold ${titleColor} tracking-tight leading-none`}>
          DayFlow <span className="text-brand-600">AI</span>
        </span>
        {showSubtitle && (
          <span className={`${s.sub} ${subColor} font-medium mt-0.5`}>Intelligent HRMS</span>
        )}
      </div>
    </div>
  );
};
