'use client';

import { useState, useTransition } from 'react';
import { Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PickupRequestModal from '@/app/_components/supplier/logistics/PickupRequestModal';
import { requestPickupAction } from '@/actions/supplier/logistics';

interface Props {
  orderId: string;
  courierName: string;
  warehouseName?: string;
}

export default function PickupRequestModalClient({ orderId, courierName, warehouseName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex-1 md:flex-none px-6 py-2.5 bg-ink text-white text-sm font-medium rounded-md hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
      >
        <Truck size={16} />
        Request Pickup
      </button>

      <PickupRequestModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        orderId={orderId}
        courierName={courierName}
        warehouseName={warehouseName}
        requestAction={requestPickupAction}
        onSuccess={() => {
          // Trigger a lightweight refresh without reloading the page
          router.refresh();
        }}
      />
    </>
  );
}
