
import { cn } from "@/lib/utils";

export const PostContent = ({ content }: {content: string}) => {
  return <div className={cn("leading-8")} dangerouslySetInnerHTML={{__html: content}} />;
};
