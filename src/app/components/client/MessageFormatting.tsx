'use client';
import React, { Ref } from 'react'
import { useState, useRef, useEffect } from 'react';
import { Copy, Check, MoreHorizontal, RefreshCw, GitBranch, Download, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message} from "../../types/types"


// Syntax highlighting utility - returns React elements instead of HTML strings
const syntaxHighlight = (code: string, language: string) => {
  const lang = language?.toLowerCase();
  
  // Define color classes for different token types
  const colors = {
    keyword: 'text-purple-400',
    string: 'text-green-400',
    comment: 'text-gray-500',
    number: 'text-orange-400',
    operator: 'text-cyan-400',
    function: 'text-blue-400',
    type: 'text-yellow-400',
    property: 'text-pink-400',
    tag: 'text-red-400',
    attribute: 'text-yellow-300',
    constant: 'text-orange-300'
  };

  // Language-specific patterns
  const patterns = {
    javascript: [
      { pattern: /\/\/.*$/gm, class: colors.comment },
      { pattern: /\/\*[\s\S]*?\*\//g, class: colors.comment },
      { pattern: /"([^"\\]|\\.)*"/g, class: colors.string },
      { pattern: /'([^'\\]|\\.)*'/g, class: colors.string },
      { pattern: /`([^`\\]|\\.)*`/g, class: colors.string },
      { pattern: /\b(const|let|var|function|class|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|this|super|extends|import|export|from|default|async|await|yield|typeof|instanceof)\b/g, class: colors.keyword },
      { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, class: colors.constant },
      { pattern: /\b\d+\.?\d*\b/g, class: colors.number },
      { pattern: /[+\-*/%=<>!&|^~?:]/g, class: colors.operator },
      { pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*(?=\()/g, class: colors.function }
    ],
    typescript: [
      { pattern: /\/\/.*$/gm, class: colors.comment },
      { pattern: /\/\*[\s\S]*?\*\//g, class: colors.comment },
      { pattern: /"([^"\\]|\\.)*"/g, class: colors.string },
      { pattern: /'([^'\\]|\\.)*'/g, class: colors.string },
      { pattern: /`([^`\\]|\\.)*`/g, class: colors.string },
      { pattern: /\b(const|let|var|function|class|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|this|super|extends|import|export|from|default|async|await|yield|typeof|instanceof|interface|type|enum|namespace|declare|readonly|public|private|protected|static|abstract)\b/g, class: colors.keyword },
      { pattern: /\b(string|number|boolean|object|any|void|never|unknown)\b/g, class: colors.type },
      { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, class: colors.constant },
      { pattern: /\b\d+\.?\d*\b/g, class: colors.number },
      { pattern: /[+\-*/%=<>!&|^~?:]/g, class: colors.operator },
      { pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*(?=\()/g, class: colors.function }
    ],
    python: [
      { pattern: /#.*$/gm, class: colors.comment },
      { pattern: /"""[\s\S]*?"""/g, class: colors.comment },
      { pattern: /'''[\s\S]*?'''/g, class: colors.comment },
      { pattern: /"([^"\\]|\\.)*"/g, class: colors.string },
      { pattern: /'([^'\\]|\\.)*'/g, class: colors.string },
      { pattern: /f"([^"\\]|\\.)*"/g, class: colors.string },
      { pattern: /f'([^'\\]|\\.)*'/g, class: colors.string },
      { pattern: /\b(def|class|if|elif|else|for|while|try|except|finally|with|as|import|from|return|yield|break|continue|pass|raise|assert|del|global|nonlocal|lambda|and|or|not|in|is)\b/g, class: colors.keyword },
      { pattern: /\b(True|False|None)\b/g, class: colors.constant },
      { pattern: /\b\d+\.?\d*\b/g, class: colors.number },
      { pattern: /[+\-*/%=<>!&|^~?:]/g, class: colors.operator },
      { pattern: /\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, class: colors.function, group: 1 },
      { pattern: /\bclass\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, class: colors.type, group: 1 }
    ],
    java: [
      { pattern: /\/\/.*$/gm, class: colors.comment },
      { pattern: /\/\*[\s\S]*?\*\//g, class: colors.comment },
      { pattern: /"([^"\\]|\\.)*"/g, class: colors.string },
      { pattern: /'([^'\\]|\\.)*'/g, class: colors.string },
      { pattern: /\b(public|private|protected|static|final|abstract|class|interface|enum|extends|implements|import|package|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|throws|new|this|super|instanceof|synchronized|volatile|transient|native|strictfp)\b/g, class: colors.keyword },
      { pattern: /\b(int|long|short|byte|float|double|boolean|char|void|String|Object|Integer|Long|Short|Byte|Float|Double|Boolean|Character)\b/g, class: colors.type },
      { pattern: /\b(true|false|null)\b/g, class: colors.constant },
      { pattern: /\b\d+\.?\d*[fFdDlL]?\b/g, class: colors.number },
      { pattern: /[+\-*/%=<>!&|^~?:]/g, class: colors.operator },
      { pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*(?=\()/g, class: colors.function }
    ],
    html: [
      { pattern: /<!--[\s\S]*?-->/g, class: colors.comment },
      { pattern: /<\/?[a-zA-Z][a-zA-Z0-9]*\b[^>]*>/g, class: colors.tag },
      { pattern: /\b[a-zA-Z-]+(?=\s*=)/g, class: colors.attribute },
      { pattern: /"([^"\\]|\\.)*"/g, class: colors.string },
      { pattern: /'([^'\\]|\\.)*'/g, class: colors.string }
    ],
    css: [
      { pattern: /\/\*[\s\S]*?\*\//g, class: colors.comment },
      { pattern: /"([^"\\]|\\.)*"/g, class: colors.string },
      { pattern: /'([^'\\]|\\.)*'/g, class: colors.string },
      { pattern: /[.#]?[a-zA-Z][a-zA-Z0-9_-]*(?=\s*{)/g, class: colors.tag },
      { pattern: /[a-zA-Z-]+(?=\s*:)/g, class: colors.property },
      { pattern: /#[0-9a-fA-F]{3,6}\b/g, class: colors.string },
      { pattern: /\b\d+\.?\d*(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax|fr)?\b/g, class: colors.number }
    ],
    json: [
      { pattern: /"([^"\\]|\\.)*"\s*:/g, class: colors.property },
      { pattern: /"([^"\\]|\\.)*"/g, class: colors.string },
      { pattern: /\b(true|false|null)\b/g, class: colors.constant },
      { pattern: /\b\d+\.?\d*\b/g, class: colors.number }
    ],
    sql: [
      { pattern: /--.*$/gm, class: colors.comment },
      { pattern: /\/\*[\s\S]*?\*\//g, class: colors.comment },
      { pattern: /'([^'\\]|\\.)*'/g, class: colors.string },
      { pattern: /"([^"\\]|\\.)*"/g, class: colors.string },
      { pattern: /\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|ON|GROUP|BY|ORDER|HAVING|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|DATABASE|SCHEMA|GRANT|REVOKE|COMMIT|ROLLBACK|TRANSACTION|BEGIN|END|IF|ELSE|CASE|WHEN|THEN|UNION|ALL|DISTINCT|AS|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|CHECK|DEFAULT|AUTO_INCREMENT|SERIAL)\b/gi, class: colors.keyword },
      { pattern: /\b(INT|INTEGER|VARCHAR|CHAR|TEXT|DATE|DATETIME|TIMESTAMP|BOOLEAN|DECIMAL|FLOAT|DOUBLE|BIGINT|SMALLINT|TINYINT|BLOB|LONGTEXT|MEDIUMTEXT|TINYTEXT)\b/gi, class: colors.type },
      { pattern: /\b\d+\.?\d*\b/g, class: colors.number },
      { pattern: /[+\-*/%=<>!]/g, class: colors.operator }
    ]
  };

  const languagePatterns = patterns[lang as keyof typeof patterns] || patterns.javascript;

  // Create a list of tokens with their positions and types
  const tokens: Array<{start: number, end: number, type: string, className: string}> = [];
  
  languagePatterns.forEach((rule) => {
    let match;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    
    while ((match = regex.exec(code)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      
      // Check if this token overlaps with existing tokens
      const overlaps = tokens.some(token => 
        (start >= token.start && start < token.end) || 
        (end > token.start && end <= token.end) ||
        (start <= token.start && end >= token.end)
      );
      
      if (!overlaps) {
        tokens.push({
          start,
          end,
          type: rule.pattern.source,
          className: rule.class
        });
      }
    }
  });

  // Sort tokens by start position
  tokens.sort((a, b) => a.start - b.start);

  // Build React elements
  const elements = [];
  let lastEnd = 0;

  tokens.forEach((token, index) => {
    // Add unstyled text before this token
    if (token.start > lastEnd) {
      elements.push(code.substring(lastEnd, token.start));
    }

    // Add the styled token
    const tokenText = code.substring(token.start, token.end);
    elements.push(
      <span key={`token-${index}`} className={token.className}>
        {tokenText}
      </span>
    );

    lastEnd = token.end;
  });

  // Add any remaining unstyled text
  if (lastEnd < code.length) {
    elements.push(code.substring(lastEnd));
  }

  return elements;
};

