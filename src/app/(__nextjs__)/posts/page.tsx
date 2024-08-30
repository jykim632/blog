import { PostListWidget } from "@/app/_widgets/post/ui";
import { cn } from "@/lib/utils";

export default function PostListPage(){
  return <div
  className={cn(
    "m-auto",
    "w-[460px]",
    "md:w-[700px]",
    "m-auto",
    "mt-5",
    "md:mt-5"
  )}
>
  <PostListWidget />
</div>
}