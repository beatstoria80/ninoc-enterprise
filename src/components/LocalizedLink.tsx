"use client";

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function LocalizedLink({ href, children, ...props }: React.ComponentProps<typeof NextLink>) {
  const pathname = usePathname();
  const isEn = pathname?.startsWith('/en');

  let localizedHref = href;
  if (isEn && typeof href === 'string' && href.startsWith('/') && !href.startsWith('/en')) {
    localizedHref = href === '/' ? '/en' : `/en${href}`;
  }

  return (
    <NextLink href={localizedHref} {...props}>
      {children}
    </NextLink>
  );
}
