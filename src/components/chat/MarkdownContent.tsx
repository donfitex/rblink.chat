import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { User } from '../../types';

interface MarkdownContentProps {
  content: string;
  users: User[];
  onMentionClick?: (user: User) => void;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  users,
  onMentionClick,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Render markdown lines
  const renderLines = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';
    let codeBlockIndex = 0;
    let inList = false;
    let listType: 'ul' | 'ol' = 'ul';
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
      if (inList && listItems.length > 0) {
        if (listType === 'ul') {
          elements.push(
            <ul key={`list-${elements.length}`} className="list-disc pl-5 my-1.5 space-y-0.5 text-[#D1D2D3]">
              {listItems}
            </ul>
          );
        } else {
          elements.push(
            <ol key={`list-${elements.length}`} className="list-decimal pl-5 my-1.5 space-y-0.5 text-[#D1D2D3]">
              {listItems}
            </ol>
          );
        }
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      // Code block start or end
      if (line.trim().startsWith('```')) {
        flushList();
        if (inCodeBlock) {
          // End of code block
          const fullCode = codeBlockContent.join('\n');
          const currentIndex = codeBlockIndex++;
          elements.push(
            <div key={`code-${currentIndex}`} className="my-2 rounded-md bg-[#121417] border border-[#2D3136] overflow-hidden text-sm">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#1B1D21] border-b border-[#2D3136] text-xs text-[#ABABAD]">
                <span className="font-mono uppercase">{codeBlockLang || 'code'}</span>
                <button
                  onClick={() => copyToClipboard(fullCode, currentIndex)}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-[#2D3136] text-[#D1D2D3] transition-colors"
                  title="Copy code"
                >
                  {copiedIndex === currentIndex ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto font-mono text-xs text-[#E6EDF3] leading-relaxed">
                <code>{fullCode}</code>
              </pre>
            </div>
          );
          codeBlockContent = [];
          codeBlockLang = '';
          inCodeBlock = false;
        } else {
          // Start of code block
          inCodeBlock = true;
          codeBlockLang = line.trim().slice(3).trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        flushList();
        elements.push(
          <blockquote key={`quote-${index}`} className="border-l-4 border-[#1264A3] pl-3 py-0.5 my-1 text-[#ABABAD] italic bg-[#1E2228]/40 rounded-r">
            {renderInline(line.slice(2))}
          </blockquote>
        );
        return;
      }

      // Headings
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={`h1-${index}`} className="text-xl font-bold text-white mt-2 mb-1">
            {renderInline(line.slice(2))}
          </h1>
        );
        return;
      }
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={`h2-${index}`} className="text-lg font-bold text-white mt-1.5 mb-1">
            {renderInline(line.slice(3))}
          </h2>
        );
        return;
      }
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${index}`} className="text-base font-semibold text-white mt-1 mb-0.5">
            {renderInline(line.slice(4))}
          </h3>
        );
        return;
      }

      // Bullet lists
      if (line.match(/^[\*\-]\s/)) {
        if (!inList || listType !== 'ul') {
          flushList();
          inList = true;
          listType = 'ul';
        }
        listItems.push(
          <li key={`li-${index}`} className="leading-snug">
            {renderInline(line.replace(/^[\*\-]\s/, ''))}
          </li>
        );
        return;
      }

      // Numbered lists
      if (line.match(/^\d+\.\s/)) {
        if (!inList || listType !== 'ol') {
          flushList();
          inList = true;
          listType = 'ol';
        }
        listItems.push(
          <li key={`li-${index}`} className="leading-snug">
            {renderInline(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
        return;
      }

      // Normal paragraph line
      flushList();
      if (line.trim() === '') {
        elements.push(<div key={`empty-${index}`} className="h-2" />);
      } else {
        elements.push(
          <p key={`p-${index}`} className="leading-relaxed">
            {renderInline(line)}
          </p>
        );
      }
    });

    flushList();

    // If an unclosed codeblock remained
    if (inCodeBlock && codeBlockContent.length > 0) {
      const fullCode = codeBlockContent.join('\n');
      elements.push(
        <div key="unclosed-code" className="my-2 rounded-md bg-[#121417] border border-[#2D3136] p-3 font-mono text-xs overflow-x-auto text-[#E6EDF3]">
          <code>{fullCode}</code>
        </div>
      );
    }

    return elements;
  };

  // Parse inline tokens: code, bold, italic, strike, mentions, links
  const renderInline = (text: string): React.ReactNode => {
    // Regex token patterns
    // 1. Inline code: `code`
    // 2. Bold: **text**
    // 3. Italic: *text*
    // 4. Strikethrough: ~~text~~ or ~text~
    // 5. Mentions: @username, @channel, @everyone
    // 6. Markdown Links: [text](url)
    // 7. Bare URLs: https?://...

    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|~[^~]+~|@(?:channel|everyone|[a-zA-Z0-9_\.]+)|\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)|https?:\/\/[^\s<]+)/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const token = match[0];

      if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={`code-${match.index}`} className="bg-[#2D3136] text-[#E01E5A] px-1.5 py-0.5 rounded text-xs font-mono">
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={`b-${match.index}`} className="font-semibold text-white">{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(<em key={`i-${match.index}`}>{token.slice(1, -1)}</em>);
      } else if ((token.startsWith('~~') && token.endsWith('~~')) || (token.startsWith('~') && token.endsWith('~'))) {
        const content = token.startsWith('~~') ? token.slice(2, -2) : token.slice(1, -1);
        parts.push(<del key={`del-${match.index}`} className="opacity-75">{content}</del>);
      } else if (token.startsWith('@')) {
        const handle = token.slice(1);
        if (handle === 'channel' || handle === 'everyone') {
          parts.push(
            <span key={`mention-${match.index}`} className="mention-chip mention-special text-xs px-1.5 py-0.5 font-medium rounded">
              @{handle}
            </span>
          );
        } else {
          const mentionedUser = users.find(
            (u) => u.username.toLowerCase() === handle.toLowerCase()
          );
          parts.push(
            <span
              key={`mention-${match.index}`}
              onClick={() => mentionedUser && onMentionClick?.(mentionedUser)}
              className="mention-chip text-xs px-1.5 py-0.5 font-medium rounded hover:underline"
              title={mentionedUser ? `View ${mentionedUser.name}'s profile` : `@${handle}`}
            >
              @{mentionedUser ? mentionedUser.name : handle}
            </span>
          );
        }
      } else if (match[2] && match[3]) {
        // [text](url)
        parts.push(
          <a
            key={`link-${match.index}`}
            href={match[3]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1D9BD1] hover:text-[#68CDFF] underline"
          >
            {match[2]}
          </a>
        );
      } else if (token.startsWith('http://') || token.startsWith('https://')) {
        parts.push(
          <a
            key={`url-${match.index}`}
            href={token}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1D9BD1] hover:text-[#68CDFF] underline break-all"
          >
            {token}
          </a>
        );
      } else {
        parts.push(token);
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return <div className="markdown-body text-[#D1D2D3] break-words text-[14.5px] leading-relaxed">{renderLines()}</div>;
};
