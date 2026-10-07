import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, CheckCircle2, Target, Cake } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { SalesHistoryDialog, AppointmentsHistoryDialog } from '@/components/HistoryDialogs';
import { PageHeader } from '@/components/PageHeader';

type DashboardData = {
  total_appointments: number;
  completed_appointments: number;
  predicted_revenue: number;
  completed_revenue: number;
  service_revenue: number;
  product_revenue: number;
  daily_goal: number;
  progress_percentage: number;
};

type BirthdayData = {
  today: any[];
  week: any[];
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [openModal, setOpenModal] = useState<'appointments' | 'products' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await api.get<DashboardData>('/dashboard-summary/');
      return res.data;
    },
  });

  const { data: bdays } = useQuery({
    queryKey: ['birthdays'],
    queryFn: async () => {
      const res = await api.get<BirthdayData>('/users/birthdays/');
      return res.data;
    },
  });

  const cards = [
    {
      title: 'Serviços Hoje',
      value: `${data?.completed_appointments || 0}/${data?.total_appointments || 0}`,
      subtitle: `${(data?.total_appointments || 0) - (data?.completed_appointments || 0)} pendentes`,
      icon: Calendar,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      onClick: () => setOpenModal('appointments'),
    },
    {
      title: 'Venda de Produtos',
      value: formatCurrency(data?.product_revenue || 0),
      subtitle: 'Total em produtos hoje',
      icon: TrendingUp,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      onClick: () => setOpenModal('products'),
    },
    {
      title: 'Faturamento Total',
      value: formatCurrency(data?.completed_revenue || 0),
      subtitle: `${formatCurrency(data?.service_revenue || 0)} em serviços`,
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
  ] as {
    title: string;
    value: string;
    subtitle: string;
    icon: typeof Calendar;
    color: string;
    bg: string;
    onClick?: () => void;
  }[];

  return (
    <div className="space-y-5 sm:space-y-8">
      <PageHeader eyebrow="Hoje no estúdio" title="Visão geral" description="Acompanhe o ritmo dos atendimentos, o faturamento e os próximos momentos importantes." />

      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={index}
              onClick={card.onClick}
              onKeyDown={(event) => {
                if (card.onClick && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  card.onClick();
                }
              }}
              role={card.onClick ? 'button' : undefined}
              tabIndex={card.onClick ? 0 : undefined}
              className={`relative overflow-hidden transition-all ${index === 2 ? 'col-span-2 lg:col-span-1' : ''} ${
                card.onClick ? 'cursor-pointer hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift' : ''
              }`}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                {card.onClick && (
                  <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-widest">Clique para ver histórico</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-4 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Target className="w-5 h-5 text-primary" />
              Meta Diária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Progresso do faturamento</p>
                <div className="text-4xl font-black">
                  {(data?.progress_percentage || 0).toFixed(1)}%
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-bold">Meta: {formatCurrency(data?.daily_goal || 0)}</p>
                <p className="text-xs text-muted-foreground">Falta: {formatCurrency(Math.max(0, (data?.daily_goal || 0) - (data?.completed_revenue || 0)))}</p>
              </div>
            </div>
            <Progress value={data?.progress_percentage} className="h-3" />
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold">Status da Meta</p>
                <p className="text-xs text-muted-foreground">
                  {data?.progress_percentage && data.progress_percentage >= 100 
                    ? 'Parabéns! Meta batida com sucesso! 🚀' 
                    : 'Mantenha o foco! Você está avançando rumo à meta.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Cake className="w-5 h-5 text-pink-500" />
              Aniversariantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider border-b border-border/50 pb-1">Hoje</h4>
              {bdays?.today.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-2">Nenhum hoje</p>
              ) : (
                bdays?.today.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-pink-500/5 border border-pink-500/10">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{user.first_name || user.username}</span>
                      <span className="text-[10px] text-pink-500/70 font-medium">Parabéns! 🎂</span>
                    </div>
                    <Cake className="w-4 h-4 text-pink-500" />
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider border-b border-border/50 pb-1">Próximos 7 dias</h4>
              {bdays?.week.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-2">Nenhum nos próximos dias</p>
              ) : (
                bdays?.week.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/5">
                    <span className="text-sm font-medium">{user.first_name || user.username}</span>
                    <Badge variant="outline" className="text-[10px] border-slate-200">
                      {user.birth_date ? format(new Date(user.birth_date + 'T00:00:00'), 'dd/MM') : '--'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AppointmentsHistoryDialog
        open={openModal === 'appointments'}
        onOpenChange={(o) => setOpenModal(o ? 'appointments' : null)}
        params={`date_time__date=${today}&ordering=date_time`}
        title="Agendamentos de Hoje"
        description={`Agendamentos do dia ${format(new Date(), 'dd/MM/yyyy')}.`}
      />
      <SalesHistoryDialog
        open={openModal === 'products'}
        onOpenChange={(o) => setOpenModal(o ? 'products' : null)}
        params={`created_at__date=${today}&ordering=-created_at`}
        title="Vendas de Produtos de Hoje"
        description={`Vendas de produtos do dia ${format(new Date(), 'dd/MM/yyyy')}.`}
      />
    </div>
  );
}
