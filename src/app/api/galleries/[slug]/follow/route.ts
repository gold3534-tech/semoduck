import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "갤러리 주소가 없습니다." },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase 클라이언트를 생성하지 못했습니다." },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { data: gallery, error: galleryError } = await supabase
      .from("galleries")
      .select("id, follower_count")
      .eq("slug", slug)
      .single();

    if (galleryError || !gallery) {
      return NextResponse.json(
        { error: "갤러리를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from("gallery_follows")
      .select("id")
      .eq("gallery_id", gallery.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    if (existing) {
      const { error: deleteError } = await supabase
        .from("gallery_follows")
        .delete()
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (deleteError) {
        return NextResponse.json(
          { error: deleteError.message },
          { status: 500 }
        );
      }

      const { error: rpcError } = await supabase.rpc(
        "recalculate_gallery_follower_count",
        {
          target_gallery_id: gallery.id
        }
      );

      if (rpcError) {
        return NextResponse.json(
          { error: rpcError.message },
          { status: 500 }
        );
      }

      const { data: updatedGallery } = await supabase
        .from("galleries")
        .select("follower_count")
        .eq("id", gallery.id)
        .single();

      return NextResponse.json({
        followed: false,
        followerCount: updatedGallery?.follower_count ?? 0
      });
    }

    const { error: insertError } = await supabase
      .from("gallery_follows")
      .insert({
        gallery_id: gallery.id,
        user_id: user.id
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const { error: rpcError } = await supabase.rpc(
      "recalculate_gallery_follower_count",
      {
        target_gallery_id: gallery.id
      }
    );

    if (rpcError) {
      return NextResponse.json(
        { error: rpcError.message },
        { status: 500 }
      );
    }

    const { data: updatedGallery } = await supabase
      .from("galleries")
      .select("follower_count")
      .eq("id", gallery.id)
      .single();

    return NextResponse.json({
      followed: true,
      followerCount: updatedGallery?.follower_count ?? 0
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "갤러리 팔로우 처리에 실패했습니다."
      },
      { status: 500 }
    );
  }
}