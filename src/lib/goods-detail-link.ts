type ExternalGoodsLinkInput = {
  title: string;
  image?: string | null;
  mallName?: string | null;
  price?: number | null;
  url?: string | null;
  category?: string | null;
};

export function externalGoodsDetailHref(input: ExternalGoodsLinkInput) {
  const params = new URLSearchParams();
  params.set("title", input.title);
  if (input.image) params.set("image", input.image);
  if (input.mallName) params.set("mall", input.mallName);
  if (typeof input.price === "number") params.set("price", String(input.price));
  if (input.url) params.set("url", input.url);
  if (input.category) params.set("category", input.category);
  return `/goods/external?${params.toString()}`;
}
