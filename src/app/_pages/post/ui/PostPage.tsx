import { PostType } from "@/app/_entities/post/model";
import { PostTitle } from "@/app/_shards/post/ui";
import { PostContent } from "@/app/_shards/post/ui/PostContent";
import { cn } from "@/lib/utils";

export const PostPage = (post: PostType) => {
  const { title, content, updated_at } = post;
  return (
    <div className={cn("space-y-5", "mb-10")}>
      <PostTitle title={title} updated_at={updated_at} />
      <PostContent content={content} />
    </div>
  );
};
