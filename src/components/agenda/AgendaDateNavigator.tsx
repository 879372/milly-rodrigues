import { addDays, format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AgendaDateNavigatorProps = {
  date: Date;
  total: number;
  confirmed: number;
  completed: number;
  onDateChange: (date: Date) => void;
};

export function AgendaDateNavigator({ date, total, confirmed, completed, onDateChange }: AgendaDateNavigatorProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-card via-card to-secondary/70 p-4 shadow-soft lg:hidden">
      <Sparkles className="absolute -right-3 -top-3 h-20 w-20 text-accent/10" />
      <div className="relative flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" className="shrink-0 bg-card/65" onClick={() => onDateChange(subDays(date, 1))} aria-label="Dia anterior">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <button type="button" onClick={() => onDateChange(new Date())} className="min-w-0 flex-1 rounded-2xl px-2 py-1 text-center active:bg-card/60">
          <p className="eyebrow mb-1">Agenda do dia</p>
          <p className="font-display truncate text-xl font-semibold capitalize leading-none">{format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
          <p className="mt-1 text-[10px] font-medium text-primary/65">Toque para voltar a hoje</p>
        </button>
        <Button variant="ghost" size="icon" className="shrink-0 bg-card/65" onClick={() => onDateChange(addDays(date, 1))} aria-label="Próximo dia">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <div className="relative mt-4 grid grid-cols-3 divide-x divide-primary/10 rounded-2xl border border-white/70 bg-card/65 px-2 py-2.5 text-center backdrop-blur">
        <div><strong className="font-display block text-xl leading-none">{total}</strong><span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Total</span></div>
        <div><strong className="font-display block text-xl leading-none text-blue-600">{confirmed}</strong><span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Confirmados</span></div>
        <div><strong className="font-display block text-xl leading-none text-emerald-600">{completed}</strong><span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Concluídos</span></div>
      </div>
    </section>
  );
}
