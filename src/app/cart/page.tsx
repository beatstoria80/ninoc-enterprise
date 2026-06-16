import { Metadata } from 'next';
import CartClient from './CartClient';

export const metadata: Metadata = {
  title: 'Cart | NINOC',
  description: 'Review your selected items before secure checkout.',
};

export default function CartPage() {
  return <CartClient />;
}
