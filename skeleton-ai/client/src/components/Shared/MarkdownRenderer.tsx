import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { RetrievalResult } from "@shared/types/ai";
import CodeBlock from "./CodeBlock";
import SourceCitation from "../Chat/SourceCitation";

interface MarkdownRendererProps {
  content: string;
  sources?: RetrievalResult[];
}

function processCitations(text: string, sources?: RetrievalResult[]): (string | JSX.Element)[] {
  if (!sources || sources.length === 0) return [text];

  const parts: (string | JSX.Element)[] = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const citationIndex = parseInt(match[1], 10);
    const source = sources[citationIndex - 1];
    parts.push(
      <SourceCitation
        key={`cite-${match.index}`}
        index={citationIndex}
        filePath={source?.file_path}
      />
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function MarkdownRenderer({ content, sources }: MarkdownRendererProps) {
  return (
    <div className="markdown-content text-sm text-surface-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            if (match) {
              return <CodeBlock language={match[1]} code={codeString} />;
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          p({ children }) {
            const processed = Array.isArray(children)
              ? children.flatMap((child) => {
                  if (typeof child === "string") {
                    return processCitations(child, sources);
                  }
                  return child;
                })
              : typeof children === "string"
                ? processCitations(children, sources)
                : children;

            return <p>{processed}</p>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
