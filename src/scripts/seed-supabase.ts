const supabaseUrl = 'https://esiapizmdpylhotojfij.supabase.co';
const supabaseKey = 'sb_secret_lgQSADU1uxEYfQU43QG8SQ_0HSmSkp6';

async function seed() {
  console.log('Seeding products with NEW structure via REST API...');

  const products = [
    // FASHION
    {
      name: 'ARTISTIC GRAPHIC TEE - V1',
      slug: 'artistic-graphic-tee-v1',
      description: 'Kaos artistik dengan desain grafis eksklusif untuk seluruh keluarga.',
      price: 350000,
      category: 'fashion',
      sub_category: 'tshirts_graphic',
      is_featured: true,
      image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop'
    },
    {
      name: 'PREMIUM OUTERWEAR HOODIE',
      slug: 'premium-outerwear-hoodie',
      description: 'Hoodie fungsional untuk mobilitas tinggi.',
      price: 750000,
      category: 'fashion',
      sub_category: 'outerwear',
      is_featured: false,
      image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop'
    },
    // ACCESSORIES
    {
      name: 'URBAN TOTE BAG - ART EDITION',
      slug: 'urban-tote-bag-art',
      description: 'Tas belanja artistik yang cocok untuk gaya harian.',
      price: 150000,
      category: 'accessories',
      sub_category: 'tote_bags',
      is_featured: true,
      image_url: 'https://images.unsplash.com/photo-1544816153-199d88248314?q=80&w=800&auto=format&fit=crop'
    },
    // UTILITIES
    {
      name: 'NINOC MATTE TUMBLER',
      slug: 'ninoc-matte-tumbler',
      description: 'Wadah minum (Tumbler) harian fungsional.',
      price: 250000,
      category: 'utilities',
      sub_category: 'drinkware',
      is_featured: true,
      image_url: 'https://images.unsplash.com/photo-1517254456976-ee8682099819?q=80&w=800&auto=format&fit=crop'
    }
  ];

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/products`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(products)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error seeding products:', errorText);
    } else {
      console.log('Successfully seeded NEW products!');
    }
  } catch (err) {
    console.error('Exception during seeding:', err);
  }
}

seed();
