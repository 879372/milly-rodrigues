import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { BrandMark } from '@/components/BrandMark';

const loginSchema = z.object({
  username: z.string().min(3, 'O usuário deve ter pelo menos 3 caracteres'),
  password: z.string().min(4, 'A senha deve ter pelo menos 4 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      // 1. Convert username to lowercase to make login case-insensitive
      const loginPayload = {
        ...data,
        username: data.username.toLowerCase()
      };

      // 2. Get token
      const tokenRes = await api.post('/token/', loginPayload);
      const { access, refresh } = tokenRes.data;

      // 2. Set token temporarily to fetch user data
      localStorage.setItem('access_token', access);
      if (refresh) localStorage.setItem('refresh_token', refresh);

      // 3. Get user info
      const userRes = await api.get('/users/me/');

      setAuth(userRes.data, access, refresh);
      toast.success(`Bem-vindo, ${userRes.data.first_name || userRes.data.username}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error('Usuário ou senha inválidos. Verifique seus dados.');
      localStorage.removeItem('access_token');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative grid min-h-[100dvh] overflow-hidden bg-background lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <img src="/milly.jpg" alt="Milly Rodrigues em seu espaço de atendimento" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-primary-foreground">
          <Sparkles className="mb-5 h-7 w-7 text-accent" />
          <p className="font-display max-w-xl text-5xl font-semibold leading-[.95]">Cuidado que acolhe.<br />Gestão que simplifica.</p>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-primary-foreground/75">Sua agenda, seus clientes e a saúde do negócio reunidos em uma experiência leve.</p>
        </div>
      </section>

      <section className="relative flex items-center justify-center p-4 sm:p-8">
        <div className="absolute right-[-15%] top-[-10%] h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <Card className="relative w-full max-w-md border-white/70 bg-card/80 shadow-lift backdrop-blur-xl">
          <CardContent className="p-6 sm:p-9">
            <BrandMark className="mb-10" />
            <p className="eyebrow mb-2">Área administrativa</p>
            <h1 className="font-display text-4xl font-semibold leading-none">Bem-vinda de volta</h1>
            <p className="mt-3 text-sm text-muted-foreground">Entre para acompanhar sua agenda e cuidar do seu negócio.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="mt-8 space-y-2">
              <label className="ml-1 text-xs font-semibold text-foreground">Usuário</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  {...register('username')}
                  placeholder="Seu usuário" 
                  className={`pl-10 h-12 bg-background/50 border-border/50 focus:border-primary transition-all ${errors.username ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.username && <p className="text-[10px] font-bold text-destructive ml-1 uppercase">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-xs font-semibold text-foreground">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  {...register('password')}
                  type="password"
                  placeholder="••••••••" 
                  className={`pl-10 h-12 bg-background/50 border-border/50 focus:border-primary transition-all ${errors.password ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.password && <p className="text-[10px] font-bold text-destructive ml-1 uppercase">{errors.password.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 gap-2 text-base shadow-lg shadow-primary/20" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Acessar Painel'}
            </Button>
          </form>

            <p className="mt-7 text-center text-xs text-muted-foreground">Precisa recuperar o acesso? Fale com a administração.</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
