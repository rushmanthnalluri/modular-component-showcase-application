import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { useToast } from "@/use-toast";
import "./ShowcaseComponents.css";

const themeColors = {
  comment: "#7a8698",
  keyword: "#b64d27",
  string: "#0d7a72",
  function: "#1b5e8f",
  variable: "#2f4858",
  number: "#8a4b14",
  className: "#0f6e84",
  tag: "#b23a48",
  attrName: "#9a6112",
  punctuation: "#506070",
  operator: "#44546a",
  default: "#23323d",
};

const customStyle = {
  'code[class*="language-"]': {
    color: themeColors.default,
    background: "transparent",
    textShadow: "none",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: "0.875rem",
    lineHeight: "1.5",
  },
  'pre[class*="language-"]': {
    color: themeColors.default,
    background: "transparent",
    textShadow: "none",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: "0.875rem",
    lineHeight: "1.5",
    margin: 0,
    padding: 0,
  },
  comment: {
    color: themeColors.comment,
    fontStyle: "italic",
  },
  punctuation: {
    color: themeColors.punctuation,
  },
  string: {
    color: themeColors.string,
    fontStyle: "italic",
  },
  number: {
    color: themeColors.number,
  },
  function: {
    color: themeColors.function,
  },
  keyword: {
    color: themeColors.keyword,
  },
  operator: {
    color: themeColors.operator,
  },
  "class-name": {
    color: themeColors.className,
  },
};

const CodeBlock = ({ code, language = "jsx" }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
      duration: 2500,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const mapLanguage = (lang) => {
    const langMap = {
      tsx: "tsx",
      ts: "typescript",
      jsx: "jsx",
      js: "javascript",
      css: "css",
      html: "html",
      json: "json",
    };
    return langMap[lang.toLowerCase()] || lang.toLowerCase();
  };

  return (
    <div className="code-block-wrap">
      <div className="code-block-head">
        <span className="code-language">{language.toUpperCase()}</span>
        <button type="button" onClick={handleCopy} aria-label="Copy code to clipboard">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="code-block-body">
        <SyntaxHighlighter
          language={mapLanguage(language)}
          style={customStyle}
          customStyle={{ margin: 0, padding: "1rem", background: "transparent" }}
          PreTag="div"
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;
