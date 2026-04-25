import { type FC } from 'react';
import { Lock } from 'lucide-react';

interface ComingSoonSectionProps {
  title: string;
  desc: string;
}

const ComingSoonSection: FC<ComingSoonSectionProps> = ({ title, desc }) => {
  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-text-base">{title}</h2>
        <p className="text-[14px] text-text-muted font-bold">{desc}</p>
      </div>

      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mb-6 shadow-sm border border-border-base/50">
          <Lock className="w-10 h-10 text-text-muted/30" />
        </div>
        <h3 className="text-xl font-black text-text-base mb-2 italic">Coming Soon</h3>
        <p className="text-[13px] text-text-muted font-bold max-w-[280px]">We are working hard to bring this feature to your settings experience.</p>
      </div>
    </div>
  );
};

export default ComingSoonSection;
