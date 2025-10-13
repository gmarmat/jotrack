'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm mb-4" aria-label="Breadcrumb" data-testid="breadcrumb">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight size={16} className="text-gray-400 mx-2" />
          )}
          
          {item.href ? (
            <Link
              href={item.href}
              className="text-blue-600 hover:text-blue-800 hover:underline"
              data-testid={`breadcrumb-link-${index}`}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-700 font-medium" data-testid={`breadcrumb-current-${index}`}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

