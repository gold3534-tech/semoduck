import { Client } from "@opensearch-project/opensearch";
import type { NormalizedExternalOffer } from "@/lib/external/naver-shopping";

type OfficialProductSearchDoc = {
  id: string;
  title: string;
  image?: string | null;
  brand?: string | null;
  category?: string | null;
  mallName?: string | null;
  price?: number | string | null;
  shippingFee?: number | string | null;
  url?: string | null;
};

const node = process.env.OPENSEARCH_NODE;
const index = process.env.OPENSEARCH_OFFICIAL_PRODUCTS_INDEX || "semoduck-official-products";

let client: Client | null = null;

function getClient() {
  if (!node) return null;
  if (client) return client;
  client = new Client({
    node,
    auth:
      process.env.OPENSEARCH_USERNAME && process.env.OPENSEARCH_PASSWORD
        ? {
            username: process.env.OPENSEARCH_USERNAME,
            password: process.env.OPENSEARCH_PASSWORD
          }
        : undefined,
    ssl: {
      rejectUnauthorized: process.env.OPENSEARCH_REJECT_UNAUTHORIZED !== "false"
    }
  });
  return client;
}

function parsePrice(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function searchOfficialProductsWithOpenSearch(query: string, size = 40): Promise<NormalizedExternalOffer[] | null> {
  const searchClient = getClient();
  if (!searchClient) return null;

  const response = await searchClient.search({
    index,
    size,
    body: {
      query: {
        bool: {
          should: [
            { match_phrase: { title: { query, boost: 100 } } },
            { match: { title: { query, operator: "and", boost: 35 } } },
            { match: { category: { query, boost: 20 } } },
            { match: { tags: { query, boost: 15 } } },
            { match: { brand: { query, boost: 10 } } },
            { match: { description: { query, boost: 6 } } }
          ],
          minimum_should_match: 1
        }
      }
    }
  });

  const hits = response.body.hits.hits ?? [];
  return hits
    .map((hit) => {
      const source = hit._source as OfficialProductSearchDoc | undefined;
      if (!source?.id || !source.title || !source.url) return null;
      return {
        id: source.id,
        title: source.title,
        image: source.image ?? undefined,
        brand: source.brand ?? undefined,
        category: source.category ?? undefined,
        source: "official_shop" as const,
        mallName: source.mallName || "공식샵",
        price: parsePrice(source.price),
        shippingFee: parsePrice(source.shippingFee),
        condition: "new" as const,
        isOfficial: true,
        isUsed: false,
        url: source.url
      };
    })
    .filter(Boolean) as NormalizedExternalOffer[];
}
