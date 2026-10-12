import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeCardViewProps {
  code: string;
  language?: string;
}

export const CodeCardView: React.FC<CodeCardViewProps> = ({ code, language = 'text' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Hàm highlight cú pháp đơn giản, siêu nhẹ & an toàn, không cần nạp bundle nặng
  const highlightCode = (rawCode: string) => {
    const lines = rawCode.split('\n');

    return lines.map((line, lineIdx) => {
      // Highlight comments
      if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
        return (
          <div key={lineIdx} className="table-row">
            <span className="table-cell select-none text-right pr-4 text-slate-500 font-mono text-xs">{lineIdx + 1}</span>
            <span className="table-cell text-emerald-400 italic font-mono text-sm">{line}</span>
          </div>
        );
      }

      // Tokenize đơn giản
      const tokens = line.split(/(\b(?:def|class|return|import|from|if|else|elif|for|while|const|let|var|function|type|interface|select|from|where|insert|delete)\b|["'`].*?["'`]|\b\d+\b)/g);

      return (
        <div key={lineIdx} className="table-row">
          <span className="table-cell select-none text-right pr-4 text-slate-500 font-mono text-xs">{lineIdx + 1}</span>
          <span className="table-cell font-mono text-sm whitespace-pre">
            {tokens.map((token, tokIdx) => {
              if (/^(def|class|return|import|from|if|else|elif|for|while|const|let|var|function|type|interface|select|where|insert|delete)$/i.test(token)) {
                return <span key={tokIdx} className="text-purple-400 font-semibold">{token}</span>;
              }
              if (/^["'`].*?["'`]$/.test(token)) {
                return <span key={tokIdx} className="text-amber-300">{token}</span>;
              }
              if (/^\d+$/.test(token)) {
                return <span key={tokIdx} className="text-cyan-300">{token}</span>;
              }
              return <span key={tokIdx} className="text-slate-200">{token}</span>;
            })}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="my-3 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-inner text-left">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/60 border-b border-slate-800 text-xs">
        <span className="font-mono text-slate-400 uppercase tracking-wider text-[11px] font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-100 transition-colors px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-xs active:scale-95"
          title="Sao chép mã"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Đã chép</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Chép mã</span>
            </>
          )}
        </button>
      </div>

      <div className="p-3 overflow-x-auto max-h-72">
        <div className="table w-full">
          {highlightCode(code)}
        </div>
      </div>
    </div>
  );
};
