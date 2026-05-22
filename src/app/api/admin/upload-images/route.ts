import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Service role client — bypasses RLS for bulk admin uploads
// Only instantiated on server-side (lazy to avoid build-time errors)
const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const bucketId = (formData.get('bucket') as string) || 'products';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 files per request. Split into batches.' },
        { status: 400 }
      );
    }

    const results: { name: string; url: string; error?: string }[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `product-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
        const filePath = fileName;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await getSupabaseAdmin().storage
          .from(bucketId)
          .upload(filePath, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          errors.push(`${file.name}: ${uploadError.message}`);
          results.push({ name: file.name, url: '', error: uploadError.message });
          continue;
        }

        const { data: urlData } = getSupabaseAdmin().storage
          .from(bucketId)
          .getPublicUrl(filePath);

        results.push({ name: file.name, url: urlData.publicUrl });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
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
    console.error('[BulkUpload] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
