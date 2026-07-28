import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { apiBadRequest, apiInternalError, apiSuccess } from '@/lib/apiResponse';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('warehouses')
      .select('*')
      .order('is_primary', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet, return fallback warehouses
        return NextResponse.json([
          {
            id: '11111111-1111-1111-1111-111111111111',
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
            id: '22222222-2222-2222-2222-222222222222',
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
      return apiBadRequest(error.message);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return apiInternalError('Failed to fetch warehouses', err?.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, contact_name, contact_phone, contact_phone_2, street_address, district, city, province, postal_code, is_primary } = body;

    if (!name || !code || !contact_phone || !street_address) {
      return apiBadRequest('Name, code, phone, and address are required');
    }

    // If setting as primary, unset other primary warehouses
    if (is_primary) {
      await supabaseAdmin.from('warehouses').update({ is_primary: false }).eq('is_primary', true);
    }

    const { data, error } = await supabaseAdmin
      .from('warehouses')
      .insert({
        name,
        code,
        contact_name: contact_name || 'Logistics Admin',
        contact_phone,
        contact_phone_2: contact_phone_2 || null,
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
      return apiBadRequest(error.message);
    }

    return apiSuccess({ data }, 201);
  } catch (err: any) {
    return apiInternalError('Failed to create warehouse', err?.message);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiBadRequest('ID is required');
    }

    const { error } = await supabaseAdmin
      .from('warehouses')
      .delete()
      .eq('id', id);

    if (error) {
      return apiBadRequest(error.message);
    }

    return apiSuccess({ message: 'Warehouse deleted successfully' });
  } catch (err: any) {
    return apiInternalError('Failed to delete warehouse', err?.message);
  }
}
