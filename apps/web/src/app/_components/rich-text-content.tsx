import type { ReactNode } from "react";
export type RichTextNode = { type?: string; attrs?: Record<string, unknown>; marks?: Array<{ type: string; attrs?: Record<string, unknown> }>; content?: RichTextNode[]; text?: string };

function children(node: RichTextNode): ReactNode {
  return node.content?.map((child, index) => <NodeView key={index} node={child} />);
}

function NodeView({ node }: { node: RichTextNode }) {
  if (node.type === "text") {
    let value: ReactNode = node.text ?? "";
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") value = <strong>{value}</strong>;
      if (mark.type === "italic") value = <em>{value}</em>;
      if (mark.type === "strike") value = <s>{value}</s>;
      if (mark.type === "code") value = <code>{value}</code>;
    }
    return value;
  }
  if (node.type === "heading") {
    const levelValue = typeof node.attrs?.level === "number" ? node.attrs.level : 2;
    const level = Math.min(3, Math.max(2, levelValue));
    return level === 3 ? <h3>{children(node)}</h3> : <h2>{children(node)}</h2>;
  }
  if (node.type === "bulletList") return <ul>{children(node)}</ul>;
  if (node.type === "orderedList") return <ol>{children(node)}</ol>;
  if (node.type === "listItem") return <li>{children(node)}</li>;
  if (node.type === "blockquote") return <blockquote>{children(node)}</blockquote>;
  if (node.type === "codeBlock") return <pre><code>{children(node)}</code></pre>;
  if (node.type === "horizontalRule") return <hr />;
  if (node.type === "hardBreak") return <br />;
  if (node.type === "paragraph") return <p>{children(node)}</p>;
  return <>{children(node)}</>;
}

export function RichTextContent({ document }: { document: RichTextNode }) {
  return <>{children(document)}</>;
}
