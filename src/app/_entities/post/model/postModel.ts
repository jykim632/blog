import { z } from "zod";
import { getResponseSchema } from "../../d1/model/d1Model";

const postSchema = z.object({
  id: z.number(),
  title: z.string().min(5).max(100),
  content: z.string(),
  tags: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime(),
});

const apiPostSchema = postSchema.pick({
  id: true,
  title: true,
  content: true,
  tags: true,
  updated_at: true
});

const PostCardSchema = postSchema.pick({
  title:true,
  content:true,
  updated_at:true,
})

export const postParamsSchema = z.object({
  title: z.string(),
  start_date: z.string().datetime({offset: true}),
  end_date: z.string().datetime({offset: true}),
  page: z.number(),
  offset: z.number().default(10),
});

const createPostShcmea = postSchema.pick({
  title: true,
  content: true,
})

export const responsePostApiSchema = getResponseSchema(apiPostSchema);


export type PostParamsType = z.infer<typeof postParamsSchema>;
export type PostType = z.infer<typeof apiPostSchema>;
export type ResponsePostType = z.infer<typeof responsePostApiSchema>;

export type CreatePostType = z.infer<typeof createPostShcmea>;

// ui component
export type PostCardProps = z.infer<typeof PostCardSchema>;