// Code Block Component with Syntax Highlighting
export function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const highlightedElements = language ? syntaxHighlight(code, language) : [code];

  return (
    <div className="group my-4 w-full">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-600">
        <span className="text-sm text-gray-400 font-mono">
          {language || 'code'}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-900 p-4 rounded-b-lg w-full min-w-0">
        <code className="text-sm font-mono text-gray-100 whitespace-pre-wrap break-words block">
          {highlightedElements}
        </code>
      </pre>
    </div>
  );
}

export function MessageContent({ content }: { content: string }) {
  const parseContent = (text: string) => {
    
    // Split by code blocks first
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const codeBlockParts = [];
    let lastIndex = 0;
    let match;

    // Extract code blocks
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        codeBlockParts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
          key: `text-${lastIndex}`
        });
      }

      // Add code block
      codeBlockParts.push({
        type: 'codeblock',
        content: match[2].trim(),
        language: match[1] || undefined,
        key: `code-${match.index}`
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      codeBlockParts.push({
        type: 'text',
        content: text.substring(lastIndex),
        key: `text-${lastIndex}`
      });
    }

    return codeBlockParts.length > 0 ? codeBlockParts : [{ type: 'text', content: text, key: 'text-0' }];
  };

  const renderFormattedText = (text: string) => {
    // Split text into lines to handle headings and other formatting
    const lines = text.split('\n');
    const formattedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for headings (markdown style)
      if (line.match(/^#{1,6}\s+/)) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const headingText = line.replace(/^#+\s+/, '');
        
        const headingClasses = {
          1: 'text-2xl font-bold text-white mt-6 mb-4 border-b border-gray-600 pb-2',
          2: 'text-xl font-bold text-white mt-5 mb-3',
          3: 'text-lg font-semibold text-white mt-4 mb-2',
          4: 'text-base font-semibold text-gray-200 mt-3 mb-2',
          5: 'text-sm font-semibold text-gray-300 mt-2 mb-1',
          6: 'text-xs font-semibold text-gray-400 mt-2 mb-1'
        };

        formattedLines.push(
          <div key={`heading-${i}`} className={headingClasses[level as keyof typeof headingClasses] || headingClasses[3]}>
            {renderInlineFormatting(headingText)}
          </div>
        );
      }
      // Check for bold text patterns (markdown **text** or __text__)
      else if (line.match(/\*\*.*?\*\*|__.*?__/)) {
        formattedLines.push(
          <div key={`line-${i}`} className="mb-1">
            {renderInlineFormatting(line)}
          </div>
        );
      }
      // Check for bullet points
      else if (line.match(/^[\s]*[-\*\+]\s+/)) {
        const indent = (line.match(/^[\s]*/)?.[0].length || 0) / 2;
        const bulletText = line.replace(/^[\s]*[-\*\+]\s+/, '');
        formattedLines.push(
          <div key={`bullet-${i}`} className={`flex items-start gap-2 mb-1 ml-${indent * 4}`}>
            <span className="text-gray-400 mt-1">•</span>
            <span>{renderInlineFormatting(bulletText)}</span>
          </div>
        );
      }
      // Check for numbered lists
      else if (line.match(/^[\s]*\d+\.\s+/)) {
        const indent = (line.match(/^[\s]*/)?.[0].length || 0) / 2;
        const numberMatch = line.match(/^[\s]*(\d+)\.\s+/);
        const number = numberMatch?.[1] || '1';
        const listText = line.replace(/^[\s]*\d+\.\s+/, '');
        formattedLines.push(
          <div key={`number-${i}`} className={`flex items-start gap-2 mb-1 ml-${indent * 4}`}>
            <span className="text-gray-400 mt-1 font-mono text-sm">{number}.</span>
            <span>{renderInlineFormatting(listText)}</span>
          </div>
        );
      }
      // Check for horizontal rules
      else if (line.match(/^[-\*_]{3,}$/)) {
        formattedLines.push(
          <hr key={`hr-${i}`} className="border-gray-600 my-4" />
        );
      }
      // Check for blockquotes
      else if (line.match(/^>\s+/)) {
        const quoteText = line.replace(/^>\s+/, '');
        formattedLines.push(
          <div key={`quote-${i}`} className="border-l-4 border-gray-500 pl-4 py-1 my-2 bg-gray-800/50 rounded-r">
            <span className="text-gray-300 italic">{renderInlineFormatting(quoteText)}</span>
          </div>
        );
      }
      // Regular text with potential inline formatting
      else if (line.trim()) {
        formattedLines.push(
          <div key={`line-${i}`} className="mb-1">
            {renderInlineFormatting(line)}
          </div>
        );
      }
      // Empty lines
      else {
        formattedLines.push(<div key={`empty-${i}`} className="mb-2" />);
      }
    }

    return formattedLines;
  };

  const renderInlineFormatting = (text: string) => {
    const parts = [];
    let currentIndex = 0;
    
    // Combined regex for inline code, bold, italic
    const inlineRegex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*]+\*)|(\_[^_]+\_)/g;
    let match;

    while ((match = inlineRegex.exec(text)) !== null) {
      // Add text before match
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index));
      }

      const fullMatch = match[0];
      
      // Inline code
      if (fullMatch.startsWith('`') && fullMatch.endsWith('`')) {
        parts.push(
          <code
            key={`inline-code-${match.index}`}
            className="bg-gray-800 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono"
          >
            {fullMatch.slice(1, -1)}
          </code>
        );
      }
      // Bold (**text** or __text__)
      else if ((fullMatch.startsWith('**') && fullMatch.endsWith('**')) || 
               (fullMatch.startsWith('__') && fullMatch.endsWith('__'))) {
        parts.push(
          <strong key={`bold-${match.index}`} className="font-bold text-white">
            {fullMatch.slice(2, -2)}
          </strong>
        );
      }
      // Italic (*text* or _text_)
      else if ((fullMatch.startsWith('*') && fullMatch.endsWith('*')) || 
               (fullMatch.startsWith('_') && fullMatch.endsWith('_'))) {
        parts.push(
          <em key={`italic-${match.index}`} className="italic text-gray-200">
            {fullMatch.slice(1, -1)}
          </em>
        );
      }

      currentIndex = match.index + fullMatch.length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }

    return parts.length > 1 ? parts : text;
  };

  const contentParts = parseContent(content);

  return (
    <div className=" group w-full">
      {contentParts.map((part) => (
        <div key={part.key} className="w-full">
          {part.type === 'codeblock' ? (
            <CodeBlock code={part.content} language={part.language} />
          ) : (
            <div className="whitespace-pre-wrap w-full">
              {renderFormattedText(part.content)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
