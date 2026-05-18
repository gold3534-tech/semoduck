import { CheckCircle2, Flag, Link2, PackagePlus, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { products } from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-berry">관리자</p>
          <h1 className="mt-2 text-3xl font-black">공식샵 링크와 제보를 관리해요</h1>
          <p className="mt-2 text-slate-600">Supabase profiles.role이 admin인 사용자만 접근하도록 확장하는 구조입니다.</p>
        </div>
        <Badge tone="mint">
          <ShieldCheck size={14} /> admin
        </Badge>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <PackagePlus className="text-berry" />
          <p className="mt-3 text-sm font-bold text-slate-500">등록 상품</p>
          <p className="mt-1 text-3xl font-black">{products.length}</p>
        </Card>
        <Card>
          <Link2 className="text-mint" />
          <p className="mt-3 text-sm font-bold text-slate-500">대기 중 제보</p>
          <p className="mt-1 text-3xl font-black">10</p>
        </Card>
        <Card>
          <Flag className="text-amber-500" />
          <p className="mt-3 text-sm font-bold text-slate-500">신고 내역</p>
          <p className="mt-1 text-3xl font-black">5</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">유저 제보 링크</h2>
          <Button>
            <PackagePlus size={16} />
            공식샵 링크 등록
          </Button>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {["쿠로미 키링 네이버 최저가", "BTS 포토카드 바인더 특전", "롤드컵 유니폼 재입고"].map((submission, index) => (
            <div key={submission} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-black">{submission}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">pending · user{index + 1}@semoduck.dev</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary">
                  <CheckCircle2 size={16} /> 승인
                </Button>
                <Button variant="danger">
                  <XCircle size={16} /> 거절
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
