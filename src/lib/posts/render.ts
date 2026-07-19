import type { TiptapDocument, TiptapNode } from '../../../functions/api/admin/posts/schema';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderChildren(nodes: TiptapNode[] | undefined): string {
  return (nodes ?? []).map(renderNode).join('');
}

function renderText(node: TiptapNode): string {
  let html = escapeHtml(node.text ?? '');
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') html = `<strong>${html}</strong>`;
    if (mark.type === 'italic') html = `<em>${html}</em>`;
    if (mark.type === 'strike') html = `<s>${html}</s>`;
    if (mark.type === 'code') html = `<code>${html}</code>`;
  }
  return html;
}

function renderNode(node: TiptapNode): string {
  const content = renderChildren(node.content);
  if (node.type === 'text') return renderText(node);
  if (node.type === 'hardBreak') return '<br>';
  if (node.type === 'paragraph') return `<p>${content}</p>`;
  if (node.type === 'heading') {
    const level = Number((node.attrs ?? {}).level);
    const tag = level >= 1 && level <= 3 ? `h${level}` : 'h2';
    return `<${tag}>${content}</${tag}>`;
  }
  if (node.type === 'blockquote') return `<blockquote>${content}</blockquote>`;
  if (node.type === 'bulletList') return `<ul>${content}</ul>`;
  if (node.type === 'orderedList') return `<ol>${content}</ol>`;
  if (node.type === 'listItem') return `<li>${content}</li>`;
  if (node.type === 'codeBlock') return `<pre><code>${content}</code></pre>`;
  if (node.type === 'horizontalRule') return '<hr>';
  return '';
}

export function renderPostContent(document: TiptapDocument): string {
  return renderChildren(document.content);
}
