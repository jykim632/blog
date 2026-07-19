import { z } from "zod";

export const postIdSchema = z.string().uuid();
export const postStatusSchema = z.enum(["draft", "published", "archived"]);
export const postTitleSchema = z.string().trim().min(1).max(90);
export const postSummarySchema = z.string().trim().max(240).default("");
export const postSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.",
  );
export const tagNamesSchema = z
  .array(z.string().trim().min(1).max(40))
  .max(12)
  .default([]);

export type TiptapNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string }>;
  content?: TiptapNode[];
};

export type TiptapDocument = TiptapNode & {
  type: "doc";
  content: TiptapNode[];
};

const inlineTypes = new Set(["text", "hardBreak"]);
const blockTypes = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "listItem",
  "codeBlock",
  "horizontalRule",
]);
const markTypes = new Set(["bold", "italic", "strike", "code"]);

function isTiptapNode(value: unknown, depth = 0): value is TiptapNode {
  if (depth > 12 || !value || typeof value !== "object" || Array.isArray(value))
    return false;
  const node = value as Record<string, unknown>;
  if (
    typeof node.type !== "string" ||
    (!inlineTypes.has(node.type) && !blockTypes.has(node.type))
  )
    return false;
  if (
    node.type === "text" &&
    (typeof node.text !== "string" || node.text.length > 20_000)
  )
    return false;
  if (
    node.type === "heading" &&
    node.attrs &&
    (!Number.isInteger((node.attrs as Record<string, unknown>).level) ||
      ![1, 2, 3].includes(
        Number((node.attrs as Record<string, unknown>).level),
      ))
  )
    return false;
  if (
    node.marks &&
    (!Array.isArray(node.marks) ||
      node.marks.some(
        (mark) =>
          !mark ||
          typeof mark !== "object" ||
          !markTypes.has((mark as Record<string, unknown>).type as string),
      ))
  )
    return false;
  if (
    node.content &&
    (!Array.isArray(node.content) ||
      node.content.length > 2_000 ||
      !node.content.every((child) => isTiptapNode(child, depth + 1)))
  )
    return false;
  return true;
}

export const contentJsonSchema = z.custom<TiptapDocument>((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const document = value as Record<string, unknown>;
  return (
    document.type === "doc" &&
    Array.isArray(document.content) &&
    document.content.length > 0 &&
    document.content.length <= 2_000 &&
    document.content.every((node) => isTiptapNode(node))
  );
}, "허용되지 않은 편집기 문서 형식입니다.");

const postFieldsSchema = z.object({
  title: postTitleSchema,
  summary: postSummarySchema,
  categoryId: z.string().min(1).max(100),
  slug: postSlugSchema.optional(),
  contentJson: contentJsonSchema,
  coverImageUrl: z.string().url().nullable().optional(),
  tags: tagNamesSchema,
});

export const createPostSchema = postFieldsSchema;
export const updatePostSchema = postFieldsSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "수정할 내용을 입력해 주세요.",
  );
