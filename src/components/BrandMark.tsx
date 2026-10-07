import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
};

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_30px_-12px_hsl(var(--primary)/.75)]">
        <span className="font-display text-lg font-semibold tracking-tight">MR</span>
        <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-card p-0.5 text-accent" />
      </div>
      {!compact && (
        <div className="min-w-0 leading-none">
          <p className="font-display truncate text-xl font-semibold tracking-tight text-foreground">Milly Rodrigues</p>
          <p className="mt-1 truncate text-[9px] font-semibold uppercase tracking-[0.24em] text-primary/70">Depilação &amp; Estética</p>
        </div>
      )}
    </div>
  );
}
