import { z } from "zod";
import { getResponseSchema } from "./d1Model";

const postSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  tags: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime(),
});

const responsePostSchema = postSchema.pick({
  id: true,
  title: true,
  content: true,
  tags: true,
  updated_at: true
});

export const postResultSchema = getResponseSchema(responsePostSchema);

export type PostResultType = z.infer<typeof postResultSchema>;
export type PostType = z.infer<typeof responsePostSchema>;