import { CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

type Props = {
  title?: string;
  subtitle?: string;
  serviceNames: string;
  barberName: string;
  barberPhone?: string;
  dateLabel: string;
  timeLabel: string;
  /** Preferido: token assinado do portal para "Ver Meus Agendamentos". */
  portalToken?: string;
  /** Fallback usado quando não há token (fluxo sem pagamento). */
  clientPhone?: string;
  /** Link do comprovante InfinitePay, quando houver. */
  receiptUrl?: string;
  waMessage?: string;
};

export default function BookingSuccess({
  title = 'Agendado!',
  subtitle = 'Seu horário foi confirmado com sucesso. Esperamos por você!',
  serviceNames,
  barberName,
  barberPhone,
  dateLabel,
  timeLabel,
  portalToken,
  clientPhone,
  receiptUrl,
  waMessage,
}: Props) {
  const navigate = useNavigate();

  const openWhatsApp = () => {
    const msg = waMessage || `Olá! Acabei de agendar ${serviceNames} para o dia ${dateLabel} às ${timeLabel}.`;
    const clean = (barberPhone || '').replace(/\D/g, '');
    const finalPhone = clean.length <= 11 ? `55${clean}` : clean;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const goToMyAppointments = () => {
    if (portalToken) navigate(`/meus-agendamentos?token=${encodeURIComponent(portalToken)}`);
    else navigate(`/meus-agendamentos?phone=${(clientPhone || '').replace(/\D/g, '')}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-2xl border border-border/50 text-center space-y-6">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-muted-foreground text-lg">{subtitle}</p>
        <div className="bg-background rounded-lg p-4 border border-border/50 text-left space-y-2">
          <p><strong>Serviço:</strong> {serviceNames}</p>
          <p><strong>Profissional:</strong> {barberName}</p>
          <p><strong>Data:</strong> {dateLabel} às {timeLabel}</p>
        </div>

        {receiptUrl && (
          <a
            href={receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" /> Ver comprovante de pagamento
          </a>
        )}

        <div className="space-y-3">
          {barberPhone && (
            <Button
              className="w-full gap-2 bg-[#25D366] hover:bg-[#25D366]/90 border-none text-white"
              onClick={openWhatsApp}
            >
              Falar com a profissional (WhatsApp)
            </Button>
          )}
          <Button variant="outline" className="w-full gap-2" onClick={goToMyAppointments}>
            Ver Meus Agendamentos
          </Button>
          <Button
            variant="ghost"
            className="w-full text-xs text-muted-foreground"
            onClick={() => window.location.assign('/agendar')}
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  );
}
