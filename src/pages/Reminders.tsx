import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, CalendarCheck2, CalendarClock, CheckCircle2, Heart, Info, Loader2, MessageCircle, Save, Star, ThumbsUp, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

type AutomationConfig = {
  confirmation_enabled: boolean;
  confirmation_template: string;
  appointment_reminder_enabled: boolean;
  appointment_reminder_template: string;
  cancellation_enabled: boolean;
  cancellation_template: string;
  thank_you_enabled: boolean;
  thank_you_template: string;
  follow_up_enabled: boolean;
  follow_up_template: string;
  review_enabled: boolean;
  review_template: string;
  google_review_url: string;
  return_enabled: boolean;
  return_template: string;
  updated_at?: string;
};

type TemplateCardProps = {
  title: string;
  description: string;
  timing: string;
  enabled: boolean;
  template: string;
  icon: typeof Heart;
  onEnabledChange: (enabled: boolean) => void;
  onTemplateChange: (template: string) => void;
  children?: React.ReactNode;
};

const EMPTY_CONFIG: AutomationConfig = {
  confirmation_enabled: true,
  confirmation_template: '',
  appointment_reminder_enabled: true,
  appointment_reminder_template: '',
  cancellation_enabled: true,
  cancellation_template: '',
  thank_you_enabled: true,
  thank_you_template: '',
  follow_up_enabled: true,
  follow_up_template: '',
  review_enabled: true,
  review_template: '',
  google_review_url: '',
  return_enabled: true,
  return_template: '',
};

const VARIABLES = ['{nome}', '{servico}', '{profissional}', '{data}', '{hora}', '{link_agendamento}', '{link_gerenciamento}', '{link_avaliacao}'];

