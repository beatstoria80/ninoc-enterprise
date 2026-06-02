import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const getSupabaseAdmin = (): SupabaseClient => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  let supabaseAdmin: SupabaseClient | null = null;

  // Validate environment variables first
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error: Missing Supabase credentials' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const bucketId = (formData.get('bucket') as string) || 'products';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 files per batch. Please split your selection.' },
        { status: 400 }
      );
    }

    supabaseAdmin = getSupabaseAdmin();
    const results: { name: string; url: string; error?: string }[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `product-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
        const filePath = fileName;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
          .from(bucketId)
          .upload(filePath, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          const errorMsg = uploadError.message || 'Upload failed';
          console.error(`[BulkUpload] ${file.name}: ${errorMsg}`);
          errors.push(`${file.name}: ${errorMsg}`);
          results.push({ name: file.name, url: '', error: errorMsg });
          continue;
        }

        const { data: urlData } = supabaseAdmin.storage
          .from(bucketId)
          .getPublicUrl(filePath);

        results.push({ name: file.name, url: urlData.publicUrl });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        console.error(`[BulkUpload] ${file.name}: ${msg}`);
        errors.push(`${file.name}: ${msg}`);
        results.push({ name: file.name, url: '', error: msg });
      }
    }

    const uploaded = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;

    return NextResponse.json({
      results,
      summary: { total: files.length, uploaded, failed },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('[BulkUpload] Fatal error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { error: message, details: 'Check server logs for more information' },
      { status: 500 }
    );
  }
}
