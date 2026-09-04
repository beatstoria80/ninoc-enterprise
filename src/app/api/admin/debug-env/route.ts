import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING_URL';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT_ANON' : 'MISSING_ANON';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT_SERVICE_ROLE' : 'MISSING_SERVICE_ROLE';
    const nodeEnv = process.env.NODE_ENV;

    // Test a direct query using the raw client (bypassing any Next.js abstractions)
    let directQuerySuccess = false;
    let productsCount = -1;
    let productsError = null;
    let firstProduct = null;

    if (url !== 'MISSING_URL' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false },
          global: {
            fetch: (url: RequestInfo | URL, options?: RequestInit) => {
              return fetch(url.toString(), { ...options, cache: 'no-store' });
            }
          }
        });

        const { data, error } = await supabase
          .from('products')
          .select('*, variants(*), suppliers(name)')
          .order('created_at', { ascending: false });

        if (error) {
          productsError = error;
        } else {
          directQuerySuccess = true;
          productsCount = data ? data.length : 0;
          if (data && data.length > 0) {
            firstProduct = data[0].name;
          }
        }
      } catch (err: any) {
        productsError = err.message;
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: nodeEnv,
        SUPABASE_URL: url,
        SUPABASE_URL_MATCHES_PROD: url === 'https://esiapizmdpylhotojfij.supabase.co',
        SUPABASE_ANON_KEY_STATUS: anonKey,
        SUPABASE_SERVICE_ROLE_KEY_STATUS: serviceRoleKey,
      },
      directQueryTest: {
        success: directQuerySuccess,
        productsCount: productsCount,
        firstProductName: firstProduct,
        error: productsError
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
