import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || `guest-${Date.now()}`;

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'mp4';
    const filename = `${userId}/${returId || 'temp'}/${Date.now()}.${ext}`;

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('retur-videos')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[upload-video] upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
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
