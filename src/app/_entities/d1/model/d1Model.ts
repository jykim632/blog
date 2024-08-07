import { z, ZodObject, ZodRawShape, ZodType } from "zod";

const baseResultSchema = z.object({
  success: z.boolean(),
  meta: z.object({
    served_by: z.string(),
    duration: z.number(),
    changes: z.number(),
    last_row_id: z.number(),
    changed_db: z.boolean(),
    size_after: z.number(),
    rows_read: z.number(),
    rows_written: z.number(),
  })
});

const responseSchema = z.object({
  success: z.boolean(),
  errors: z.array(z.any()),
  message: z.array(z.any())
});

const getBaseResultSchema = (item: ZodType) => {
  return baseResultSchema.extend({
    results: z.array(item)
  });
}

export const getResponseSchema = (item: ZodType) => {
  return responseSchema.extend({
    result: z.array(getBaseResultSchema(item))
  })
}