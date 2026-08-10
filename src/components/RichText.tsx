import { Fragment, type ReactNode } from "react";
import { hasProse } from "@/lib/payload";

/**
 * Renderer for Payload's Lexical richText fields.
 *
 * The site used to read these through `extractText`, which walks the tree and
 * returns only the plain string of each `paragraph` node. Everything else in
 * the document was dropped on the way out: `linebreak` nodes returned "" and
 * so glued the lines around them together, lists never reached the page at
 * all, and inline bold/italic/links were flattened to bare text. This walks
 * the same tree but emits the matching elements instead, so what an editor
 * composes in the admin is what the page shows.
 *
 * `extractText` is still the right tool for teasers and card excerpts, where a
 * plain string is what the caller actually wants. It stays as it is.
 */

// Lexical stores inline styling as a bitmask on each text node.
const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 1 << 1;
const FORMAT_STRIKETHROUGH = 1 << 2;
const FORMAT_UNDERLINE = 1 << 3;
const FORMAT_CODE = 1 << 4;
const FORMAT_SUBSCRIPT = 1 << 5;
const FORMAT_SUPERSCRIPT = 1 << 6;

type LexicalNode = Record<string, unknown>;

const childrenOf = (node: LexicalNode): LexicalNode[] =>
  Array.isArray(node.children) ? (node.children as LexicalNode[]) : [];

/**
 * Node alignment, when the editor set one explicitly.
 *
 * Left unset otherwise so the block inherits the page's direction — Arabic
 * pages are already right-aligned by the ambient `dir`, and hardcoding a side
 * here would fight that.
 */
function alignmentClass(node: LexicalNode): string {
  switch (node.format) {
    case "center":
      return " text-center";
    case "right":
      return " text-right";
    case "justify":
      return " text-justify";
    case "left":
      return " text-left";
    default:
      return "";
  }
}

function renderText(node: LexicalNode, key: number): ReactNode {
  const text = (node.text as string) ?? "";
  if (!text) return null;

  const format = typeof node.format === "number" ? node.format : 0;
  let element: ReactNode = text;

  if (format & FORMAT_CODE) {
    element = (
      <code className="font-mono text-[0.9em] bg-secondary/40 rounded px-1">{element}</code>
    );
  }
  if (format & FORMAT_BOLD) element = <strong>{element}</strong>;
  if (format & FORMAT_ITALIC) element = <em>{element}</em>;
  if (format & FORMAT_UNDERLINE) element = <u>{element}</u>;
  if (format & FORMAT_STRIKETHROUGH) element = <s>{element}</s>;
  if (format & FORMAT_SUBSCRIPT) element = <sub>{element}</sub>;
  if (format & FORMAT_SUPERSCRIPT) element = <sup>{element}</sup>;

  return <Fragment key={key}>{element}</Fragment>;
}

function renderNodes(nodes: LexicalNode[]): ReactNode[] {
  return nodes.map((node, i) => renderNode(node, i)).filter((n) => n !== null);
}

function renderNode(node: LexicalNode, key: number): ReactNode {
  switch (node.type) {
    case "text":
      return renderText(node, key);

    // A soft break (Shift+Enter). Dropping these was what ran separate lines
    // of an Arabic write-up together into one unbroken block.
    case "linebreak":
      return <br key={key} />;

    case "paragraph":
      return (
        // whitespace-pre-wrap keeps the author's own spacing: this content is
        // written with runs of spaces indenting bullet characters typed by
        // hand, and the default `white-space: normal` collapsed each run to a
        // single space, so the bullets lost their indentation.
        <p key={key} className={"whitespace-pre-wrap" + alignmentClass(node)}>
          {renderNodes(childrenOf(node))}
        </p>
      );

    case "heading": {
      const tag = (node.tag as string) ?? "h3";
      const Tag = (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag) ? tag : "h3") as "h3";
      const size =
        { h1: "text-3xl", h2: "text-2xl", h3: "text-xl", h4: "text-lg", h5: "text-base" }[tag] ??
        "text-base";
      return (
        <Tag
          key={key}
          className={`font-serif ${size} text-primary mt-8 mb-3${alignmentClass(node)}`}
        >
          {renderNodes(childrenOf(node))}
        </Tag>
      );
    }

    case "list": {
      const ordered = node.listType === "number";
      const Tag = ordered ? "ol" : "ul";
      return (
        // ps-* is the logical inline-start padding, so the markers sit inside
        // the text column in both directions rather than hanging off the left
        // edge of an Arabic page.
        <Tag
          key={key}
          className={
            (ordered ? "list-decimal" : "list-disc") + " ps-6 space-y-2" + alignmentClass(node)
          }
        >
          {renderNodes(childrenOf(node))}
        </Tag>
      );
    }

    case "listitem":
      return (
        <li key={key} className="whitespace-pre-wrap ps-1">
          {renderNodes(childrenOf(node))}
        </li>
      );

    case "quote":
      return (
        <blockquote
          key={key}
          className={
            "border-s-2 border-accent/40 ps-4 italic text-foreground/80" + alignmentClass(node)
          }
        >
          {renderNodes(childrenOf(node))}
        </blockquote>
      );

    case "link":
    case "autolink": {
      const fields = (node.fields as Record<string, unknown> | undefined) ?? {};
      const href = (fields.url as string) ?? (node.url as string) ?? "";
      const newTab = fields.newTab === true;
      return (
        <a
          key={key}
          href={href}
          {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="text-accent underline underline-offset-2 hover:opacity-80"
        >
          {renderNodes(childrenOf(node))}
        </a>
      );
    }

    case "horizontalrule":
      return <hr key={key} className="border-border my-8" />;

    default: {
      // Unknown block (a custom Payload block, a table, a future node type).
      // Render whatever text it contains rather than dropping it silently.
      const children = childrenOf(node);
      if (!children.length) return null;
      return <Fragment key={key}>{renderNodes(children)}</Fragment>;
    }
  }
}

/**
 * Render a Payload prose field.
 *
 * Accepts both shapes the CMS produces: Lexical richText (the `content` fields)
 * and a plain textarea string (the `description` fields), because callers fall
 * back from one to the other and should not have to care which they got.
 */
export function RichText({ value, className }: { value: unknown; className?: string }) {
  if (!hasProse(value)) return null;

  // A textarea field. Its newlines are the author's formatting, so they are
  // kept verbatim rather than being split and re-joined into <p> elements.
  if (typeof value === "string") {
    return (
      <div className={className}>
        <p className="whitespace-pre-wrap">{value}</p>
      </div>
    );
  }

  const root = (value as Record<string, unknown>).root as LexicalNode;
  return <div className={className}>{renderNodes(childrenOf(root))}</div>;
}
