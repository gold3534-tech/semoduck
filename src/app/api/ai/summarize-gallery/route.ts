import { NextResponse } from "next/server";
import { z } from "zod";
import { summarizeGallery } from "@/lib/ai";

const schema = z.object({
  posts: z.array(z.string()).default([])
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const result = await summarizeGallery(body.posts.join("\n"));
  return NextResponse.json(result);
}
