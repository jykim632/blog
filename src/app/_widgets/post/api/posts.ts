"use server";

import { PostType, ResponsePostType } from "@/app/_entities/post/model";
import { queryAPIURL } from "@/app/api/data/cloudflare";
import { postAPI } from "@/lib/fetcher";

/**
 * 첫 화면 >> post list 가져오기
 */
export const getPosts = async () => {
  const query = `
    select id, title, content, tags, updated_at
    from posts
    where 1=1
      AND deleted_at IS null
    order by updated_at desc
  `;

  try {
    const {success, errors, result} = await postAPI<ResponsePostType>(queryAPIURL, {
      sql: query
    });
    if(success){
      return result[0].results as PostType[];
    }
    if(errors.length){
      console.error(errors);
      throw new Error(`${errors[0].code}-${errors[0].message}`);
    }
  } catch (error) {
    console.error(error);
  }

}

export const getPost = async (id: number) => {
  const query = `
    select id, title, content, tags, updated_at
    from posts
    where 1=1
      AND deleted_at IS null
      AND id=${+id}
  `;

  console.log(query);

  try {
    const {success, errors, result} = await postAPI<ResponsePostType>(queryAPIURL, {
      sql: query
    });
    if(success){
      return result[0].results as PostType[];
    }
    if(errors.length){
      console.error(errors);
      throw new Error(`${errors[0].code}-${errors[0].message}`);
    }
  } catch (error) {
    console.error(error);
  }
}