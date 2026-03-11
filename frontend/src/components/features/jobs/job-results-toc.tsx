'use client';

import { GenerationResult } from '@/types';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface JobResultsTocProps {
  results: GenerationResult[];
}

export function JobResultsToc({ results }: JobResultsTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            return;
          }
        }
      },
      { rootMargin: '-25% 0px -75% 0px' } 
    );

    const elements = results.map((result) => document.getElementById(`result-${result.id}`)).filter(Boolean);
    elements.forEach((el) => observer.observe(el!));

    return () => {
      elements.forEach((el) => observer.unobserve(el!));
    };
  }, [results]);

  if (!results || results.length === 0) {
    return null;
  }

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="sticky top-24"> 
      <h4 className="font-semibold mb-4 text-sm uppercase text-muted-foreground">页面导航</h4>
      <ul className="space-y-2">
        {results.map((result) => {
          const id = `result-${result.id}`;
          return (
            <li key={result.id}>
              <a
                href={`#${id}`}
                onClick={(e) => handleScroll(e, id)}
                className={cn(
                  'block text-sm text-muted-foreground hover:text-foreground transition-all duration-200 ease-in-out border-l-2 border-transparent pl-4',
                  activeId === id ? 'text-primary font-semibold border-primary' : 'hover:border-gray-400'
                )}
              >
                {result.prompt_name}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
