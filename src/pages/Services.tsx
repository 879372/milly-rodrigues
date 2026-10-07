import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Clock, DollarSign, Plus, Loader2, Trash2, Edit, Search, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInfiniteScroll, getNextPageParam, type Paginated } from '@/hooks/useInfiniteScroll';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';

type Service = {
  id: number;
  name: string;
  description: string;
  price: string;
  special_price: string | null;
  duration_minutes: number;
  is_active: boolean;
};

const formatCurrency = (value: string | number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(typeof value === 'string' ? parseFloat(value) : value);
};

const PAGE_SIZE = 24;

export default function Services() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['services', debouncedSearch],
    queryFn: async ({ pageParam }) => {
      const q = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      const res = await api.get<Paginated<Service>>(`/services/?page=${pageParam}&page_size=${PAGE_SIZE}${q}`);
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam,
  });

  const services = data?.pages.flatMap((p) => p.results) ?? [];

  const sentinelRef = useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Service>) => {
      if (editingService) {
        return api.patch(`/services/${editingService.id}/`, data);
      }
      return api.post('/services/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsOpen(false);
      setEditingService(null);
      toast.success(editingService ? 'Serviço atualizado!' : 'Serviço criado!');
    },
    onError: () => toast.error('Erro ao salvar serviço.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/services/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço excluído!');
    },
    onError: () => toast.error('Erro ao excluir serviço.'),
  });

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const specialPrice = (formData.get('special_price') as string) || '';
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: formData.get('price') as string,
      special_price: specialPrice ? specialPrice : null,
      duration_minutes: parseInt(formData.get('duration_minutes') as string),
      is_active: true,
    };
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setEditingService(null);
        }}>
          <PageHeader eyebrow="Menu de cuidados" title="Serviços" description="Organize procedimentos, duração e valores com clareza." action={<DialogTrigger asChild><Button className="w-full gap-2 font-bold shadow-lg shadow-primary/20 sm:w-auto"><Plus className="w-4 h-4" /> Novo serviço</Button></DialogTrigger>} />
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Nome do Serviço</label>
                <Input 
                  name="name" 
                  defaultValue={editingService?.name} 
                  placeholder="Ex: Depilação íntima"
                  required 
                  className="bg-background border-border/50 h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Descrição (Opcional)</label>
                <Textarea 
                  name="description" 
                  defaultValue={editingService?.description} 
                  placeholder="Descreva o procedimento e os cuidados incluídos."
                  className="bg-background border-border/50 min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Preço (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      name="price" 
                      type="number" 
                      step="0.01" 
                      defaultValue={editingService?.price} 
                      placeholder="0,00"
                      required 
                      className="bg-background border-border/50 pl-9 h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Duração (min)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="duration_minutes"
                      type="number"
                      defaultValue={editingService?.duration_minutes}
                      placeholder="30"
                      required
                      className="bg-background border-border/50 pl-9 h-11"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500" /> Preço Especial (opcional)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    name="special_price"
                    type="number"
                    step="0.01"
                    defaultValue={editingService?.special_price ?? ''}
                    placeholder="Deixe em branco para não ter valor especial"
                    className="bg-background border-border/50 pl-9 h-11"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Pode ser maior ou menor que o preço normal (ex.: mais caro no fim de semana).
                  Cobrado nos dias marcados em Configurações → Valores Especiais.
                </p>
              </div>
              <Button type="submit" className="w-full h-12 font-bold text-lg mt-2" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou descrição..."
          className="pl-9 bg-background border-border/50 h-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-10 italic text-muted-foreground">Carregando serviços...</div>
        ) : services.length === 0 ? (
          <div className="col-span-full text-center py-10 italic text-muted-foreground">
            {debouncedSearch ? 'Nenhum serviço encontrado.' : 'Nenhum serviço cadastrado.'}
          </div>
        ) : (
          services.map((service) => (
            <Card key={service.id} className="overflow-hidden border-border/50 bg-card/50 hover:border-primary/30 transition-all group">
              <CardHeader className="bg-primary/5 pb-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xl text-primary">{formatCurrency(service.price)}</div>
                    {service.special_price && (
                      <div className="text-xs text-amber-500 font-bold flex items-center gap-1 justify-end mt-0.5">
                        <Tag className="w-3 h-3" /> Especial: {formatCurrency(service.special_price)}
                      </div>
                    )}
                  </div>
                </div>
                <CardTitle className="mt-4 text-xl font-bold">{service.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                  {service.description || 'Sem descrição.'}
                </p>
                <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                    <Clock className="w-3.5 h-3.5" />
                    {service.duration_minutes} min
                  </div>
                  <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                    <div className={`w-2 h-2 rounded-full ${service.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                    {service.is_active ? 'Ativo' : 'Inativo'}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 font-bold h-9 gap-1.5 border-border/50 hover:bg-primary/10 hover:text-primary" 
                    onClick={() => handleEdit(service)}
                  >
                    <Edit className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 w-9 p-0 border-border/50 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este serviço?')) {
                        deleteMutation.mutate(service.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!isLoading && services.length > 0 && (
        <div ref={sentinelRef} className="flex items-center justify-center py-6 text-xs text-muted-foreground">
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
      )}
    </div>
  );
}
