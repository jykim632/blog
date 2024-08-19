import { PostPage } from "@/app/_pages/post/ui";
import { getPost } from "@/app/_widgets/post/api/posts";
import { PostEditorWidget } from "@/app/_widgets/post/ui";



export default async function Page({ params: { id } }: { params: { id: string } }) {
  // 여기서 title, text를 분리..?

  if(id === 'new'){
    return <PostEditorWidget />
  }

  const post = await getPost(+id);
  if(!post){
    return <div>error..?</div>
  }
  return <PostPage {...post[0]} />;
}
