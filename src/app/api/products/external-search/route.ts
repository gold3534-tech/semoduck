import { NextResponse } from "next/server";
import { products } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "쿠로미 키링";
  const normalized = products.flatMap((product) =>
    product.offers.map((offer) => ({
      productId: product.id,
      title: product.title,
      query,
      source: offer.source,
      mallName: offer.mallName,
      price: offer.price,
      isOfficial: offer.isOfficial,
      isUsed: offer.isUsed,
      specialBenefit: offer.specialBenefit ?? null,
      url: offer.url
    }))
  );

  return NextResponse.json({ items: normalized });
}
