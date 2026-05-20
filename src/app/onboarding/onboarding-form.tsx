"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function OnboardingForm({ interests }: { interests: string[] }) {
  const [selected, setSelected] = useState<string[]>(interests.slice(0, 3));

  function toggle(interest: string) {
    setSelected((current) => (current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-black text-berry">관심사 온보딩</p>
        <h1 className="mt-2 text-3xl font-black">좋아하는 장르와 키워드를 골라주세요</h1>
        <p className="mt-3 text-slate-600">선택한 관심사는 추천 굿즈와 갤러리 탐색의 기본값으로 사용할 수 있습니다.</p>
      </div>
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {interests.map((interest) => {
            const active = selected.includes(interest);
            return (
              <button
                key={interest}
                onClick={() => toggle(interest)}
                className={`flex min-h-14 items-center justify-between rounded-lg border px-4 text-left font-black transition ${
                  active ? "border-berry bg-pink-50 text-berry" : "border-slate-200 bg-white text-slate-600 hover:border-mint"
                }`}
              >
                {interest}
                {active && <Check size={18} />}
              </button>
            );
          })}
        </div>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
          <Sparkles size={16} />
          {selected.length}개 선택됨
        </p>
        <Link href="/">
          <Button>추천 보러가기</Button>
        </Link>
      </div>
    </div>
  );
}
