import React from 'react';

export const LegalFooter: React.FC = () => {
  return (
    <footer className="px-6 py-6 bg-cr border-t border-ink/5 mt-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Footer Info */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="font-display italic text-base text-ink opacity-60">NINOC</div>
            <div className="flex gap-4 text-[8px] font-bold uppercase tracking-widest text-ink/30">
              <a href="#" className="hover:text-ink">Privacy</a>
              <a href="#" className="hover:text-ink">Terms</a>
            </div>
          </div>
          <div className="text-[8px] text-ink/20 uppercase tracking-[0.2em] flex justify-between">
            <span>&copy; 2025 NINOC</span>
            <span>PSE: 000842/DJAI.PSE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
