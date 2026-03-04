import { useState } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import { useToast } from "@/use-toast";
import { useTheme } from "@/context/ThemeContext";
import "./ShowcaseComponents.css";

SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("html", markup);
SyntaxHighlighter.registerLanguage("json", json);

const lightColors = {
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

const darkColors = {
  comment: "#94a3b8",
  keyword: "#ffb703",
  string: "#a8dadc",
  function: "#74c0fc",
  variable: "#adb5bd",
  number: "#fbc531",
  className: "#c77dff",
  tag: "#ff6b6b",
  attrName: "#fd7e14",
  punctuation: "#dee2e6",
  operator: "#ced4da",
  default: "#f1f5f9",
};

const CodeBlock = ({ code, language = "jsx" }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();

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

  const colors = theme === "dark" ? darkColors : lightColors;

  const customStyle = {
    'code[class*="language-"]': {
      color: colors.default,
      background: "transparent",
      textShadow: "none",
      fontFamily: "JetBrains Mono, monospace",
      fontSize: "0.875rem",
      lineHeight: "1.5",
    },
    'pre[class*="language-"]': {
      color: colors.default,
      background: "transparent",
      textShadow: "none",
      fontFamily: "JetBrains Mono, monospace",
      fontSize: "0.875rem",
      lineHeight: "1.5",
      margin: 0,
      padding: 0,
    },
    comment: { color: colors.comment, fontStyle: "italic" },
    punctuation: { color: colors.punctuation },
    string: { color: colors.string, fontStyle: "italic" },
    number: { color: colors.number },
    function: { color: colors.function },
    keyword: { color: colors.keyword },
    operator: { color: colors.operator },
    "class-name": { color: colors.className },
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
