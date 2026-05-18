import { MyActivityList } from "@/app/mypage/activity-list";

export default function MyMarketPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-berry">마이페이지</p>
        <h1 className="mt-2 text-3xl font-black">내 마켓 글</h1>
      </div>
      <MyActivityList type="market" />
    </div>
  );
}
