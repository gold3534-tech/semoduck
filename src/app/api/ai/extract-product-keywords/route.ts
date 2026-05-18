import { NextResponse } from "next/server";
import { z } from "zod";
import { extractProductKeywords } from "@/lib/ai";

const schema = z.object({
  title: z.string().optional(),
  content: z.string().optional()
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const result = await extractProductKeywords(`${body.title ?? ""}\n${body.content ?? ""}`);
  return NextResponse.json(result);
}
