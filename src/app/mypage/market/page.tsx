import { MyActivityList } from "@/app/mypage/activity-list";
import { Card } from "@/components/ui/card";

export default function MyMarketPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#fff8fb] via-white to-[#f5edff] p-7">
        <p className="text-sm font-black text-[#ff6f9b]">마이페이지</p>
        <h1 className="mt-2 text-3xl font-black text-[#3a285f]">내 마켓 글</h1>
      </Card>
      <MyActivityList type="market" />
    </div>
  );
}
