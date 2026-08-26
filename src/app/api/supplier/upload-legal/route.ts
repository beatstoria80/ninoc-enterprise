import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // Max execution limit for Vercel Hobby

// Body size limit - 50MB per request
export const maxBodySize = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, key);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const docType = formData.get('type') as string; // 'ktp', 'npwp', 'nib'

    if (!file || !docType) {
      return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
    }

    // Max 10MB per file
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 413 });
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    // Validate extensions (only allow images and pdfs)
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(fileExt)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, JPG, PNG allowed.' }, { status: 400 });
    }

    const fileName = `legal-${docType}-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to private bucket 'supplier_documents'
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('supplier_documents')
      .upload(fileName, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('[Upload Legal] Error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Return the internal path (not a public URL, since it's private)
    return NextResponse.json({ path: uploadData.path });

  } catch (err) {
    console.error('[Upload Legal] Fatal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
