import { PostCard } from "@/app/_shards/post/ui";
import Link from "next/link";
import { getPosts } from "../api";

export const PostListWidget = async () => {
  const posts = await getPosts();
  return (
    <div>
      {posts && posts.map((post) => (
        <Link key={post.id} href={`/posts/${post.id}`}>
          <PostCard {...post} />
        </Link>
      ))}
    </div>
  );
};
