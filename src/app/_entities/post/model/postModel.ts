import { z } from "zod";

const PostDataSchema = z.object({
  title: z.string(),
  content: z.string(),
  created_at: z.string().datetime({ offset: true }).optional(),
  updated_at: z.string().datetime({ offset: true }).optional(),
});

const PostPageSchema = z.object({
  data: PostDataSchema,
});

const PostTitleSchema = PostDataSchema.pick({ title: true, updated_at: true });
const PostContentSchema = PostDataSchema.pick({ content: true });

const PostCardSchema = PostDataSchema.omit({ updated_at: true });


export const postParamsSchema = z.object({
  title: z.string(),
  start_date: z.string().datetime({offset: true}),
  end_date: z.string().datetime({offset: true}),
  page: z.number(),
  offset: z.number().default(10),
});

export type PostParamsType = z.infer<typeof postParamsSchema>;

export type PostTitleType = z.infer<typeof PostTitleSchema>;
export type PostContentType = z.infer<typeof PostContentSchema>;
export type PostPageType = z.infer<typeof PostPageSchema>;
export type PostCardPropType = z.infer<typeof PostCardSchema>;
