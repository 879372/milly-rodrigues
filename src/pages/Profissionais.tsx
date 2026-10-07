import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Loader2, Trash2, Phone, Calendar, Edit2, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';

type Barber = {
  id: number;
  username: string;
  first_name: string;
  phone: string;
  role: 'barber' | 'admin' | 'client';
  is_bookable?: boolean;
};

const maskPhone = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, "");
  if (value.length <= 10) {
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
  } else {
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
  }
  return value;
};

export default function Profissionais() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [phone, setPhone] = useState("");
  
  const { data: barbers, isLoading } = useQuery({
    queryKey: ['barbers-list'],
    queryFn: async () => {
      const res = await api.get<Barber[]>('/users/?role=barber');
      return res.data;
    }
  });

  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    const arr = new Uint32Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, (n) => chars[n % chars.length]).join('');
  };

  const saveBarberMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingBarber) {
        return api.patch(`/users/${editingBarber.id}/`, data);
      }
      const password = generatePassword();
      const res = await api.post('/users/', { ...data, password, role: data.role || 'barber', is_bookable: true, must_change_password: true });
      return { ...res, _tempPassword: password } as any;
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['barbers-list'] });
      setIsOpen(false);
      setEditingBarber(null);
      if (res?._tempPassword) {
        setTempPassword(res._tempPassword);
      } else {
        toast.success('Profissional atualizado!');
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.username?.[0] || err.response?.data?.error || 'Erro ao salvar profissional';
      toast.error(msg);
    }
  });

  const deleteBarberMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/users/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers-list'] });
      toast.success('Profissional removido com sucesso.');
    },
    onError: () => toast.error('Erro ao remover profissional.')
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const isAdmin = formData.get('is_admin') === 'on';
    const payload: any = {
      username: (formData.get('username') as string)?.toLowerCase(),
      first_name: formData.get('first_name'),
      phone: formData.get('phone'),
      role: isAdmin ? 'admin' : 'barber',
      is_bookable: true,
    };

    const newPassword = formData.get('password');
    if (newPassword) {
      payload.password = newPassword;
    }

    saveBarberMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <Dialog open={!!tempPassword} onOpenChange={(o) => { if (!o) setTempPassword(null); }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Senha provisória gerada</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Entregue esta senha ao profissional por um canal seguro. Ela <strong>não será exibida novamente</strong> e deverá ser trocada no primeiro acesso.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-primary/10 px-3 py-2 rounded-lg font-mono font-bold text-primary break-all">{tempPassword}</code>
              <Button type="button" variant="outline" onClick={() => { navigator.clipboard?.writeText(tempPassword || ''); toast.success('Copiado.'); }}>
                Copiar
              </Button>
            </div>
            <Button className="w-full" onClick={() => setTempPassword(null)}>Entendi</Button>
          </div>
        </DialogContent>
      </Dialog>
      <div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingBarber(null);
            setPhone("");
          } else if (editingBarber) {
            setPhone(maskPhone(editingBarber.phone));
          }
        }}>
          <PageHeader eyebrow="Equipe" title="Profissionais" description="Perfis, acessos e disponibilidade de quem atende no estúdio." action={<DialogTrigger asChild><Button className="w-full gap-2 font-bold shadow-lg shadow-primary/20 sm:w-auto"><Plus className="w-4 h-4" /> Nova profissional</Button></DialogTrigger>} />
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{editingBarber ? 'Editar profissional' : 'Nova profissional'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Nome Completo</label>
                <Input 
                  name="first_name" 
                  defaultValue={editingBarber?.first_name || ''} 
                  placeholder="Ex: Milly Rodrigues" 
                  required 
                  className="h-11 bg-background border-border/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Usuário de Acesso</label>
                <Input 
                  name="username" 
                  defaultValue={editingBarber?.username || ''} 
                  placeholder="Ex: milly_rodrigues" 
                  required 
                  className="h-11 bg-background border-border/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">WhatsApp</label>
                <Input 
                  name="phone" 
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000" 
                  required 
                  className="h-11 bg-background border-border/50"
                />
              </div>
              
              {editingBarber && (
                <div className="space-y-2">
                  <label className="text-sm font-bold">Nova Senha <span className="text-muted-foreground font-normal text-xs">(opcional)</span></label>
                  <Input
                    name="password"
                    type="password"
                    placeholder="Deixe em branco para manter a atual"
                    className="h-11 bg-background border-border/50"
                  />
                </div>
              )}

              <label className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/50 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_admin"
                  defaultChecked={editingBarber?.role === 'admin'}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="text-xs leading-tight">
                  <strong>Também é administrador</strong> — acesso total (financeiro, equipe, histórico) <em>e</em> continua com agenda própria de atendimentos.
                </span>
              </label>

              {!editingBarber && (
                <div className="flex gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <Shield className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    <strong>Importante:</strong> uma senha provisória aleatória será gerada e exibida uma única vez após o cadastro. O profissional deverá defini-la no primeiro acesso.
                  </p>
                </div>
              )}
              <Button type="submit" className="w-full h-12 font-bold text-lg mt-2" disabled={saveBarberMutation.isPending}>
                {saveBarberMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingBarber ? 'Salvar Alterações' : 'Cadastrar Profissional'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground italic">Carregando equipe...</div>
        ) : barbers?.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-card/30 rounded-2xl border-2 border-dashed border-border/50">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Nenhuma profissional cadastrada na equipe.</p>
          </div>
        ) : (
          barbers?.map((barber) => (
            <Card key={barber.id} className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-all group">
              <CardHeader className="pb-4 bg-primary/5">
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black text-2xl border border-primary/10 shadow-inner">
                    {barber.first_name ? barber.first_name[0] : barber.username[0]}
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="bg-background h-8 w-8 rounded-lg border-border/50 hover:text-primary hover:bg-primary/10"
                      onClick={() => {
                        setEditingBarber(barber);
                        setPhone(maskPhone(barber.phone));
                        setIsOpen(true);
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="bg-background h-8 w-8 rounded-lg border-border/50 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if(confirm('Tem certeza que deseja remover este profissional?')) {
                          deleteBarberMutation.mutate(barber.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="mt-4 text-xl font-bold flex items-center gap-2">
                  {barber.first_name || barber.username}
                  {barber.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <User className="w-3 h-3" /> @{barber.username}
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50">
                  <Phone className="w-4 h-4 text-primary" /> 
                  <span className="text-sm font-bold">{maskPhone(barber.phone) || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50">
                  <Calendar className="w-4 h-4 text-primary" /> 
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Horários: Configurados na aba Opções</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
