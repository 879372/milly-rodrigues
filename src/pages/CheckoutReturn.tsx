import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { publicApi } from '@/lib/api';
import BookingSuccess from '@/components/BookingSuccess';

type ConfirmResponse = {
  paid: boolean;
  slot_lost?: boolean;
  provider_error?: boolean;
  underpaid?: boolean;
  appointment: {
    service_name: string;
    barber_name: string;
    barber_phone: string;
    date: string;
    time: string;
    total_price: string;
    paid_amount: string;
    remaining_amount: string;
    portal_token: string;
  };
};

const MAX_ATTEMPTS = 12; // ~24s (webhook pode chegar depois do redirect)

export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const orderNsu = params.get('order_nsu') || '';
  const transactionNsu = params.get('transaction_nsu') || '';
  const slug = params.get('slug') || '';
  const receiptUrl = params.get('receipt_url') || '';

  const [state, setState] = useState<'checking' | 'paid' | 'unpaid' | 'provider_error' | 'underpaid' | 'slot_lost' | 'error'>('checking');
  const [data, setData] = useState<ConfirmResponse['appointment'] | null>(null);
  const lastOutcome = useRef<'unpaid' | 'provider_error' | 'underpaid'>('unpaid');
  const attempts = useRef(0);

  const check = async (): Promise<boolean> => {
    try {
      const res = await publicApi.post<ConfirmResponse>('/appointments/payment_confirm/', {
        order_nsu: orderNsu,
        transaction_nsu: transactionNsu,
        slug,
      });
      setData(res.data.appointment);
      if (res.data.slot_lost) {
        // Pagamento recebido, mas o horário foi ocupado por outra pessoa enquanto a
        // confirmação demorava. Precisa de ação da equipe — não é mais "recuperável"
        // com nova tentativa.
        setState('slot_lost');
        return true;
      }
      if (res.data.paid) {
        setState('paid');
        return true;
      }
      lastOutcome.current = res.data.underpaid ? 'underpaid' : (res.data.provider_error ? 'provider_error' : 'unpaid');
      return false;
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setState('error');
        return true;
      }
      lastOutcome.current = 'provider_error';
      return false;
    }
  };

  useEffect(() => {
    if (!orderNsu) {
      setState('error');
      return;
    }
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      attempts.current += 1;
      const done = await check();
      if (cancelled || done) return;
      if (attempts.current >= MAX_ATTEMPTS) {
        setState(lastOutcome.current);
        return;
      }
      setTimeout(tick, 2000);
    };
    tick();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNsu]);

  const recheck = async () => {
    setState('checking');
    attempts.current = MAX_ATTEMPTS - 1;
    const ok = await check();
    if (!ok) setState(lastOutcome.current);
  };

  if (state === 'paid' && data) {
    return (
      <BookingSuccess
        title={Number(data.remaining_amount) > 0.009 ? 'Entrada confirmada!' : 'Pagamento confirmado!'}
        subtitle={Number(data.remaining_amount) > 0.009
          ? `Recebemos R$ ${data.paid_amount}. Restam R$ ${data.remaining_amount} para o dia do atendimento.`
          : 'Seu horário está confirmado. Esperamos por você!'}
        serviceNames={data.service_name}
        barberName={data.barber_name}
        barberPhone={data.barber_phone}
        dateLabel={data.date}
        timeLabel={data.time}
        portalToken={data.portal_token}
        receiptUrl={receiptUrl}
      />
    );
  }

  if (state === 'slot_lost') {
    const cleanPhone = (data?.barber_phone || '').replace(/\D/g, '');
    const waPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const waMsg = `Olá! Paguei pelo agendamento (${data?.service_name || ''} em ${data?.date || ''} às ${data?.time || ''}), mas o site avisou que o horário não está mais disponível. Pode me ajudar a reagendar ou estornar?`;
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-2xl border border-border/50 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold">Recebemos seu pagamento</h2>
          <p className="text-muted-foreground text-sm">
            Só que esse horário acabou sendo ocupado por outra pessoa enquanto confirmávamos.
            Fale com a profissional pelo WhatsApp para reagendar ou receber o reembolso.
          </p>
          <Button
            className="w-full gap-2 bg-[#25D366] hover:bg-[#25D366]/90 border-none text-white"
            onClick={() => window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`, '_blank')}
          >
            Falar com a profissional (WhatsApp)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-2xl border border-border/50 text-center space-y-6">
        {state === 'checking' ? (
          <>
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-semibold">Confirmando seu pagamento...</h2>
            <p className="text-muted-foreground text-sm">Isso leva só alguns segundos.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold">
              {state === 'error' ? 'Não encontramos esse pagamento'
                : state === 'provider_error' ? 'Estamos confirmando com a InfinitePay'
                : state === 'underpaid' ? 'Valor pago não confere'
                : 'Pagamento ainda não identificado'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {state === 'error'
                ? 'O link de retorno parece inválido. Se você concluiu o pagamento, aguarde alguns minutos — o horário será confirmado automaticamente e você receberá no WhatsApp.'
                : state === 'provider_error'
                ? 'A InfinitePay está demorando a responder. Se você concluiu o pagamento, fique tranquilo: assim que confirmarmos, seu horário é reservado e você recebe uma mensagem no WhatsApp. Você pode fechar esta tela.'
                : state === 'underpaid'
                ? 'O valor recebido foi menor que o do agendamento. Fale com a profissional pelo WhatsApp para regularizar.'
                : 'Se você acabou de pagar, pode levar um instante até a confirmação. Você também receberá uma mensagem no WhatsApp quando estiver tudo certo.'}
            </p>
            <div className="space-y-3">
              {(state === 'unpaid' || state === 'provider_error') && (
                <Button className="w-full" onClick={recheck}>
                  Já paguei — verificar de novo
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => window.location.assign('/agendar')}
              >
                Voltar para o agendamento
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
