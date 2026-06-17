-- Create customer_addresses table
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    address_type VARCHAR(20) DEFAULT 'Home',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    street TEXT,
    house_number VARCHAR(20),
    rt VARCHAR(10),
    rw VARCHAR(10),
    kelurahan VARCHAR(100),
    kecamatan VARCHAR(100),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own addresses"
    ON public.customer_addresses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
    ON public.customer_addresses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
    ON public.customer_addresses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
    ON public.customer_addresses FOR DELETE
    USING (auth.uid() = user_id);

-- Migrate existing addresses from customer_profiles
INSERT INTO public.customer_addresses (
    user_id,
    address_type,
    first_name,
    last_name,
    phone,
    street,
    house_number,
    rt,
    rw,
    kelurahan,
    kecamatan,
    city,
    province,
    postal_code,
    is_default
)
SELECT 
    user_id,
    COALESCE(address_type, 'Home'),
    first_name,
    last_name,
    phone,
    street,
    house_number,
    rt,
    rw,
    kelurahan,
    kecamatan,
    city,
    province,
    postal_code,
    true
FROM public.customer_profiles
WHERE street IS NOT NULL;
