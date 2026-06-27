import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 60;

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('video') as File | null;
    const returId = formData.get('retur_id') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only MP4 and WebM files are allowed' }, { status: 400 });
    }

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 50MB' }, { status: 400 });
    }

    // Get current user via server-side cookie session (browser client won't work in API routes)
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    const userId = user?.id || `guest-${Date.now()}`;

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'mp4';
    const filename = `${userId}/${returId || 'temp'}/${Date.now()}.${ext}`;

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload via adminClient to bypass RLS on storage bucket
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('retur-videos')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[upload-video] upload error:', uploadError);
      return NextResponse.json({ error: 'Gagal upload video. Pastikan bucket "retur-videos" sudah dibuat di Supabase.' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from('retur-videos')
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      video_url: urlData.publicUrl,
      filename: uploadData.path,
    });
  } catch (err) {
    console.error('[POST /api/retur/upload-video]', err);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
}