function TemplateCard({
  title,
  description,
  timing,
  enabled,
  template,
  icon: Icon,
  onEnabledChange,
  onTemplateChange,
  children,
}: TemplateCardProps) {
  return (
    <Card className={`border-border/60 bg-card/80 shadow-soft transition-opacity ${enabled ? '' : 'opacity-70'}`}>
      <CardHeader className="space-y-4 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <CardTitle className="font-display text-xl font-semibold sm:text-2xl">{title}</CardTitle>
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[10px] text-primary">
                  {timing}
                </Badge>
              </div>
              <CardDescription className="leading-relaxed">{description}</CardDescription>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            aria-label={`${enabled ? 'Desativar' : 'Ativar'} ${title}`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-5 sm:px-6 sm:pb-6">
        {children}
        <div className="space-y-2">
          <Label htmlFor={`template-${title}`} className="font-semibold">Mensagem</Label>
          <Textarea
            id={`template-${title}`}
            value={template}
            onChange={(event) => onTemplateChange(event.target.value)}
            disabled={!enabled}
            rows={7}
            className="min-h-40 resize-y bg-background/70 leading-relaxed"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Reminders() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AutomationConfig>(EMPTY_CONFIG);
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['message-automation-config'],
    queryFn: async () => (await api.get<AutomationConfig>('/message-automation-config/')).data,
  });

  useEffect(() => {
    if (data && !dirty) setForm(data);
  }, [data, dirty]);

  const updateForm = <K extends keyof AutomationConfig>(field: K, value: AutomationConfig[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => api.patch('/message-automation-config/', form),
    onSuccess: (response) => {
      queryClient.setQueryData(['message-automation-config'], response.data);
      setForm(response.data);
      setDirty(false);
      toast.success('Lembretes automáticos atualizados!');
    },
    onError: (error: any) => {
      const responseData = error.response?.data;
      const firstMessage = responseData && typeof responseData === 'object'
        ? Object.values(responseData).flat().find(Boolean)
        : null;
      toast.error(typeof firstMessage === 'string' ? firstMessage : 'Não foi possível salvar os lembretes.');
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[50dvh] place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Carregando lembretes" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        eyebrow="Relacionamento"
        title="Lembretes automáticos"
        description="Personalize todas as mensagens automáticas enviadas pelo WhatsApp."
      />

      <section className="rounded-3xl border border-primary/15 bg-primary/[0.045] p-4 sm:p-5" aria-label="Como funcionam os lembretes">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-3">
            <div>
              <p className="font-semibold">Use as variáveis abaixo para personalizar cada mensagem.</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Confirmação, cancelamento e agradecimento acompanham o status do agendamento. Os lembretes programados são enviados apenas uma vez.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5" aria-label="Variáveis disponíveis">
              {VARIABLES.map((variable) => (
                <code key={variable} className="rounded-lg border border-border/60 bg-background/70 px-2 py-1 text-[11px] text-primary">
                  {variable}
                </code>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Agendamento</h2>
          <p className="text-sm text-muted-foreground">Mensagens enviadas durante o ciclo do atendimento.</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <TemplateCard
            title="Confirmação"
            description="Enviada assim que o agendamento é confirmado."
            timing="Imediatamente"
            enabled={form.confirmation_enabled}
            template={form.confirmation_template}
            icon={CalendarCheck2}
            onEnabledChange={(value) => updateForm('confirmation_enabled', value)}
            onTemplateChange={(value) => updateForm('confirmation_template', value)}
          />

          <TemplateCard
            title="Lembrete do horário"
            description="Recorda a cliente sobre o atendimento que está próximo."
            timing="1 hora antes"
            enabled={form.appointment_reminder_enabled}
            template={form.appointment_reminder_template}
            icon={BellRing}
            onEnabledChange={(value) => updateForm('appointment_reminder_enabled', value)}
            onTemplateChange={(value) => updateForm('appointment_reminder_template', value)}
          />

          <TemplateCard
            title="Cancelamento"
            description="Confirma que o agendamento foi cancelado."
            timing="Ao cancelar"
            enabled={form.cancellation_enabled}
            template={form.cancellation_template}
            icon={XCircle}
            onEnabledChange={(value) => updateForm('cancellation_enabled', value)}
            onTemplateChange={(value) => updateForm('cancellation_template', value)}
          />

          <TemplateCard
            title="Agradecimento"
            description="Agradece a visita assim que o atendimento é concluído."
            timing="Ao concluir"
            enabled={form.thank_you_enabled}
            template={form.thank_you_template}
            icon={ThumbsUp}
            onEnabledChange={(value) => updateForm('thank_you_enabled', value)}
            onTemplateChange={(value) => updateForm('thank_you_template', value)}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Pós-atendimento</h2>
          <p className="text-sm text-muted-foreground">Mensagens programadas a partir da conclusão do procedimento.</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <TemplateCard
            title="Como você está?"
            description="Acompanhamento para saber como a cliente está após o procedimento."
            timing="24 horas depois"
            enabled={form.follow_up_enabled}
            template={form.follow_up_template}
            icon={Heart}
            onEnabledChange={(value) => updateForm('follow_up_enabled', value)}
            onTemplateChange={(value) => updateForm('follow_up_template', value)}
          />

          <TemplateCard
            title="Avaliação no Google"
            description="Enviada somente após o primeiro procedimento concluído da cliente."
            timing="48 horas depois"
            enabled={form.review_enabled}
            template={form.review_template}
            icon={Star}
            onEnabledChange={(value) => updateForm('review_enabled', value)}
            onTemplateChange={(value) => updateForm('review_template', value)}
          >
            <div className="space-y-2">
              <Label htmlFor="google-review-url" className="font-semibold">Link da avaliação do Google</Label>
              <Input
                id="google-review-url"
                type="url"
                inputMode="url"
                placeholder="https://g.page/r/.../review"
                value={form.google_review_url}
                onChange={(event) => updateForm('google_review_url', event.target.value)}
                disabled={!form.review_enabled}
                className="h-11 bg-background/70"
              />
              {form.review_enabled && !form.google_review_url.trim() ? (
                <p className="text-xs text-amber-600">Informe o link para este lembrete começar a ser enviado.</p>
              ) : null}
            </div>
          </TemplateCard>

          <TemplateCard
            title="Hora de retornar"
            description="Convida a cliente a agendar novamente o procedimento."
            timing="30 dias depois"
            enabled={form.return_enabled}
            template={form.return_template}
            icon={CalendarClock}
            onEnabledChange={(value) => updateForm('return_enabled', value)}
            onTemplateChange={(value) => updateForm('return_template', value)}
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {dirty ? <MessageCircle className="h-4 w-4 text-primary" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          {dirty ? 'Existem alterações que ainda não foram salvas.' : 'Todas as configurações estão salvas.'}
        </div>
        <Button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || saveMutation.isPending}
          className="min-h-11 gap-2 sm:min-w-44"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar lembretes
        </Button>
      </div>
    </div>
  );
}
