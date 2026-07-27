'use client';

import { useState } from 'react';
import { Truck } from 'lucide-react';
import PickupRequestModal from '@/app/_components/supplier/logistics/PickupRequestModal';

interface Props {
  orderId: string;
  courierName: string;
}

export default function PickupRequestModalClient({ orderId, courierName }: Props) {
  const [isOpen, setIsOpen] = useState(false);

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
        onSuccess={() => {
          // In real scenario, trigger a refresh or optimistically update UI
          window.location.reload();
        }}
      />
    </>
  );
}
