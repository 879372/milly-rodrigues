import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Scissors, Clock, User as UserIcon, CheckCircle2, ChevronLeft, ChevronRight, Search, Loader2, Bell, Calendar as CalendarIcon, AlertTriangle, MessageCircle, Sunrise, Sunset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { publicApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import BookingSuccess from '@/components/BookingSuccess';
import { BrandMark } from '@/components/BrandMark';

// Chave usada para lembrar o telefone do cliente neste aparelho/navegador
const SAVED_PHONE_KEY = 'rb_saved_phone';

// Types
type Service = { id: string; name: string; description: string; price: number; special_price: number | null; duration_minutes: number };
type Barber = { id: string; name: string; avatar_url: string | null; phone: string; first_name?: string };

const steps = [
  { id: 1, title: 'Serviço', icon: Scissors },
  { id: 2, title: 'Profissional', icon: UserIcon },
  { id: 3, title: 'Data e horário', icon: CalendarIcon },
  { id: 4, title: 'Seus dados', icon: UserIcon },
];

// JS: 0=Domingo, 1=Segunda... Backend (Django/WorkingHour): 0=Segunda... 6=Domingo.
const toDjangoWeekday = (date: Date) => {
  const jsDay = date.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function BookingPortal() {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Booking State
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isPhoneChecked, setIsPhoneChecked] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [hasNameOnServer, setHasNameOnServer] = useState(false);
  const [hasBirthDateOnServer, setHasBirthDateOnServer] = useState(false);
  const [hasEmailOnServer, setHasEmailOnServer] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successPortalToken, setSuccessPortalToken] = useState('');

  // Waitlist state
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [isWaitlistSuccess, setIsWaitlistSuccess] = useState(false);
  const [waitlistPeriod, setWaitlistPeriod] = useState<'morning' | 'afternoon' | 'any'>('any');
  const [waitlistNotes, setWaitlistNotes] = useState('');

  // Queries
  const { data: bookingConfig } = useQuery({
    queryKey: ['booking-config', 'public'],
    queryFn: async () => {
      const res = await publicApi.get<{ payment_days: number[]; deposit_percentage: number }>('/booking-config/');
      return res.data;
    },
  });
  // Dias (0=Segunda..6=Domingo) em que a profissional exige pagamento antecipado.
  const requirePayment = !!selectedDate && (bookingConfig?.payment_days || []).includes(toDjangoWeekday(selectedDate));

  const { data: specialPriceConfig } = useQuery({
    queryKey: ['special-price-config', 'public'],
    queryFn: async () => {
      const res = await publicApi.get<{ special_price_days: number[] }>('/special-price-config/');
      return res.data;
    },
  });
  // Dias (0=Segunda..6=Domingo) com valor especial (pode ser maior ou menor que o normal)
  // nos serviços que tiverem special_price.
  const isSpecialPriceDay = !!selectedDate && (specialPriceConfig?.special_price_days || []).includes(toDjangoWeekday(selectedDate));
  const priceOf = (svc: Service) => (isSpecialPriceDay && svc.special_price != null ? svc.special_price : svc.price);
  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await publicApi.get<Service[]>('/services/');
      return res.data;
    }
  });

  const { data: barbers, isLoading: isLoadingBarbers } = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      const res = await publicApi.get<Barber[]>('/users/?role=barber');
      return res.data;
    }
  });

  // Só uma profissional disponível: já deixa pré-selecionada (o cliente ainda vê a etapa,
  // só não precisa escolher entre uma única opção).
  useEffect(() => {
    if (barbers && barbers.length === 1 && !selectedBarber) {
      setSelectedBarber(barbers[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbers]);

  const { data: availableTimes, isLoading: isLoadingTimes } = useQuery({
    queryKey: ['available-times', selectedBarber?.id, selectedDate, selectedServices.map(s => s.id).join(',')],
    queryFn: async () => {
      if (!selectedBarber || !selectedDate || selectedServices.length === 0) return [];
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const servicesIds = selectedServices.map(s => s.id).join(',');
      const res = await publicApi.get<string[]>(`/users/${selectedBarber.id}/available_times/?date=${dateStr}&services_ids=${servicesIds}`);
      return res.data;
    },
    enabled: !!selectedBarber && !!selectedDate && selectedServices.length > 0,
    // A disponibilidade muda fora desta tela (por exemplo, quando um cliente
    // cancela em "Meus agendamentos"). Não reutilize uma lista antiga ao voltar.
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });

  const { data: barberWorkingHours } = useQuery({
    queryKey: ['barber-working-hours', selectedBarber?.id],
    queryFn: async () => {
      if (!selectedBarber) return [];
      const res = await publicApi.get(`/working-hours/?barber=${selectedBarber.id}`);
      return res.data;
    },
    enabled: !!selectedBarber,
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime || selectedServices.length === 0 || !selectedBarber) return;
      
      const [hours, minutes] = selectedTime.split(':');
      const dateTime = new Date(selectedDate);
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      return publicApi.post('/appointments/public_booking/', {
        name,
        phone,
        email,
        birth_date: dateToBackend(birthDate),
        services_ids: selectedServices.map(s => s.id),
        barber_id: selectedBarber.id,
        date_time: dateTime.toISOString(),
        notes: ''
      });
    },
    onSuccess: (res: any) => {
      if (res?.data?.payment_required && res.data.checkout_url) {
        toast.success('Redirecionando para o pagamento...');
        window.location.assign(res.data.checkout_url);
        return;
      }
      setSuccessPortalToken(res?.data?.portal_token || '');
      setIsSuccess(true);
      toast.success('Horário agendado com sucesso!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Erro ao realizar agendamento. Tente outro horário.';
      toast.error(errorMessage);
    }
  });

  const waitlistMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || selectedServices.length === 0 || !selectedBarber) return;
      return publicApi.post('/waitlist/public_join/', {
        name,
        phone,
        birth_date: dateToBackend(birthDate),
        services_ids: selectedServices.map(s => s.id),
        barber_id: selectedBarber.id,
        preferred_date: format(selectedDate, 'yyyy-MM-dd'),
        preferred_period: waitlistPeriod,
        notes: waitlistNotes,
      });
    },
    onSuccess: () => {
      setIsWaitlistModalOpen(false);
      setIsWaitlistSuccess(true);
      toast.success('Você entrou na fila de espera!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Erro ao entrar na fila. Tente novamente.';
      toast.error(errorMessage);
    }
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      return publicApi.post('/users/register_client/', {
        name,
        phone,
        email,
        birth_date: dateToBackend(birthDate)
      });
    }
  });

  const checkPhone = async () => {
    if (!phone) return false;
    setIsCheckingPhone(true);
    try {
      const res = await publicApi.get(`/users/check_phone/?phone=${phone}`);
      if (res.data.exists) {
        setName(res.data.user.first_name || '');
        setBirthDate(dateToFrontend(res.data.user.birth_date) || '');
        setHasNameOnServer(!!res.data.user.first_name);
        setHasBirthDateOnServer(!!res.data.user.birth_date);
        setHasEmailOnServer(!!res.data.user.has_email);
        setPhoneExists(true);
      } else {
        setHasNameOnServer(false);
        setHasBirthDateOnServer(false);
        setHasEmailOnServer(false);
        setPhoneExists(false);
      }
      setIsPhoneChecked(true);
      persistPhonePreference(phone, rememberDevice);
      return !!(res.data.exists && res.data.user.first_name && res.data.user.birth_date && res.data.user.has_email);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Erro ao consultar telefone. Tente novamente.';
      toast.error(msg);
      return false;
    } finally {
      setIsCheckingPhone(false);
    }
  };

  // Ao abrir a página, se houver um número salvo neste aparelho, preenche e já consulta automaticamente
  useEffect(() => {
    const savedPhone = localStorage.getItem(SAVED_PHONE_KEY);
    if (savedPhone) {
      setPhone(savedPhone);
      setRememberDevice(true);
      (async () => {
        setIsCheckingPhone(true);
        try {
          const res = await publicApi.get(`/users/check_phone/?phone=${savedPhone}`);
          if (res.data.exists) {
            setName(res.data.user.first_name || '');
            setBirthDate(dateToFrontend(res.data.user.birth_date) || '');
            setHasNameOnServer(!!res.data.user.first_name);
            setHasBirthDateOnServer(!!res.data.user.birth_date);
            setHasEmailOnServer(!!res.data.user.has_email);
            setPhoneExists(true);
          }
          setIsPhoneChecked(true);
        } catch {
          // Se falhar, apenas deixa o campo preenchido para o cliente confirmar manualmente
        } finally {
          setIsCheckingPhone(false);
        }
      })();
    }
  }, []);

  // Mantém o número salvo neste aparelho em sincronia com a preferência do cliente
  const persistPhonePreference = (value: string, remember: boolean) => {
    if (remember && value) {
      localStorage.setItem(SAVED_PHONE_KEY, value);
    } else {
      localStorage.removeItem(SAVED_PHONE_KEY);
    }
  };

  const handleNext = async () => {
    if (step === 1 && selectedServices.length === 0) {
      toast.error('Selecione pelo menos um serviço.');
      return;
    }

    if (step === 4) {
      if (!isPhoneChecked) {
        const profileIsComplete = await checkPhone();
        if (!profileIsComplete) return;
      }
      // Register or update client before proceeding
      registerMutation.mutate(undefined, {
        onSuccess: () => {
          persistPhonePreference(phone, rememberDevice);
          setIsConfirmModalOpen(true);
        },
        onError: () => toast.error('Erro ao salvar dados do cliente.')
      });
      return;
    }

    if (step < steps.length) setStep(step + 1);
  };

  const maskPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    return v;
  };

  const maskDate = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/g, "$1/$2");
    if (v.length > 5) v = v.replace(/^(\d{2})\/(\d{2})(\d)/g, "$1/$2/$3");
    return v;
  };

  const dateToBackend = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('/')) return dateStr;
    const [day, month, year] = dateStr.split('/');
    if (!day || !month || !year || year.length < 4) return dateStr;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const dateToFrontend = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [year, month, day] = dateStr.split('-');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  const waitlistPeriodLabel = waitlistPeriod === 'morning' ? 'Manhã' : waitlistPeriod === 'afternoon' ? 'Tarde' : 'Qualquer horário';

  if (isWaitlistSuccess) {
    return (
      <div className="min-h-screen bg-background px-4 py-5 text-foreground sm:grid sm:place-items-center sm:py-10">
        <div className="w-full max-w-lg">
          <div className="mb-5 flex justify-center"><BrandMark /></div>
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-5 shadow-lift backdrop-blur-xl sm:p-8">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-accent/15 blur-2xl" />
            <div className="relative space-y-6">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <span className="eyebrow">Solicitação recebida</span>
                  <h2 className="mt-1 font-display text-3xl font-semibold leading-none sm:text-4xl">Você está na fila</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Assim que surgir uma vaga, entraremos em contato pelo seu WhatsApp.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 sm:p-5">
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/65">Sua preferência</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3"><Scissors className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs text-muted-foreground">Serviço</p><p className="text-sm font-semibold">{selectedServices.map(s => s.name).join(', ')}</p></div></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-3"><UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs text-muted-foreground">Profissional</p><p className="text-sm font-semibold">{selectedBarber?.first_name || selectedBarber?.name}</p></div></div>
                    <div className="flex items-start gap-3"><CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs text-muted-foreground">Preferência</p><p className="text-sm font-semibold">{selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : ''} · {waitlistPeriodLabel}</p></div></div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
                <p className="text-sm font-semibold">O que acontece agora?</p>
                <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 text-xs text-muted-foreground">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 font-bold text-primary">1</span><p className="pt-1">Sua preferência fica registrada.</p>
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 font-bold text-primary">2</span><p className="pt-1">Quando houver vaga, falaremos com você.</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <Button
                  className="h-12 w-full gap-2 bg-[#25D366] font-semibold text-white shadow-soft hover:bg-[#20bd5a]"
                  onClick={() => {
                    const msg = `Olá! Me cadastrei na fila de espera para ${selectedServices.map(s => s.name).join(', ')} no dia ${format(selectedDate!, 'dd/MM')}.`;
                    const cleanPhone = selectedBarber?.phone.replace(/\D/g, '') || '';
                    const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
                    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                >
                  <MessageCircle className="h-4 w-4" /> Avisar pelo WhatsApp
                </Button>
                <Button variant="ghost" className="h-11 w-full text-sm text-muted-foreground" onClick={() => window.location.reload()}>
                  Fazer outro agendamento
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <BookingSuccess
        serviceNames={selectedServices.map(s => s.name).join(', ')}
        barberName={selectedBarber?.first_name || selectedBarber?.name || ''}
        barberPhone={selectedBarber?.phone}
        dateLabel={selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''}
        timeLabel={selectedTime}
        portalToken={successPortalToken || undefined}
        clientPhone={phone}
      />
    );
  }

  const totalPrice = selectedServices.reduce((total, service) => total + Number(priceOf(service)), 0);
  const depositPercentage = bookingConfig?.deposit_percentage ?? 100;
  const depositAmount = Math.round(totalPrice * depositPercentage) / 100;
  const remainingAfterDeposit = Math.max(0, totalPrice - depositAmount);
  const totalDuration = selectedServices.reduce((total, service) => total + service.duration_minutes, 0);

  return (
    <div className="min-h-screen bg-background px-3 pb-6 pt-2 text-foreground sm:px-6 sm:pb-12 sm:pt-7">
      <header className="mx-auto mb-3 flex w-full max-w-3xl items-center justify-between rounded-xl border border-border/60 bg-card/75 px-3 py-2 shadow-soft backdrop-blur-xl sm:mb-5 sm:rounded-2xl sm:px-5 sm:py-3">
        <BrandMark compact />
        <div className="text-right">
          <p className="eyebrow">Agendamento online</p>
          <p className="hidden text-xs text-muted-foreground sm:block">Rápido, simples e seguro</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl">
        <div className="mb-2 px-1 sm:mb-7">
          <span className="eyebrow">Etapa {step} de {steps.length}</span>
          <div className="mt-2 hidden items-end justify-between gap-4 sm:flex">
            <div>
              <h1 className="font-display text-3xl font-semibold leading-none sm:text-5xl">Seu momento começa aqui</h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">Escolha com calma. Você poderá revisar tudo antes de confirmar.</p>
            </div>
            <span className="hidden shrink-0 text-sm font-semibold text-primary sm:block">{steps[step - 1].title}</span>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-4 gap-1.5 sm:mb-5 sm:gap-2" aria-label={`Etapa ${step} de ${steps.length}: ${steps[step - 1].title}`}>
          {steps.map((item) => {
            const Icon = item.icon;
            const isCurrent = step === item.id;
            const isComplete = step > item.id;
            return (
              <div key={item.id} className="space-y-1.5 sm:space-y-2">
                <div className={`h-1 rounded-full transition-colors sm:h-1.5 ${isCurrent || isComplete ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`flex items-center gap-1.5 text-[10px] font-semibold sm:text-xs ${isCurrent ? 'text-foreground' : isComplete ? 'text-primary' : 'text-muted-foreground'}`}>
                  {isComplete ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Icon className="h-3.5 w-3.5 shrink-0" />}
                  <span className="hidden truncate sm:block">{item.title}</span>
                </div>
              </div>
            );
          })}
        </div>

        {(selectedServices.length > 0 || (step > 2 && selectedBarber) || (selectedDate && selectedTime)) && (
          <div className="mb-4 flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-primary/15 bg-primary/[0.045] px-4 py-2.5 text-xs">
            {selectedServices.length > 0 && <span><strong>{selectedServices.length} {selectedServices.length === 1 ? 'serviço' : 'serviços'}</strong> · {formatBRL(totalPrice)} · {totalDuration} min</span>}
            {step > 2 && selectedBarber && <span className="text-muted-foreground">com {selectedBarber.first_name || selectedBarber.name}</span>}
            {selectedDate && selectedTime && <span className="text-muted-foreground">{format(selectedDate, "dd 'de' MMM", { locale: ptBR })} às {selectedTime}</span>}
          </div>
        )}

        {/* Form Content */}
        <Card className="overflow-visible border-border/60 bg-card/80 shadow-lift backdrop-blur-xl">
          <CardContent className="p-3 sm:p-7 md:p-8">
            
            {/* Step 1: Identification */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <span className="eyebrow">Última etapa</span>
                  <h2 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Como podemos falar com você?</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Usaremos seu WhatsApp e e-mail para identificar o cadastro e confirmar o atendimento.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Seu WhatsApp</label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={phone}
                      autoComplete="tel"
                      inputMode="numeric"
                      aria-label="Seu WhatsApp"
                      onChange={(e) => {
                        setPhone(maskPhone(e.target.value));
                        setEmail('');
                        setHasEmailOnServer(false);
                        setIsPhoneChecked(false);
                      }}
                      onBlur={() => {
                        if (phone.replace(/\D/g, '').length >= 10 && !isPhoneChecked && !isCheckingPhone) checkPhone();
                      }}
                      className="h-12 bg-background border-border/50 text-base"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        id="remember-device"
                        checked={rememberDevice}
                        onCheckedChange={(checked) => {
                          setRememberDevice(checked);
                          if (isPhoneChecked) persistPhonePreference(phone, checked);
                        }}
                      />
                      <Label htmlFor="remember-device" className="text-xs text-muted-foreground cursor-pointer">
                        Lembrar meu número neste aparelho
                      </Label>
                    </div>
                  </div>

                  {isPhoneChecked && phoneExists && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                        <p className="text-sm">Olá, <span className="text-primary font-medium">{name || 'Cliente'}</span>! Bom ver você de novo. ✨</p>
                      </div>
                    </div>
                  )}

                  {isPhoneChecked && (!phoneExists || !hasNameOnServer || !hasBirthDateOnServer || !hasEmailOnServer) && (
                    <div className="space-y-5 animate-in slide-in-from-top-2 duration-300 pt-2">
                      <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] uppercase">
                        {!phoneExists ? 'Novo Cadastro' : 'Complete seu Perfil'}
                      </div>
                      
                      {!hasNameOnServer && (
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Nome Completo</label>
                          <Input 
                            placeholder="Ex: João Silva" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-12 bg-background border-border/50"
                          />
                        </div>
                      )}

                      {!hasBirthDateOnServer && (
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Data de Nascimento</label>
                          <Input 
                            placeholder="DD/MM/AAAA"
                            value={birthDate}
                            onChange={(e) => setBirthDate(maskDate(e.target.value))}
                            className="h-12 bg-background border-border/50"
                            inputMode="numeric"
                          />
                        </div>
                      )}

                      {!hasEmailOnServer && (
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">E-mail</label>
                          <Input
                            type="email"
                            placeholder="voce@exemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value.trim())}
                            className="h-12 bg-background border-border/50"
                            autoComplete="email"
                            inputMode="email"
                          />
                          <p className="text-[11px] text-muted-foreground">Usado para o pagamento e envio do comprovante.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Barber */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-6">
                  <span className="eyebrow">Quem vai cuidar de você</span>
                  <h2 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Escolha a profissional</h2>
                </div>
                {isLoadingBarbers ? (
                  <div className="text-center py-10 text-muted-foreground italic">Carregando profissionais...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    {barbers?.map((barber) => (
                      <button
                        type="button"
                        key={barber.id}
                        onClick={() => {
                          setSelectedBarber(barber);
                          setSelectedTime('');
                        }}
                        aria-pressed={selectedBarber?.id === barber.id}
                        className={`relative flex min-h-40 flex-col items-center gap-4 rounded-2xl border-2 p-5 text-center transition-all duration-200 ${selectedBarber?.id === barber.id ? 'border-primary bg-primary/5 shadow-soft' : 'border-border/50 hover:border-primary/50 hover:bg-accent/5'}`}
                      >
                        {selectedBarber?.id === barber.id && <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-primary" />}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10 shadow-inner group-hover:scale-105 transition-transform">
                          <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-base">{barber.first_name || barber.name}</h3>
                          <p className="text-[10px] text-muted-foreground">Profissional especialista</p>
                        </div>
                      </button>
                    ))}
                    {barbers?.length === 0 && (
                      <div className="col-span-2 rounded-2xl border border-dashed border-border p-8 text-center">
                        <UserIcon className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
                        <p className="font-medium">Agenda em preparação</p>
                        <p className="mt-1 text-sm text-muted-foreground">Nenhuma profissional está disponível para agendamento online neste momento.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Date and time */}
            {step === 3 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-5">
                  <span className="eyebrow">Quando você prefere</span>
                  <h2 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Data e horário</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Os dias indisponíveis aparecem desativados.</p>
                </div>
                <div className="flex justify-center border border-border/50 bg-background/50 rounded-2xl p-2 backdrop-blur-sm">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => { setSelectedDate(date); setSelectedTime(''); }}
                    disabled={(date) => {
                      // 1. Disable past dates
                      if (date < new Date(new Date().setHours(0,0,0,0))) return true;

                      // 2. Disable days where the barber is closed
                      if (barberWorkingHours && selectedBarber) {
                        const dayOfWeek = date.getDay();
                        // Adjust JS day (0=Sun) to match Django (0=Mon) if necessary,
                        // but let's check what backend uses. Backend: 0=Mon, 1=Tue... 6=Sun.
                        // JS: 0=Sun, 1=Mon... 6=Sat.
                        const djangoDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

                        const isWorking = barberWorkingHours.some(
                          (wh: any) => wh.day_of_week === djangoDay && wh.is_active
                        );
                        return !isWorking;
                      }

                      return false;
                    }}
                    className="rounded-md"
                    locale={ptBR}
                  />
                </div>
              </div>
            )}

            {/* Step 1: Services */}
            {step === 1 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500 sm:space-y-4">
                <div className="mb-3 sm:mb-5">
                  <span className="eyebrow">O que você deseja fazer</span>
                  <h2 className="mt-0.5 font-display text-2xl font-semibold sm:mt-1 sm:text-4xl">Escolha seus serviços</h2>
                  <p className="mt-1 text-xs text-muted-foreground sm:mt-2 sm:text-sm">Você pode selecionar mais de uma opção.</p>
                </div>

                <div className="relative mb-4 sm:mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar serviço..."
                    className="h-12 bg-background pl-10 text-sm border-border/50 focus-visible:ring-primary sm:h-14 sm:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {isLoadingServices ? (
                  <div className="text-center py-10 text-muted-foreground italic">Carregando serviços...</div>
                ) : (
                  <>
                    <div className="grid gap-3">
                      {services?.filter(svc => svc.name.toLowerCase().includes(searchQuery.toLowerCase()) || svc.description?.toLowerCase().includes(searchQuery.toLowerCase())).map((svc) => {
                        const isSelected = selectedServices.some(s => s.id === svc.id);
                        return (
                          <button
                            type="button"
                            key={svc.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedServices(selectedServices.filter(s => s.id !== svc.id));
                              } else {
                                setSelectedServices([...selectedServices, svc]);
                              }
                              setSelectedTime('');
                            }}
                            aria-pressed={isSelected}
                            className={`group relative flex min-h-28 flex-col gap-1 overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-200 ${isSelected ? 'border-primary bg-primary/5 shadow-soft' : 'border-border/50 hover:border-primary/50 hover:bg-accent/5'}`}
                          >
                            {isSelected && <div className="absolute top-0 right-0 p-2"><CheckCircle2 className="w-4 h-4 text-primary" /></div>}
                            <h3 className="font-medium text-base sm:text-lg leading-tight">{svc.name}</h3>
                            {svc.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{svc.description}</p>
                            )}
                            <div className="flex justify-between items-end mt-2">
                              <span className="text-[10px] text-primary flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {svc.duration_minutes} min
                              </span>
                              <span className="font-semibold text-base text-foreground">
                                {formatBRL(Number(priceOf(svc)))}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                      {services?.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                          <Scissors className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
                          <p className="font-medium">Serviços em atualização</p>
                          <p className="mt-1 text-sm text-muted-foreground">As opções de atendimento estarão disponíveis em breve.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Available times share the same step as the calendar */}
            {step === 3 && selectedDate && (
              <div className="mt-7 space-y-4 border-t border-border/60 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="font-display text-2xl font-semibold">Horários disponíveis</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })} com {selectedBarber?.first_name || selectedBarber?.name}
                  </p>
                </div>

                {isLoadingTimes ? (
                  <div className="text-center py-10 italic text-sm text-muted-foreground">Consultando agenda...</div>
                ) : availableTimes?.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-8 text-sm text-muted-foreground bg-primary/5 rounded-2xl border-2 border-dashed border-primary/10 space-y-3">
                      <p>
                        Poxa! Nenhum horário disponível nesta data. 😕<br/>
                        <span className="text-[10px] font-medium">Selecione outra data no calendário ou entre na fila de espera.</span>
                      </p>
                    </div>
                    <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Fila de Espera</p>
                          <p className="text-[11px] text-muted-foreground">Caso surja uma vaga, a profissional entrará em contato.</p>
                        </div>
                      </div>
                      <Button
                        className="w-full gap-2"
                        onClick={() => setIsWaitlistModalOpen(true)}
                      >
                        <Bell className="w-4 h-4" />
                        Entrar na Fila de Espera
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {availableTimes?.map((time) => {
                        const [hours, minutes] = time.split(':').map(Number);
                        const endDateTime = new Date();
                        endDateTime.setHours(hours, minutes + (selectedServices.reduce((a, b) => a + b.duration_minutes, 0) || 30), 0, 0);
                        const endTimeStr = format(endDateTime, 'HH:mm');
                        return (
                          <button
                            type="button"
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            aria-pressed={selectedTime === time}
                            className={`flex min-h-14 flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all ${selectedTime === time ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' : 'border-border/50 bg-background/50 hover:border-primary/50'}`}
                          >
                            <span className="font-semibold text-base sm:text-lg">{time}</span>
                            <span className="text-[9px] opacity-80 leading-none">até {endTimeStr}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-col items-center gap-2 pt-4 border-t border-border/50">
                      <p className="max-w-md text-center text-xs leading-relaxed text-muted-foreground">
                        Não encontrou o horário desejado? Entre na fila de espera ou selecione outra data no calendário.
                      </p>
                      <div className="w-full sm:w-auto">
                        <Button
                          size="sm"
                          className="h-10 w-full gap-2 px-5 text-xs sm:w-auto"
                          onClick={() => setIsWaitlistModalOpen(true)}
                        >
                          <Bell className="w-3.5 h-3.5" />
                          Entrar na Fila de Espera
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="sticky bottom-3 z-20 -mx-1 mt-8 flex justify-between gap-2 rounded-2xl border border-border/70 bg-card/95 p-2.5 shadow-lift backdrop-blur-xl sm:static sm:mx-0 sm:mt-10 sm:border-x-0 sm:border-b-0 sm:border-t sm:bg-transparent sm:px-0 sm:pt-6 sm:shadow-none">
              <Button 
                variant="ghost" 
                onClick={() => setStep(step - 1)} 
                disabled={step === 1 || bookMutation.isPending}
                className="h-12 gap-2 px-3 text-muted-foreground sm:px-6"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </Button>
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && selectedServices.length === 0) ||
                  (step === 2 && !selectedBarber) ||
                  (step === 3 && (!selectedDate || !selectedTime)) ||
                  (step === 4 && (!phone || (isPhoneChecked && (
                    (!hasNameOnServer && !name) ||
                    (!hasBirthDateOnServer && !birthDate) ||
                    (!hasEmailOnServer && !isValidEmail(email))
                  )))) ||
                  bookMutation.isPending || isCheckingPhone
                }
                className="h-12 flex-1 gap-2 px-5 shadow-lg shadow-primary/20 sm:flex-none sm:px-8"
              >
                {isCheckingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {bookMutation.isPending ? 'Agendando...' : step === steps.length ? (isPhoneChecked ? 'Revisar agendamento' : 'Identificar cadastro') : 'Continuar'}
                {step < steps.length && !isCheckingPhone && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>

          </CardContent>
        </Card>
      </main>

      {/* Waitlist Modal */}
      <Dialog open={isWaitlistModalOpen} onOpenChange={setIsWaitlistModalOpen}>
        <DialogContent className="border-border/60 bg-card/95 p-0 backdrop-blur-2xl sm:max-w-lg sm:overflow-hidden">
          <div className="relative overflow-hidden border-b border-border/60 bg-primary/[0.045] px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
            <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />
            <div className="relative flex items-start gap-4 pr-8">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
                <Bell className="h-5 w-5" />
              </div>
              <DialogHeader className="space-y-1 text-left">
                <span className="eyebrow">Avise-me quando surgir uma vaga</span>
                <DialogTitle className="font-display text-3xl font-semibold leading-none tracking-normal">Fila de espera</DialogTitle>
                <p className="pt-1 text-sm leading-relaxed text-muted-foreground">Registre sua preferência. Entraremos em contato antes de confirmar qualquer horário.</p>
              </DialogHeader>
            </div>
          </div>

          <div className="space-y-6 px-5 pb-5 pt-5 sm:px-7 sm:pb-7">
            <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/65">Resumo da preferência</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Scissors className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div><p className="text-xs text-muted-foreground">Serviço</p><p className="text-sm font-semibold">{selectedServices.map(s => s.name).join(', ')}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-3"><UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs text-muted-foreground">Profissional</p><p className="text-sm font-semibold">{selectedBarber?.first_name || selectedBarber?.name}</p></div></div>
                  <div className="flex items-start gap-3"><CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs text-muted-foreground">Data</p><p className="text-sm font-semibold">{selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : ''}</p></div></div>
                </div>
              </div>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Qual período funciona melhor?</legend>
              <div className="grid grid-cols-3 gap-2.5">
                {([['morning', 'Manhã', Sunrise], ['afternoon', 'Tarde', Sunset], ['any', 'Qualquer', Clock]] as const).map(([val, label, PeriodIcon]) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setWaitlistPeriod(val)}
                    aria-pressed={waitlistPeriod === val}
                    className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border-2 px-2 py-3 text-xs font-semibold transition-all ${
                      waitlistPeriod === val
                        ? 'border-primary bg-primary/5 text-primary shadow-soft'
                        : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:bg-primary/[0.025]'
                    }`}
                  >
                    <PeriodIcon className="h-5 w-5" /> {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <label htmlFor="waitlist-notes" className="text-sm font-semibold">Quer deixar alguma observação? <span className="font-normal text-muted-foreground">(opcional)</span></label>
              <Textarea
                id="waitlist-notes"
                placeholder="Ex.: Consigo chegar com pouco tempo de aviso."
                value={waitlistNotes}
                onChange={(e) => setWaitlistNotes(e.target.value)}
                className="min-h-24 resize-none rounded-2xl border-border/60 bg-background/60 text-sm"
              />
            </div>

            <div className="space-y-2.5 border-t border-border/60 pt-5">
              <Button
                className="h-12 w-full gap-2 font-semibold shadow-soft"
                onClick={() => waitlistMutation.mutate()}
                disabled={waitlistMutation.isPending}
              >
                {waitlistMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                {waitlistMutation.isPending ? 'Registrando preferência...' : 'Quero entrar na fila'}
              </Button>
              <Button variant="ghost" className="h-11 w-full text-sm text-muted-foreground" onClick={() => setIsWaitlistModalOpen(false)}>
                Agora não
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain sm:max-w-md bg-card border-border backdrop-blur-2xl p-6 sm:p-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-primary" />
            </div>
            
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-semibold text-center mx-auto">Confirmar Horário</DialogTitle>
            </DialogHeader>
            
            <p className="text-muted-foreground text-sm sm:text-base mt-0">
              {requirePayment
                ? 'Quase lá! Confira os dados e siga para o pagamento para confirmar o horário.'
                : 'Quase lá! Confira os dados abaixo antes de finalizar.'}
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-2xl border border-border/50 space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-[11px] text-muted-foreground">{maskPhone(phone)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Scissors className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Serviços Selecionados</p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedServices.map(s => s.name).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Profissional</p>
                    <p className="text-[11px] text-muted-foreground">{selectedBarber?.first_name || selectedBarber?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {selectedDate && dateToFrontend(format(selectedDate, 'yyyy-MM-dd'))} às {selectedTime}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Duração estimada: {selectedServices.reduce((a, b) => a + b.duration_minutes, 0)} min</p>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-border/50 flex justify-between items-center">
                  <strong>Total:</strong>
                  <span className="text-primary font-bold text-lg">{formatBRL(selectedServices.reduce((acc, curr) => acc + Number(priceOf(curr)), 0))}</span>
                </div>
                {requirePayment && (
                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-primary/5 p-3 text-sm">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Entrada agora ({depositPercentage}%)</p>
                      <p className="font-bold text-primary">{formatBRL(depositAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground">Restante no atendimento</p>
                      <p className="font-bold">{formatBRL(remainingAfterDeposit)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {requirePayment && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-left">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">Política de cancelamento</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Em caso de falta ou cancelamento, o valor da entrada não será reembolsado.
                    Ao prosseguir para o pagamento, você declara estar ciente desta condição.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Button 
                className="w-full h-12 shadow-lg shadow-primary/20 text-base font-bold"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  bookMutation.mutate();
                }}
                disabled={bookMutation.isPending}
              >
                {bookMutation.isPending
                  ? (requirePayment ? 'Redirecionando...' : 'Confirmando...')
                  : (requirePayment ? 'Ir para o pagamento' : 'Confirmar Agendamento')}
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setIsConfirmModalOpen(false)}>
                Voltar e alterar dados
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
