import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Scissors, DollarSign, Package, Settings, LogOut, Menu, History, Loader2, ShieldAlert, MoreHorizontal } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BrandMark } from '@/components/BrandMark';

function ForcePasswordChange() {
  const { user, setUser, logout } = useAuthStore();
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user?.must_change_password) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) return toast.error('Mínimo de 8 caracteres.');
    if (pwd !== pwd2) return toast.error('As senhas não coincidem.');
    setLoading(true);
    try {
      await api.post('/users/change_password/', { new_password: pwd });
      const me = await api.get('/users/me/');
      setUser(me.data);
      toast.success('Senha definida com sucesso.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao definir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4">
      <form onSubmit={submit} className="max-w-sm w-full bg-card border border-border rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center gap-2 text-primary">
          <ShieldAlert className="w-5 h-5" />
          <h2 className="text-lg font-bold">Defina uma nova senha</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Sua conta usa uma senha provisória. Escolha uma senha pessoal para continuar.
        </p>
        <Input type="password" placeholder="Nova senha" value={pwd} onChange={(e) => setPwd(e.target.value)} className="h-11" />
        <Input type="password" placeholder="Repita a nova senha" value={pwd2} onChange={(e) => setPwd2(e.target.value)} className="h-11" />
        <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar senha
        </Button>
        <button type="button" onClick={logout} className="w-full text-xs text-muted-foreground hover:text-foreground">
          Sair
        </button>
      </form>
    </div>
  );
}

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Agenda', path: '/agenda' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: Scissors, label: 'Serviços', path: '/servicos' },
  { icon: DollarSign, label: 'Financeiro', path: '/financeiro', adminOnly: true },
  { icon: Package, label: 'Produtos', path: '/produtos' },
  { icon: Users, label: 'Profissionais', path: '/profissionais', adminOnly: true },
  { icon: History, label: 'Histórico', path: '/historico', adminOnly: true },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

const mobilePrimaryItems = sidebarItems.slice(0, 3);

type SidebarContentProps = {
  userRole?: string;
  onNavigate: () => void;
  onLogout: () => void;
};

function SidebarContent({ userRole, onNavigate, onLogout }: SidebarContentProps) {
  return (
    <>
      <div className="flex h-20 items-center border-b border-border/50 px-5">
        <BrandMark />
      </div>
      <div className="px-5 pb-2 pt-5"><span className="eyebrow">Seu espaço</span></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {sidebarItems.map((item) => {
          if (item.adminOnly && userRole !== 'admin') return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[0_12px_25px_-16px_hsl(var(--primary)/.9)]'
                    : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                }`
              }
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-current/5 group-hover:bg-current/10">
                <Icon className="h-4.5 w-4.5" />
              </span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-border/50 p-4">
        <button onClick={onLogout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
          <LogOut className="h-5 w-5" /> Sair
        </button>
      </div>
    </>
  );
}

export default function DashboardLayout() {
  const { user, logout, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Sincroniza o usuário persistido com o servidor (papel, must_change_password).
  useEffect(() => {
    api.get('/users/me/').then((res) => setUser(res.data)).catch(() => {});
  }, [setUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitial = user?.first_name ? user.first_name[0] : (user?.username ? user.username[0] : 'U');
  const currentPage = sidebarItems.find((item) => location.pathname.startsWith(item.path))?.label || 'Painel';

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <ForcePasswordChange />
      {/* Sidebar for Desktop */}
      <aside className="hidden w-[17.5rem] flex-col border-r border-border/60 bg-card/80 backdrop-blur-xl md:flex">
        <SidebarContent userRole={user?.role} onNavigate={() => setOpen(false)} onLogout={handleLogout} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-card/75 px-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10" aria-label="Abrir menu">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[18rem] flex-col bg-card p-0">
                <SidebarContent userRole={user?.role} onNavigate={() => setOpen(false)} onLogout={handleLogout} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <p className="eyebrow hidden sm:block">Milly Gestão</p>
              <h2 className="font-display truncate text-xl font-semibold leading-none sm:text-2xl">{currentPage}</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              Olá, {user?.first_name || user?.username}
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-sm font-bold uppercase text-primary-foreground shadow-soft">
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="relative flex-1 overflow-auto scroll-smooth p-3 pb-28 sm:p-6 md:pb-6 lg:p-8">
          <div className="relative z-10 mx-auto w-full max-w-[1480px]"><Outlet /></div>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 px-2 pt-2 shadow-[0_-10px_30px_-20px_rgba(43,33,28,.45)] backdrop-blur-xl safe-bottom md:hidden" aria-label="Navegação principal">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
            {mobilePrimaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Abrir mais opções"
              className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold text-muted-foreground transition-colors active:bg-muted"
            >
              <MoreHorizontal className="h-5 w-5" />
              Mais
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
}
