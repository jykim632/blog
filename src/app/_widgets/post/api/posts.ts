"use server";

import { PostType, ResponsePostType } from "@/app/_entities/post/model";
import { CreatePostType } from "@/app/_entities/post/model/postModel";
import { queryAPIURL } from "@/app/api/data/cloudflare";
import { postAPI } from "@/lib/fetcher";
import { revalidateTag } from "next/cache";

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
    }, {
      next: {
        revalidateTag: ['postList']
      }
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

export const createPost = async (post: CreatePostType) => {
  const query = `
    insert into posts(title, content) values(?, ?)
  `;

  try {
    const {success, errors, result} = await postAPI<ResponsePostType>(queryAPIURL, {
      sql: query,
      params: [post.title, post.content]
    });
    if(success){
      revalidateTag('postList');
      return result[0].results as PostType[];
    }
    if(errors.length){
      console.error(errors);
      throw new Error(`${errors[0].code}-${errors[0].message}`);
    }
  } catch (error) {
    
  }

}