import { cn } from "@/lib/utils";
import { PostListWidget } from "../_widgets/post/ui";

export default function Home() {
  // main page가 생기면..?
  return (
    <div
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
  );
}
