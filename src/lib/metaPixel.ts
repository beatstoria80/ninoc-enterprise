export const trackViewContent = (
  productId: string,
  productName: string,
  price: number
) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'ViewContent', {
      content_ids: [productId],
      content_name: productName,
      content_type: 'product',
      value: price,
      currency: 'IDR',
    });
  }
};

export const trackAddToCart = (
  productId: string,
  productName: string,
  price: number,
  quantity: number
) => {
  if (typeof window !== 'undefined') {
    if ((window as any).fbq) {
      (window as any).fbq('track', 'AddToCart', {
        content_ids: [productId],
        content_name: productName,
        content_type: 'product',
        value: price * quantity,
        currency: 'IDR',
        num_items: quantity,
      });
    }

    // Google Ads / GA4 DataLayer
    const dataLayer = (window as any).dataLayer = (window as any).dataLayer || [];
    dataLayer.push({
      event: 'add_to_cart',
      ecommerce: {
        currency: 'IDR',
        value: price * quantity,
        items: [
          {
            item_id: productId,
            item_name: productName,
            price: price,
            quantity: quantity
          }
        ]
      }
    });
  }
};

export const trackPurchase = (
  orderId: string,
  totalValue: number,
  items: Array<{ id: string; quantity: number }>
) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    const contentIds = items.map((item) => item.id);
    const numItems = items.reduce((sum, item) => sum + item.quantity, 0);

    (window as any).fbq('track', 'Purchase', {
      content_ids: contentIds,
      content_type: 'product',
      value: totalValue,
      currency: 'IDR',
      num_items: numItems,
      order_id: orderId,
    });
  }
};
