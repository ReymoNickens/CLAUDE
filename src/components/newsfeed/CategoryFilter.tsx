'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { PostCategory } from '@/types';

const CATEGORIES: PostCategory[] = ['Academic', 'Events', 'Lost & Found', 'General', 'Urgent'];

const CATEGORY_COLOURS: Record<PostCategory, string> = {
  Academic:      'bg-blue-100 text-blue-800 border-blue-200',
  Events:        'bg-purple-100 text-purple-800 border-purple-200',
  'Lost & Found':'bg-orange-100 text-orange-800 border-orange-200',
  General:       'bg-slate-100 text-slate-700 border-slate-200',
  Urgent:        'bg-red-100 text-red-700 border-red-200',
};

export const CATEGORY_ACTIVE: Record<PostCategory, string> = {
  Academic:      'bg-blue-700 text-white border-blue-700',
  Events:        'bg-purple-700 text-white border-purple-700',
  'Lost & Found':'bg-orange-600 text-white border-orange-600',
  General:       'bg-slate-700 text-white border-slate-700',
  Urgent:        'bg-red-600 text-white border-red-600',
};

interface CategoryFilterProps {
  selected: string | null;
}

export function CategoryFilter({ selected }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setCategory(category: PostCategory | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Filter by category">
      <button
        role="tab"
        aria-selected={!selected}
        onClick={() => setCategory(null)}
        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          !selected
            ? 'bg-[#003087] text-white border-[#003087]'
            : 'bg-background text-muted-foreground border-border hover:bg-muted'
        }`}
      >
        All
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          role="tab"
          aria-selected={selected === cat}
          onClick={() => setCategory(cat)}
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            selected === cat
              ? CATEGORY_ACTIVE[cat]
              : CATEGORY_COLOURS[cat]
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

export function CategoryBadge({ category }: { category: PostCategory }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${CATEGORY_COLOURS[category]}`}>
      {category}
    </span>
  );
}
