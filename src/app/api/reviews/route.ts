import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, rating, reviewText, authorName } = body;

    if (!productId || !rating || !authorName) {
      return NextResponse.json(
        { error: 'Missing required fields (productId, rating, authorName)' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Insert the review into Supabase
    const { data, error } = await supabaseAdmin
      .from('product_reviews')
      .insert([
        {
          product_id: productId,
          rating,
          review_text: reviewText || null,
          author_name: authorName,
          status: 'published',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting review:', error);
      return NextResponse.json(
        { error: 'Failed to submit review' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
