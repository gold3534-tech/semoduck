import { redirect } from "next/navigation";

export default function LikesPage() {
  redirect("/mypage?tab=likes");
}
