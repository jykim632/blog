import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default async function PostLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={cn("m-auto", "w-[460px]", "md:w-[700px]", "m-auto", "mt-5", "md:mt-5")}>
      {children}
    </div>
  );
}
