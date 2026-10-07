import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useAuthStore } from './lib/store';

const DashboardLayout = lazy(() => import('./pages/DashboardLayout'));
const Home = lazy(() => import('./pages/Home'));
const BookingPortal = lazy(() => import('./pages/BookingPortal'));
const CheckoutReturn = lazy(() => import('./pages/CheckoutReturn'));
const Customers = lazy(() => import('./pages/Customers'));
const Services = lazy(() => import('./pages/Services'));
const Products = lazy(() => import('./pages/Products'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Financeiro = lazy(() => import('./pages/Financeiro'));
const Settings = lazy(() => import('./pages/Settings'));
const Profissionais = lazy(() => import('./pages/Profissionais'));
const Historico = lazy(() => import('./pages/Historico'));
const MyAppointments = lazy(() => import('./pages/MyAppointments'));

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const RequireRole = ({ roles, children }: { roles: string[]; children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return roles.includes(user.role) ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

import { Toaster } from 'sonner';

function PageLoader() {
  return (
    <div className="grid min-h-[40dvh] place-items-center">
      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-5 py-3 text-sm text-muted-foreground shadow-soft backdrop-blur">
        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Preparando seu espaço...
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" expand={false} richColors />
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agendar" element={<BookingPortal />} />
        <Route path="/agendar/pagamento" element={<CheckoutReturn />} />
        <Route path="/meus-agendamentos" element={<MyAppointments />} />
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="clientes" element={<Customers />} />
          <Route path="servicos" element={<Services />} />
          <Route path="financeiro" element={<RequireRole roles={['admin']}><Financeiro /></RequireRole>} />
          <Route path="produtos" element={<Products />} />
          <Route path="profissionais" element={<RequireRole roles={['admin']}><Profissionais /></RequireRole>} />
          <Route path="historico" element={<RequireRole roles={['admin']}><Historico /></RequireRole>} />
          <Route path="configuracoes" element={<Settings />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
