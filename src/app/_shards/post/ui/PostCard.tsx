import { PostCardPropType } from "@/app/_entities/post/model";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";

export const PostCard = ({ title, content, created_at }: PostCardPropType) => {
  const dateObj = dayjs(created_at);
  const formalDate = dayjs()?.from(dateObj);
  return (
    <Card
      className={cn(
        "border-0",
        "shadow-none",
        "hover:bg-slate-50",
        "hover:cursor-pointer"
      )}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription title={dateObj.format("YYYY-MM-DD HH:mm:ss")}>
          {formalDate}
        </CardDescription>
      </CardHeader>
      <CardContent
        className={cn("overflow-hidden", "whitespace-nowrap", "text-ellipsis")}
      >
        {content.substring(0, 70)}
      </CardContent>
    </Card>
  );
};
