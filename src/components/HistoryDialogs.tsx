import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Scissors, User } from 'lucide-react';
import { useInfiniteScroll, getNextPageParam, type Paginated } from '@/hooks/useInfiniteScroll';

const PAGE_SIZE = 20;

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    typeof value === 'string' ? parseFloat(value || '0') : value
  );

const methodLabels: Record<string, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  credit: 'Crédito',
  debit: 'Débito',
  transfer: 'Transferência',
};

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-500/10 text-blue-500' },
  completed: { label: 'Concluído', color: 'bg-green-500/10 text-green-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-500' },
  no_show: { label: 'Faltou', color: 'bg-gray-500/10 text-gray-500' },
};

type Sale = {
  id: number;
  client_name: string;
  created_at: string;
  total_price: string;
  discount: string;
  total_paid: number;
  appointment: number | null;
  items: { id: number; product_name: string; quantity: number; unit_price: string; total_price: string }[];
  payments: { id: number; method: string; amount: string }[];
};

type Appointment = {
  id: number;
  client_name: string;
  barber_name: string;
  service_name: string;
  date_time: string;
  status: string;
  total_price: string;
};

function ListFooter({
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  count,
  emptyLabel,
  sentinelRef,
}: {
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  count: number;
  emptyLabel: string;
  sentinelRef: (node: HTMLElement | null) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
      </div>
    );
  }
  if (count === 0) {
    return <div className="text-center py-16 text-muted-foreground italic">{emptyLabel}</div>;
  }
  return (
    <div ref={sentinelRef} className="flex items-center justify-center py-4 text-xs text-muted-foreground">
      {isFetchingNextPage ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando mais...
        </>
      ) : hasNextPage ? (
        'Role para ver mais'
      ) : (
        'Fim da lista'
      )}
    </div>
  );
}

export function SalesHistoryDialog({
  open,
  onOpenChange,
  params,
  title = 'Histórico de Vendas de Produtos',
  description = 'Vendas de produtos registradas no período.',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  params: string;
  title?: string;
  description?: string;
}) {
  const query = useInfiniteQuery({
    queryKey: ['sales-history', params],
    queryFn: async ({ pageParam }) =>
      (await api.get<Paginated<Sale>>(`/sales/?${params}&page=${pageParam}&page_size=${PAGE_SIZE}`)).data,
    initialPageParam: 1,
    getNextPageParam,
    enabled: open,
  });

  const sales = query.data?.pages.flatMap((p) => p.results) ?? [];
  const totalCount = query.data?.pages[0]?.count ?? 0;
  const totalValue = sales.reduce((acc, s) => acc + parseFloat(s.total_price || '0'), 0);

  const sentinelRef = useInfiniteScroll({
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" /> {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {!query.isLoading && sales.length > 0 && (
          <div className="flex items-center justify-between px-1 text-sm">
            <span className="text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'venda' : 'vendas'}
            </span>
            <span className="font-bold">{formatCurrency(totalValue)}{query.hasNextPage ? '+' : ''}</span>
          </div>
        )}

        <div className="space-y-3">
          {sales.map((sale) => {
            const expected = parseFloat(sale.total_price || '0') - parseFloat(sale.discount || '0');
            const isFiado = sale.total_paid < expected - 0.01;
            return (
              <div key={sale.id} className="rounded-xl border border-border/50 bg-background p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{sale.client_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(sale.created_at), "dd/MM/yyyy 'às' HH:mm")}
                        {sale.appointment ? ' • vinculada a agendamento' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black">{formatCurrency(sale.total_price)}</p>
                    {isFiado && <span className="text-[10px] font-bold text-amber-500 uppercase">Fiado</span>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {sale.items.map((it) => (
                    <span key={it.id} className="text-[11px] bg-muted/50 rounded-md px-2 py-0.5">
                      {it.quantity}x {it.product_name}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  {parseFloat(sale.discount || '0') > 0 && <span>Desconto: {formatCurrency(sale.discount)}</span>}
                  {sale.payments.map((p) => (
                    <Badge key={p.id} variant="outline" className="text-[10px] h-5 font-medium">
                      {methodLabels[p.method] || p.method}: {formatCurrency(p.amount)}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <ListFooter
          isLoading={query.isLoading}
          isFetchingNextPage={query.isFetchingNextPage}
          hasNextPage={query.hasNextPage}
          count={sales.length}
          emptyLabel="Nenhuma venda de produto neste período."
          sentinelRef={sentinelRef}
        />
      </DialogContent>
    </Dialog>
  );
}

export function AppointmentsHistoryDialog({
  open,
  onOpenChange,
  params,
  title = 'Agendamentos',
  description = 'Lista de agendamentos do período.',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  params: string;
  title?: string;
  description?: string;
}) {
  const query = useInfiniteQuery({
    queryKey: ['appointments-history', params],
    queryFn: async ({ pageParam }) =>
      (await api.get<Paginated<Appointment>>(`/appointments/?${params}&page=${pageParam}&page_size=${PAGE_SIZE}`)).data,
    initialPageParam: 1,
    getNextPageParam,
    enabled: open,
  });

  const appointments = query.data?.pages.flatMap((p) => p.results) ?? [];
  const totalCount = query.data?.pages[0]?.count ?? 0;
  const totalValue = appointments.reduce((acc, a) => acc + parseFloat(a.total_price || '0'), 0);

  const sentinelRef = useInfiniteScroll({
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-blue-500" /> {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {!query.isLoading && appointments.length > 0 && (
          <div className="flex items-center justify-between px-1 text-sm">
            <span className="text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'agendamento' : 'agendamentos'}
            </span>
            <span className="font-bold">{formatCurrency(totalValue)}{query.hasNextPage ? '+' : ''}</span>
          </div>
        )}

        <div className="space-y-2">
          {appointments.map((a) => {
            const st = statusMap[a.status] || { label: a.status, color: 'bg-muted text-muted-foreground' };
            return (
              <div key={a.id} className="rounded-xl border border-border/50 bg-background p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate">{a.client_name}</p>
                    <Badge variant="outline" className={`text-[10px] h-5 uppercase ${st.color} border-none`}>
                      {st.label}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {a.service_name} • {a.barber_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(a.date_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <p className="text-sm font-black shrink-0">{formatCurrency(a.total_price)}</p>
              </div>
            );
          })}
        </div>

        <ListFooter
          isLoading={query.isLoading}
          isFetchingNextPage={query.isFetchingNextPage}
          hasNextPage={query.hasNextPage}
          count={appointments.length}
          emptyLabel="Nenhum agendamento neste período."
          sentinelRef={sentinelRef}
        />
      </DialogContent>
    </Dialog>
  );
}
