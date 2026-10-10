import React from 'react';
import {
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  ListOrdered,
  FileText,
  Sparkles
} from 'lucide-react';

interface FormattedAIExplanationProps {
  content: string;
}

export const FormattedAIExplanation: React.FC<FormattedAIExplanationProps> = ({ content }) => {
  if (!content) return null;

  // Split into lines for structured analysis
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentListItems: string[] = [];
  let currentNumberedItems: string[] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1.5 my-2 pl-1">
          {currentListItems.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0" />
              <span>{renderInlineFormatting(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  const flushNumbered = () => {
    if (currentNumberedItems.length > 0) {
      elements.push(
        <ol key={`ol-${elements.length}`} className="space-y-2 my-2.5 pl-1">
          {currentNumberedItems.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-2.5 text-xs sm:text-sm text-slate-800 leading-relaxed p-2 rounded-xl bg-teal-50/60 border border-teal-100">
              <span className="w-5 h-5 rounded-full bg-teal-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="flex-1">{renderInlineFormatting(item)}</span>
            </li>
          ))}
        </ol>
      );
      currentNumberedItems = [];
    }
  };

  // Helper to parse **bold** and *italic*
  const renderInlineFormatting = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-slate-800">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushList();
      flushNumbered();
      continue;
    }

    // Headings: ###, ##, #
    if (line.startsWith('### ')) {
      flushList();
      flushNumbered();
      elements.push(
        <h4 key={`h4-${i}`} className="text-xs sm:text-sm font-bold text-teal-900 mt-3 mb-1.5 uppercase tracking-wide">
          {renderInlineFormatting(line.replace(/^###\s+/, ''))}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      flushNumbered();
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm sm:text-base font-extrabold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-100">
          {renderInlineFormatting(line.replace(/^##\s+/, ''))}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      flushList();
      flushNumbered();
      elements.push(
        <h2 key={`h2-${i}`} className="text-base sm:text-lg font-black text-slate-900 mt-4 mb-2">
          {renderInlineFormatting(line.replace(/^#\s+/, ''))}
        </h2>
      );
    }
    // Numbered list items e.g. "1. ..."
    else if (/^\d+\.\s+/.test(line)) {
      flushList();
      currentNumberedItems.push(line.replace(/^\d+\.\s+/, ''));
    }
    // Bullet items e.g. "* " or "- "
    else if (line.startsWith('* ') || line.startsWith('- ')) {
      flushNumbered();
      currentListItems.push(line.replace(/^(\*|-)\s+/, ''));
    }
    // Questions for doctor callout block detection
    else if (line.toLowerCase().includes('questions to ask your doctor') || line.toLowerCase().includes('questions you can ask')) {
      flushList();
      flushNumbered();
      elements.push(
        <div key={`callout-header-${i}`} className="mt-4 mb-2 flex items-center space-x-2 text-teal-800 font-bold text-xs sm:text-sm">
          <HelpCircle className="w-4 h-4 text-teal-600" />
          <span>{renderInlineFormatting(line)}</span>
        </div>
      );
    }
    // Standard paragraph
    else {
      flushList();
      flushNumbered();
      elements.push(
        <p key={`p-${i}`} className="text-xs sm:text-sm text-slate-700 leading-relaxed my-2">
          {renderInlineFormatting(line)}
        </p>
      );
    }
  }

  flushList();
  flushNumbered();

  return (
    <div className="space-y-1 text-slate-800 break-words">
      {elements}
    </div>
  );
};
