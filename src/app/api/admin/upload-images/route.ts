import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // Max execution limit for Vercel Hobby
export const dynamic = 'force-dynamic';

// Body size limit - 50MB per request
export const maxBodySize = 50 * 1024 * 1024;

const getSupabaseAdmin = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(url, key);
};

import { createClient as createServerClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  // CORS headers for local development
  const origin = request.headers.get('origin') || '*';

  try {
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access. Authentication required.' }, { status: 401 });
    }
    // Validate environment variables FIRST
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_SUPABASE_URL' },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const bucketId = (formData.get('bucket') as string) || 'products';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 files per batch' },
        { status: 400 }
      );
    }

    // Validate each file size (max 10MB per file)
    const maxFileSize = 10 * 1024 * 1024;
    for (const file of files) {
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Max 10MB per file.` },
          { status: 413 }
        );
      }
    }

    const supabaseAdmin = getSupabaseAdmin();
    const results: { name: string; url: string; error?: string }[] = [];

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `product-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from(bucketId)
          .upload(fileName, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          console.error(`[Upload] Error uploading ${file.name}:`, uploadError);
          results.push({
            name: file.name,
            url: '',
            error: uploadError.message || 'Upload failed'
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from(bucketId)
          .getPublicUrl(fileName);

        results.push({
          name: file.name,
          url: urlData.publicUrl,
          error: undefined
        });
      } catch (err) {
        console.error(`[Upload] Exception uploading ${file.name}:`, err);
        results.push({
          name: file.name,
          url: '',
          error: err instanceof Error ? err.message : 'Upload failed'
        });
      }
    }

    const uploaded = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;

    return NextResponse.json({
      results,
      summary: { total: files.length, uploaded, failed },
      errors: failed > 0 ? results.filter(r => r.error).map(r => r.error) : undefined
    });

  } catch (err) {
    console.error('[Upload] Fatal error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
