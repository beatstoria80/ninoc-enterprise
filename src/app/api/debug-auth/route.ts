import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getCurrentSupplier } from '@/lib/services/supplier';

export async function GET() {
  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const supplierContext = await getCurrentSupplier();

  return NextResponse.json({
    session: sessionData,
    sessionError,
    user: userData,
    userError,
    supplierContext
  });
}
