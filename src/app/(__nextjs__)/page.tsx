
import { redirect } from "next/navigation";

export default function Home() {
  // main page가 생기면..?
  return redirect("/posts");
}
