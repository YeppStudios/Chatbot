"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircleIcon, FileText } from 'lucide-react';

const Navigation = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-16 right-4 flex flex-col gap-2 z-50">
      <div className="bg-white shadow-lg rounded-full p-1">
        {pathname !== '/conversations-history' && (
          <Link 
            href="/conversations-history"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-200 hover:bg-purple-300 text-purple-700 transition-colors"
            title="Conversations History"
          >
            <MessageCircleIcon size={22} />
          </Link>
        )}
        {pathname !== '/pdf-management' && (
          <Link 
            href="/pdf-management"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-200 hover:bg-purple-300 text-purple-700 transition-colors"
            title="PDF Management"
          >
            <FileText size={22} />
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 