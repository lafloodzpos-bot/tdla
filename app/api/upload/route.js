import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { ADMIN_PASSWORD } from "@/lib/config";

export async function POST(request) {
  const body = await request.json();
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm"],
          maximumSizeInBytes: 100 * 1024 * 1024,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Upload completed:", blob.url);
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}