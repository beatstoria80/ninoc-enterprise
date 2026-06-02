-- ============================================================
-- NINOC ARCHIVE — FAKE ORDER SEED DATA (QA TESTING)
-- Run in Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  v_product_id_1 UUID;
  v_product_id_2 UUID;
  v_product_name_1 TEXT;
  v_product_name_2 TEXT;
  v_variant_id_1 UUID;
  v_variant_id_2 UUID;
  v_variant_size_1 TEXT;
  v_variant_size_2 TEXT;
  v_order_id_1 UUID;
  v_order_id_2 UUID;
  v_order_id_3 UUID;
  v_order_id_4 UUID;
  v_order_id_5 UUID;
BEGIN

  -- Pick first 2 products from the database
  SELECT id, name INTO v_product_id_1, v_product_name_1 FROM products ORDER BY created_at ASC LIMIT 1;
  SELECT id, name INTO v_product_id_2, v_product_name_2 FROM products ORDER BY created_at ASC OFFSET 1 LIMIT 1;
  
  -- If no second product, reuse the first
  IF v_product_id_2 IS NULL THEN
    v_product_id_2 := v_product_id_1;
    v_product_name_2 := v_product_name_1;
  END IF;
  
  -- If no products exist at all, exit
  IF v_product_id_1 IS NULL THEN
    RAISE NOTICE 'No products found in database. Please add products first.';
    RETURN;
  END IF;

  -- Pick variants with size
  SELECT id, COALESCE(size, 'M') INTO v_variant_id_1, v_variant_size_1 FROM variants WHERE product_id = v_product_id_1 LIMIT 1;
  SELECT id, COALESCE(size, 'M') INTO v_variant_id_2, v_variant_size_2 FROM variants WHERE product_id = v_product_id_2 LIMIT 1;

  -- Generate order UUIDs
  v_order_id_1 := gen_random_uuid();
  v_order_id_2 := gen_random_uuid();
  v_order_id_3 := gen_random_uuid();
  v_order_id_4 := gen_random_uuid();
  v_order_id_5 := gen_random_uuid();

  -- ============================================================
  -- ORDER 1: PAID — Ready to ship (for Print Resi testing)
  -- ============================================================
  INSERT INTO orders (id, user_id, total_price, status, payment_status, midtrans_id, snap_token, courier, tracking_id, shipping_address, created_at, updated_at)
  VALUES (
    v_order_id_1, NULL, 350000, 'paid', 'success', 'NINOC-TEST-001', NULL,
    'JNE REG', 'JNE1234567890',
    jsonb_build_object(
      'name', 'Andi Prasetyo', 'phone', '081234567890',
      'address', 'Jl. Sudirman No. 45, RT 003/RW 012, Kel. Menteng, Kec. Menteng',
      'city', 'Jakarta Pusat', 'province', 'DKI Jakarta', 'postal_code', '10310'
    ),
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'
  );

  INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, size, quantity, price_at_purchase)
  VALUES (gen_random_uuid(), v_order_id_1, v_product_id_1, v_variant_id_1, v_product_name_1, v_variant_size_1, 2, 175000);

  -- ============================================================
  -- ORDER 2: SHIPPED — With tracking
  -- ============================================================
  INSERT INTO orders (id, user_id, total_price, status, payment_status, midtrans_id, snap_token, courier, tracking_id, shipping_address, created_at, updated_at)
  VALUES (
    v_order_id_2, NULL, 520000, 'shipped', 'success', 'NINOC-TEST-002', NULL,
    'SiCepat BEST', 'SICEPAT0098765432',
    jsonb_build_object(
      'name', 'Siti Nurhaliza', 'phone', '087788990011',
      'address', 'Jl. Asia Afrika No. 12, Kel. Braga, Kec. Sumur Bandung',
      'city', 'Bandung', 'province', 'Jawa Barat', 'postal_code', '40111'
    ),
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'
  );

  INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, size, quantity, price_at_purchase)
  VALUES
    (gen_random_uuid(), v_order_id_2, v_product_id_1, v_variant_id_1, v_product_name_1, v_variant_size_1, 1, 175000),
    (gen_random_uuid(), v_order_id_2, v_product_id_2, v_variant_id_2, v_product_name_2, v_variant_size_2, 2, 172500);

  -- ============================================================
  -- ORDER 3: PENDING — Awaiting payment
  -- ============================================================
  INSERT INTO orders (id, user_id, total_price, status, payment_status, midtrans_id, snap_token, courier, tracking_id, shipping_address, created_at, updated_at)
  VALUES (
    v_order_id_3, NULL, 175000, 'pending', 'pending', 'NINOC-TEST-003', 'snap_token_fake_003',
    NULL, NULL,
    jsonb_build_object(
      'name', 'Budi Santoso', 'phone', '085611223344',
      'address', 'Jl. Malioboro No. 88, Kel. Sosromenduran, Kec. Gedongtengen',
      'city', 'Yogyakarta', 'province', 'DI Yogyakarta', 'postal_code', '55271'
    ),
    NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'
  );

  INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, size, quantity, price_at_purchase)
  VALUES (gen_random_uuid(), v_order_id_3, v_product_id_2, v_variant_id_2, v_product_name_2, v_variant_size_2, 1, 175000);

  -- ============================================================
  -- ORDER 4: DELIVERED — Completed order
  -- ============================================================
  INSERT INTO orders (id, user_id, total_price, status, payment_status, midtrans_id, snap_token, courier, tracking_id, shipping_address, created_at, updated_at)
  VALUES (
    v_order_id_4, NULL, 700000, 'delivered', 'success', 'NINOC-TEST-004', NULL,
    'J&T Express', 'JT0011223344',
    jsonb_build_object(
      'name', 'Dewi Lestari', 'phone', '082199887766',
      'address', 'Jl. Pemuda No. 33, Kel. Sekayu, Kec. Semarang Tengah',
      'city', 'Semarang', 'province', 'Jawa Tengah', 'postal_code', '50132'
    ),
    NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days'
  );

  INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, size, quantity, price_at_purchase)
  VALUES (gen_random_uuid(), v_order_id_4, v_product_id_1, v_variant_id_1, v_product_name_1, v_variant_size_1, 4, 175000);

  -- ============================================================
  -- ORDER 5: CANCELLED — Cancelled order
  -- ============================================================
  INSERT INTO orders (id, user_id, total_price, status, payment_status, midtrans_id, snap_token, courier, tracking_id, shipping_address, created_at, updated_at)
  VALUES (
    v_order_id_5, NULL, 175000, 'cancelled', 'expired', 'NINOC-TEST-005', NULL,
    NULL, NULL,
    jsonb_build_object(
      'name', 'Reza Rahardian', 'phone', '089977665544',
      'address', 'Jl. Thamrin No. 77, Kel. Kebon Sirih, Kec. Menteng',
      'city', 'Jakarta Pusat', 'province', 'DKI Jakarta', 'postal_code', '10340'
    ),
    NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'
  );

  INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, size, quantity, price_at_purchase)
  VALUES (gen_random_uuid(), v_order_id_5, v_product_id_2, v_variant_id_2, v_product_name_2, v_variant_size_2, 1, 175000);

  RAISE NOTICE '✅ 5 fake orders created successfully!';
  RAISE NOTICE 'Order 1 (PAID): %', v_order_id_1;
  RAISE NOTICE 'Order 2 (SHIPPED): %', v_order_id_2;
  RAISE NOTICE 'Order 3 (PENDING): %', v_order_id_3;
  RAISE NOTICE 'Order 4 (DELIVERED): %', v_order_id_4;
  RAISE NOTICE 'Order 5 (CANCELLED): %', v_order_id_5;

END $$;

-- ============================================================
-- VERIFICATION: Check the inserted orders
-- ============================================================
SELECT 
  o.id,
  o.status,
  o.payment_status,
  o.total_price,
  o.courier,
  o.tracking_id,
  o.shipping_address->>'name' AS customer_name,
  o.shipping_address->>'city' AS city,
  COUNT(oi.id) AS item_count,
  o.created_at
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.midtrans_id LIKE 'NINOC-TEST-%'
GROUP BY o.id
ORDER BY o.created_at DESC;
