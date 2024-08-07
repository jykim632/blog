import { postParamsSchema, PostParamsType } from "@/app/_entities/post/model/postModel";

export const getPostsForSql = (params: PostParamsType): string | Error => {
  if(postParamsSchema.parse(params)){
    const {title, start_date, end_date, page, offset} = params;
    const sql = `SELECT
      seq,
      title,
      content,
      created_at,
      updated_at
        FROM
            posts
        WHERE
            ${title ? `title LIKE ${title}` : ""}
            ${start_date ? `AND updated_at BETWEEN ${start_date} AND ${end_date}`: ""}
        ORDER BY
            updated_at DESC
        LIMIT ${offset} OFFSET (${page} - 1) * 10;`
    return sql;
  }else{
    throw new Error("params parsing error");
  }
}