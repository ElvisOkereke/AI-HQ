import React from 'react';

// Define Monokai Pro inspired colors
const monokaiColors = {
  background: '#272822',
  text: '#F8F8F2',
  comment: '#75715E',
  keyword: '#F92672', // e.g., 'function', 'const', 'let', 'if', 'else'
  string: '#E6DB74', // e.g., '"hello"', "'world'"
  number: '#AE81FF', // e.g., 123, 45.67
  function: '#66D9EF', // e.g., function names, method calls
  type: '#F92672', // e.g., 'function' in type definitions, 'Promise'
  variable: '#FD971F', // e.g., variable names
  property: '#A6E22E', // e.g., object properties, CSS properties
  tag: '#F92672', // e.g., HTML/JSX tags
  punctuation: '#F8F8F2', // e.g., ';', '(', ')', '{', '}', ','
  meta: '#75715E', // e.g., preprocessor directives
  boolean: '#AE81FF', // e.g., true, false
};

// Simple tokenization based on regex
const tokenize = (code: string, language?: string): Array<{ token: string; type: keyof typeof monokaiColors }> => {
  // Very basic language detection/fallback
  const lang = language || 'javascript';

  // Regex patterns - this is the most complex part and needs extensive refinement
  // This is a very simplified example for common JS/TS patterns
  const patterns = {
    // Order matters! More specific patterns should come first.
    comment: /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm,
    string: /(["'])(?:(?=(\\?))\2.)*?\1/g, // Matches strings like "hello" or 'world'
    number: /\b\d+(\.\d+)?\b/g, // Matches numbers
    keyword: /\b(function|const|let|var|if|else|for|while|return|class|import|export|default|true|false|null)\b/g,
    boolean: /\b(true|false)\b/g,
    type: /\b(string|number|boolean|any|void|Promise|Array)\b/g, // Example types
    function: /\b[a-zA-Z0-9_]+\s*\(/g, // Basic function call/definition detection
    property: /\b[a-zA-Z0-9_]+:\s*/g, // Object property access
    tag: /<[a-zA-Z][a-zA-Z0-9]*\b[^>]*>/g, // Basic JSX/HTML tag detection
    punctuation: /[{}()[\];,.]/g, // Common punctuation
    variable: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, // Catch-all for identifiers (needs careful ordering)
  };

  let tokens: Array<{ token: string; type: keyof typeof monokaiColors }> = [];
  let lastIndex = 0;
  let match;

  // A more robust tokenizer would iterate through patterns, applying them sequentially
  // and splitting the code. This example uses a simpler approach by iterating
  // through all patterns and trying to identify tokens.

  // Combine all regexes to find potential token starts
  const combinedRegex = new RegExp(
    Object.values(patterns)
      .map(p => `(${p.source})`)
      .join('|'),
    'g'
  );

  const identifiedTokens: Array<{ text: string; type: keyof typeof monokaiColors; index: number }> = [];

  // Identify tokens and their types
  for (const type in patterns) {
    const pattern = patterns[type as keyof typeof patterns];
    pattern.lastIndex = 0; // Reset lastIndex for each pattern
    while ((match = pattern.exec(code)) !== null) {
      identifiedTokens.push({ text: match[0], type: type as keyof typeof monokaiColors, index: match.index });
    }
  }

  // Sort tokens by their index to process them in order
  identifiedTokens.sort((a, b) => a.index - b.index);

  // Build the final token list, handling overlaps and ensuring all code is covered
  let processedCode = code;
  let currentPos = 0;
  
  for (const tokenInfo of identifiedTokens) {
    // Add text before the current token if there's a gap
    if (tokenInfo.index > currentPos) {
      const textBefore = code.substring(currentPos, tokenInfo.index);
      // Try to further tokenize this text to catch remaining patterns
      const subTokens = tokenize(textBefore, lang); // Recursive call for sub-segments
      tokens.push(...subTokens);
    }

    // Process the identified token
    const tokenText = tokenInfo.text;
    let tokenType = tokenInfo.type;

    // Handle specific cases and refinements
    if (tokenType === 'variable') {
      // Check if it's a keyword or type we missed earlier
      if (patterns.keyword.test(tokenText)) tokenType = 'keyword';
      else if (patterns.type.test(tokenText)) tokenType = 'type';
      else if (patterns.boolean.test(tokenText)) tokenType = 'boolean';
      // It might be a function name if it's followed by '('
      else if (patterns.function.test(tokenText + '(')) tokenType = 'function';
      // Property access check
      else if (patterns.property.test(tokenText)) tokenType = 'property';
      // If it's still not classified, keep it as variable or adjust as needed
      // This is where the complexity lies - accurate classification is hard.
    } else if (tokenType === 'function') {
      // If the match included the parenthesis, ensure it's correctly tokenized
      if (tokenText.endsWith('(')) {
        const funcName = tokenText.slice(0, -1);
        if (funcName) {
          tokens.push({ token: funcName, type: 'function' });
          tokens.push({ token: '(', type: 'punctuation' });
        }
        currentPos = tokenInfo.index + tokenText.length; // Update position
        continue; // Skip adding the combined token
      }
    }
    // Apply punctuation styling more specifically
    else if (tokenType === 'punctuation') {
      // Break down punctuation if it's mixed with other text
      for (const char of tokenText) {
        tokens.push({ token: char, type: 'punctuation' });
      }
      currentPos = tokenInfo.index + tokenText.length;
      continue;
    }

    tokens.push({ token: tokenText, type: tokenType });
    currentPos = tokenInfo.index + tokenText.length;
  }

  // Add any remaining code that wasn't tokenized
  if (currentPos < code.length) {
    const remainingText = code.substring(currentPos);
    const subTokens = tokenize(remainingText, lang);
    tokens.push(...subTokens);
  }

  return tokens;
};
// Custom Syntax Highlighter Component
export const CustomSyntaxHighlighter: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const tokens = tokenize(code, language);

  const getStyleForToken = (type: keyof typeof monokaiColors): React.CSSProperties => {
    return {
      color: monokaiColors[type] || monokaiColors.text, // Default to text color
      // Add other styles as needed, e.g., font-weight for keywords
      fontWeight: type === 'keyword' || type === 'type' ? 600 : undefined,
      fontStyle: type === 'comment' ? 'italic' : undefined,
    };
  };

  return (
    <pre className="relative group my-4 w-full bg-gray-900 p-4 rounded-b-lg overflow-x-auto custom-code-scrollbars" style={{ border: '1px solid #383830', borderTop: 'none', maxHeight: '400px', fontFamily: 'Menlo, Monaco, "Courier New", monospace' }}>
      <code className="text-sm font-mono whitespace-pre" style={{ color: monokaiColors.text }}>
        {tokens.map(({ token, type }, index) => (
          <span key={index} style={getStyleForToken(type)}>
            {token}
          </span>
        ))}
      </code>
    </pre>
  );
};
