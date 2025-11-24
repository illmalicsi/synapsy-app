
import React from 'react';
import { ArrowLeft, Copy, FileText, Check } from 'lucide-react';

interface SummaryViewProps {
  summary: string;
  onBack: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ summary, onBack }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple parser to make the summary look better
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      
      // Header detection (Basic heuristics: CAPS and short, or ends with colon)
      const isHeader = (trimmed.length > 2 && trimmed.length < 50 && trimmed === trimmed.toUpperCase()) || trimmed.endsWith(':');
      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');

      if (isHeader && !isBullet) {
        return <h3 key={i} className="text-slate-800 dark:text-slate-100 font-black text-sm uppercase tracking-wide mt-6 mb-2">{trimmed}</h3>;
      }
      
      if (isBullet) {
        return (
          <div key={i} className="flex items-start gap-2 mb-2 pl-2">
            <span className="text-indigo-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{trimmed.replace(/^[•\-*]\s*/, '')}</p>
          </div>
        );
      }

      if (trimmed === '') {
        return <br key={i} />;
      }

      return <p key={i} className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-2">{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 relative animate-in fade-in transition-colors">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 shadow-sm z-20 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between sticky top-0">
         <div className="flex items-center gap-2">
             <button 
               onClick={onBack}
               className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
             >
                 <ArrowLeft size={20} />
             </button>
             <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <FileText size={16} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-none">Summary</h2>
             </div>
         </div>
         
         <button 
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
         >
             {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
             <span>{copied ? 'Copied' : 'Copy'}</span>
         </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 pb-20">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm">
            {renderFormattedText(summary)}
        </div>
      </div>
    </div>
  );
};
