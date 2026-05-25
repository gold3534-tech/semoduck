import { redirect } from "next/navigation";

export default function MyMarketPage() {
  redirect("/mypage?tab=market");
}
