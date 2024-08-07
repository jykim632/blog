import { ReactNode } from "react";

export default async function PostPageLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div>{children}</div>;
}
