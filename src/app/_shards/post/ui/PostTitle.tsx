import dayjs from "dayjs";
import { cn } from "@/lib/utils";

export const PostTitle = ({ title, updated_at }: {title: string, updated_at: string}) => {
  const dateObj = dayjs(updated_at);

  return (
    <div className="space-y-2">
      <div className={cn("text-2xl", "font-bold")}>{title}</div>
      <div className="text-gray-500">
        <span title={dateObj.format("YYYY-MM-DD HH:mm:ss")}>
          {dayjs().from(dateObj)}
        </span>{" "}
        작성
      </div>
    </div>
  );
};
