import { useMemo } from "react";

interface Props {
  content: string;
  onNavigateToSlug: (slug: string) => void;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarkdown(md: string): string {
  let html = md;

  // Code blocks (must be before inline code)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre><code>${escapeHtml(code.trimEnd())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Wiki links [[Page Title]]
  html = html.replace(/\[\[([^\]]+)\]\]/g, (_match, title) => {
    const slug = slugify(title.trim());
    return `<a class="wiki-link" data-wiki-slug="${slug}">${title.trim()}</a>`;
  });

  // Standard links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-3" />');

  // Tables
  html = html.replace(
    /^(\|.+\|)\n(\|[-:\s|]+\|)\n((?:\|.+\|\n?)*)/gm,
    (_match, headerRow, _divider, bodyRows) => {
      const headers = headerRow.split("|").filter((c: string) => c.trim());
      const headerHtml = headers
        .map((h: string) => `<th>${h.trim()}</th>`)
        .join("");

      const rows = bodyRows
        .trim()
        .split("\n")
        .map((row: string) => {
          const cells = row.split("|").filter((c: string) => c.trim());
          return `<tr>${cells.map((c: string) => `<td>${c.trim()}</td>`).join("")}</tr>`;
        })
        .join("");

      return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rows}</tbody></table>`;
    }
  );

  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr />");

  // Bold and italic
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Unordered lists
  html = html.replace(/^((?:- .+\n?)+)/gm, (match) => {
    const items = match
      .trim()
      .split("\n")
      .map((line) => `<li>${line.replace(/^- /, "")}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/^((?:\d+\. .+\n?)+)/gm, (match) => {
    const items = match
      .trim()
      .split("\n")
      .map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  });

  // Paragraphs (lines that aren't already wrapped in block elements)
  html = html.replace(
    /^(?!<[houptlb]|<pre|<img|<hr|<blockquote)(.+)$/gm,
    "<p>$1</p>"
  );

  // Clean up multiple blank lines
  html = html.replace(/\n{3,}/g, "\n\n");

  return html;
}

export default function PageContent({ content, onNavigateToSlug }: Props) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const wikiLink = target.closest("[data-wiki-slug]") as HTMLElement | null;
    if (wikiLink) {
      e.preventDefault();
      const slug = wikiLink.dataset.wikiSlug;
      if (slug) onNavigateToSlug(slug);
    }
  };

  return (
    <div
      className="wiki-content"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
