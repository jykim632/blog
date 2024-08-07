import { PostPage } from "@/app/_pages/post/ui";
import { getPost } from "@/app/widgets/post/api/posts";

export default async function Page({ params: { id } }: { params: { id: string } }) {
  // 여기서 title, text를 분리..?
  const post = await getPost(+id);
  if(!post){
    return <div>error..?</div>
  }
  return <PostPage {...post[0]} />;
}
