import { redirect } from 'next/navigation';
import { SupplierService } from '@/lib/services/SupplierService';
import LogisticsTableClient from './LogisticsTableClient';

export const metadata = {
  title: 'Logistics & Packing - Supplier Hub | NINOC',
};

export default async function SupplierLogisticsPage() {
  const supplierService = new SupplierService();
  const supplierUser = await supplierService.getCurrentSupplierContext();

  if (!supplierUser) {
    redirect('/supplier/apply');
  }

  // Uses Clean Architecture: Controller -> Service -> Repository -> Database
  const orders = await supplierService.getLogisticsOrders(supplierUser.supplier_id);

  return (
    <LogisticsTableClient orders={orders} />
  );
}
