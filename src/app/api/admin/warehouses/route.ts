import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    const { data, error } = await adminClient
      .from('warehouses')
      .select('*')
      .order('is_primary', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet, return fallback warehouses
        return NextResponse.json([
          {
            id: 'wh-1',
            name: 'Gudang Utama NINOC (Apparel & Goods)',
            code: 'WH-BANDUNG-01',
            contact_name: 'NINOC Logistics',
            contact_phone: '+628211983774',
            street_address: 'Kompleks Griya Saluyu, Blok AA No.87',
            district: 'Mekarjaya, Rancasari',
            city: 'Kota Bandung',
            province: 'Jawa Barat',
            postal_code: '40292',
            is_primary: true,
            is_active: true
          },
          {
            id: 'wh-2',
            name: 'NINOC Pantry Roastery Hub (F&B)',
            code: 'WH-BANDUNG-FB',
            contact_name: 'NINOC Roastery',
            contact_phone: '+628211983774',
            street_address: 'Kompleks Griya Saluyu, Blok AA No.87',
            district: 'Mekarjaya, Rancasari',
            city: 'Kota Bandung',
            province: 'Jawa Barat',
            postal_code: '40292',
            is_primary: false,
            is_active: true
          }
        ]);
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, contact_name, contact_phone, street_address, district, city, province, postal_code, is_primary } = body;

    if (!name || !code || !contact_phone || !street_address) {
      return NextResponse.json({ error: 'Name, code, phone, and address are required' }, { status: 400 });
    }

    // If setting as primary, unset other primary warehouses
    if (is_primary) {
      await adminClient.from('warehouses').update({ is_primary: false }).eq('is_primary', true);
    }

    const { data, error } = await adminClient
      .from('warehouses')
      .insert({
        name,
        code,
        contact_name: contact_name || 'Logistics Admin',
        contact_phone,
        street_address,
        district: district || 'Bandung',
        city: city || 'Kota Bandung',
        province: province || 'Jawa Barat',
        postal_code: postal_code || '40292',
        is_primary: Boolean(is_primary)
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await adminClient
      .from('warehouses')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
