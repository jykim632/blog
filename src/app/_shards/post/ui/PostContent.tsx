import type { PostContentType } from "@/app/_entities/post/model";
import { cn } from "@/lib/utils";

export const PostContent = ({ content }: PostContentType) => {
  return <div className={cn("leading-8")}>{content}</div>;
};
