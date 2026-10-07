import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Droplets,
  GraduationCap,
  Heart,
  Instagram,
  MapPin,
  Menu,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';

const whatsapp = 'https://wa.me/5584999279661';
const instagram = 'https://www.instagram.com/depilacao_millyrodrigues/';

const features = [
  { icon: Droplets, title: 'Sai com água', text: 'A cera hidrossolúvel é removida facilmente, sem deixar a pele grudenta ou com resíduos.' },
  { icon: Heart, title: 'Mais conforto', text: 'Aplicada em temperatura morna, a técnica é gentil com a pele e torna o cuidado mais tranquilo.' },
  { icon: ShieldCheck, title: 'Higiene em primeiro lugar', text: 'Materiais individuais e ambiente preparado para receber cada cliente com segurança.' },
  { icon: UserRound, title: 'Atendimento humanizado', text: 'Sem pressa e sem julgamentos: cada atendimento respeita seu tempo, sua pele e seus limites.' },
];

const careSteps = [
  { number: '01', title: 'Antes', items: ['Chegue no horário para aproveitar todo o atendimento.', 'Evite hidratantes e óleos na região no dia.', 'Pelos entre 3 e 5 mm favorecem um resultado melhor.'] },
  { number: '02', title: 'Agendamento', items: ['Escolha seu atendimento e horário pelo agendamento online.', 'Cancelamentos ou remarcações devem respeitar a antecedência informada.', 'Quando houver sinal, o horário é confirmado após o pagamento.'] },
  { number: '03', title: 'Depois', items: ['Evite sol, piscina e mar nas primeiras 24 a 48 horas.', 'Prefira roupas leves e reduza o atrito na região.', 'Mantenha hidratação e esfoliação conforme a orientação recebida.'] },
];

const faqs = [
  ['A depilação hidrossolúvel dói?', 'Cada pele reage de um jeito, mas a cera é aplicada morna e costuma ser mais gentil. A técnica correta e um atendimento sem pressa ajudam a reduzir bastante o desconforto.'],
  ['Posso fazer depilação se tenho pele sensível?', 'A avaliação é individual. Conte sobre sua sensibilidade e qualquer tratamento em uso para que o atendimento seja adaptado com segurança.'],
  ['Como devo me preparar?', 'Evite cremes e óleos na região no dia e prefira roupas confortáveis. As orientações específicas também aparecem durante o agendamento.'],
  ['Posso depilar menstruada?', 'Pode sim, usando absorvente interno ou coletor. Nesse período a pele pode estar mais sensível, então avise no atendimento.'],
  ['Com que frequência devo agendar?', 'Em geral, o intervalo fica entre 20 e 30 dias. A frequência ideal varia conforme o crescimento dos pelos e a resposta da sua pele.'],
];

const openingHours = [
  ['Segunda', '09:30 – 18:00'],
  ['Terça', 'Fechado'],
  ['Quarta', '14:00 – 18:00'],
  ['Quinta', 'Fechado'],
  ['Sexta', '14:00 – 20:00'],
  ['Sábado', '08:00 – 12:00'],
  ['Domingo', 'Fechado'],
];

function BookingLink({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <Link to="/agendar" className={className}>{children}</Link>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/45 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#inicio" onClick={closeMenu} className="flex items-center gap-3" aria-label="Milly Rodrigues - início">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary font-display text-lg font-semibold text-primary-foreground shadow-soft">MR</div>
            <div className="hidden leading-none min-[390px]:block">
              <p className="font-display text-xl font-semibold">Milly Rodrigues</p>
              <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.24em] text-primary/70">Depilação &amp; Estética</p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex" aria-label="Navegação principal">
            <a href="#metodo" className="transition-colors hover:text-primary">O método</a>
            <a href="#cuidados" className="transition-colors hover:text-primary">Cuidados</a>
            <a href="#curso" className="transition-colors hover:text-primary">Curso VIP</a>
            <a href="#duvidas" className="transition-colors hover:text-primary">Dúvidas</a>
            <a href="#contato" className="transition-colors hover:text-primary">Contato</a>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link to="/login" className="rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground">Área da equipe</Link>
            <BookingLink className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5">
              <CalendarDays className="h-4 w-4" /> Agendar
            </BookingLink>
          </div>

          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="grid h-11 w-11 place-items-center rounded-xl border border-border/60 bg-card lg:hidden" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-border/50 bg-card px-4 pb-5 pt-3 shadow-lift lg:hidden">
            <nav className="mx-auto grid max-w-7xl gap-1 text-sm font-medium">
              {[['O método', '#metodo'], ['Cuidados', '#cuidados'], ['Curso VIP', '#curso'], ['Dúvidas', '#duvidas'], ['Contato', '#contato']].map(([label, href]) => (
                <a key={href} href={href} onClick={closeMenu} className="rounded-xl px-3 py-3 hover:bg-secondary/60">{label}</a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
                <Link to="/login" onClick={closeMenu} className="grid min-h-11 place-items-center rounded-xl border border-border text-xs font-semibold">Área da equipe</Link>
                <BookingLink className="grid min-h-11 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">Agendar</BookingLink>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section id="inicio" className="relative flex min-h-screen items-center overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-32">
          <div className="absolute -right-40 top-0 h-[34rem] w-[34rem] rounded-full bg-secondary/70 blur-3xl" />
          <div className="absolute -left-48 bottom-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:gap-20 lg:px-8">
            <div className="order-2 lg:order-1">
              <span className="eyebrow">Especialista em depilação · Natal/RN</span>
              <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[.92] tracking-tight sm:text-7xl lg:text-[5.6rem]">
                Cuidado sem traumas, <span className="italic text-primary">do seu jeito.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">Depilação hidrossolúvel com atendimento humanizado, pensado para você se sentir confortável, segura e bem cuidada do início ao fim.</p>
              <div className="mt-8 flex flex-col gap-3 min-[430px]:flex-row">
                <BookingLink className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5">
                  <CalendarDays className="h-4 w-4" /> Agendar meu horário <ArrowRight className="h-4 w-4" />
                </BookingLink>
                <a href={`${whatsapp}?text=Ol%C3%A1%20Milly!%20Tenho%20uma%20d%C3%BAvida.`} target="_blank" rel="noreferrer" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-card/65 px-6 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary/60">
                  <MessageCircle className="h-4 w-4" /> Tirar uma dúvida
                </a>
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 border-t border-border/60 pt-6">
                <div><strong className="font-display text-2xl font-semibold sm:text-3xl">3 mil+</strong><p className="mt-1 text-[10px] leading-tight text-muted-foreground sm:text-xs">seguidores no Instagram</p></div>
                <div><strong className="font-display text-2xl font-semibold sm:text-3xl">100%</strong><p className="mt-1 text-[10px] leading-tight text-muted-foreground sm:text-xs">método hidrossolúvel</p></div>
                <div><strong className="font-display text-2xl font-semibold sm:text-3xl">Natal</strong><p className="mt-1 text-[10px] leading-tight text-muted-foreground sm:text-xs">Zona Norte/RN</p></div>
              </div>
            </div>

            <div className="order-1 mx-auto w-[min(82vw,420px)] lg:order-2 lg:mr-2 lg:w-full lg:max-w-[470px]">
              <div className="relative">
                <div className="absolute -inset-3 translate-x-5 translate-y-5 rounded-[12rem_12rem_2.5rem_2.5rem] border border-accent/60" />
                <div className="relative aspect-[4/5] overflow-hidden rounded-[12rem_12rem_2.5rem_2.5rem] border border-white/70 bg-secondary shadow-lift">
                  <img src="/milly.jpg" alt="Milly Rodrigues, especialista em depilação" className="h-full w-full object-cover object-center" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/65 to-transparent px-5 pb-5 pt-20 text-primary-foreground">
                    <p className="font-display text-2xl font-semibold">Milly Rodrigues</p>
                    <p className="text-xs opacity-85">Cuidado técnico, próximo e respeitoso</p>
                  </div>
                </div>
                <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border border-white/70 bg-card/95 px-4 py-3 shadow-lift sm:-left-8">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <p className="text-xs font-semibold leading-tight">Atendimento<br />humanizado</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="overflow-hidden bg-primary py-4 text-primary-foreground">
          <div className="flex min-w-max items-center gap-7 px-5 font-display text-xl italic opacity-95 sm:text-2xl">
            <span>Conforto de verdade</span><Sparkles className="h-4 w-4 text-accent" />
            <span>Pele limpa e bem cuidada</span><Sparkles className="h-4 w-4 text-accent" />
            <span>Respeito ao seu tempo</span><Sparkles className="h-4 w-4 text-accent" />
            <span>Experiência sem julgamentos</span><Sparkles className="h-4 w-4 text-accent" />
            <span>Conforto de verdade</span>
          </div>
        </div>

        <section id="metodo" className="py-20 sm:py-28">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:gap-20 lg:px-8">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <span className="eyebrow">O método</span>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-none sm:text-6xl">Por que a cera <span className="italic text-primary">hidrossolúvel?</span></h2>
              <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">Aplicada morna e removida com água, ela não deixa resíduos na pele. É uma escolha acolhedora para quem tem pele sensível, receio de dor ou experiências ruins anteriores.</p>
              <a href={`${whatsapp}?text=Ol%C3%A1%20Milly!%20Tenho%20uma%20d%C3%BAvida%20sobre%20a%20depila%C3%A7%C3%A3o%20hidrossol%C3%BAvel.`} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Conversar sobre o método <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft transition-transform hover:-translate-y-1 sm:p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary"><Icon className="h-5 w-5" /></div>
                  <h3 className="mt-5 font-display text-2xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border/50 bg-card/60 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <span className="eyebrow">@depilacao_millyrodrigues</span>
            <h2 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-semibold leading-none sm:text-6xl">Resultados, orientações e <span className="italic text-primary">cuidado real.</span></h2>
            <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-muted-foreground">Acompanhe o dia a dia, veja resultados e encontre dicas para cuidar da pele antes e depois do atendimento.</p>
            <div className="mx-auto mt-9 grid max-w-2xl grid-cols-3 gap-3">
              {['Resultados', 'Cuidados', 'Bastidores'].map((label, index) => (
                <a key={label} href={instagram} target="_blank" rel="noreferrer" className="group flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-background/55 p-4 text-xs font-semibold text-muted-foreground transition-all hover:-translate-y-1 hover:text-primary hover:shadow-soft">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/[0.08] ring-1 ring-primary/10">
                    {index === 0 ? <Sparkles className="h-5 w-5" /> : index === 1 ? <Heart className="h-5 w-5" /> : <Instagram className="h-5 w-5" />}
                  </span>{label}
                </a>
              ))}
            </div>
            <a href={instagram} target="_blank" rel="noreferrer" className="mt-8 inline-flex h-12 items-center gap-2 rounded-2xl border border-primary/25 px-5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
              <Instagram className="h-4 w-4" /> Seguir no Instagram
            </a>
          </div>
        </section>

        <section id="cuidados" className="bg-secondary/65 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="eyebrow">Antes, durante e depois</span>
            <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <h2 className="max-w-2xl font-display text-4xl font-semibold leading-none sm:text-6xl">Uma experiência melhor começa com <span className="italic text-primary">bons cuidados.</span></h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Orientações simples ajudam a proteger a pele e garantir um resultado mais confortável.</p>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {careSteps.map((step) => (
                <article key={step.number} className="rounded-3xl border border-white/75 bg-card/90 p-6 shadow-soft sm:p-7">
                  <span className="font-display text-5xl italic text-accent">{step.number}</span>
                  <h3 className="mt-2 font-display text-3xl font-semibold">{step.title}</h3>
                  <ul className="mt-5 space-y-3">
                    {step.items.map((item) => <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" />{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="curso" className="py-20 sm:py-28">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#3b2922] px-6 py-10 text-[#fffaf5] shadow-lift sm:px-10 sm:py-14 lg:grid lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-16 lg:px-16 lg:py-16">
              <GraduationCap className="absolute -bottom-14 -right-10 h-64 w-64 text-white/[0.035]" />
              <div className="relative">
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c8998a]">Para profissionais</span>
                <h2 className="mt-3 font-display text-4xl font-semibold leading-none sm:text-6xl">Curso <span className="italic text-[#c8998a]">VIP</span> de depilação</h2>
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#d9cbc0] sm:text-base">Aprenda o método hidrossolúvel de forma prática e próxima, com atenção à técnica, à segurança e à experiência de cada cliente.</p>
                <a href={`${whatsapp}?text=Ol%C3%A1%20Milly!%20Tenho%20interesse%20no%20Curso%20VIP%20de%20depila%C3%A7%C3%A3o.`} target="_blank" rel="noreferrer" className="mt-7 inline-flex h-12 items-center gap-2 rounded-2xl bg-[#fffaf5] px-5 text-sm font-semibold text-[#3b2922] transition-transform hover:-translate-y-0.5">
                  Quero saber mais <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <ul className="relative mt-9 grid gap-3 lg:mt-0">
                {['Técnica hidrossolúvel na prática', 'Atendimento humanizado', 'Biossegurança e higiene', 'Acompanhamento próximo e individual'].map((item) => (
                  <li key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm"><Sparkles className="h-4 w-4 shrink-0 text-[#c8998a]" />{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="duvidas" className="border-y border-border/50 bg-card/55 py-20 sm:py-28">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[.75fr_1.25fr] lg:gap-20 lg:px-8">
            <div>
              <span className="eyebrow">Dúvidas frequentes</span>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-none sm:text-6xl">Informação também é <span className="italic text-primary">cuidado.</span></h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">Se sua dúvida não estiver aqui, fale diretamente pelo WhatsApp.</p>
            </div>
            <div>
              {faqs.map(([question, answer], index) => (
                <details key={question} open={index === 0} className="group border-b border-border/70 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-semibold sm:text-2xl">
                    {question}<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary font-sans text-lg font-normal text-primary transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-2xl pt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="contato" className="py-20 sm:py-28">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-12 lg:px-8">
            <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-soft sm:p-8">
              <span className="eyebrow">Visite o espaço</span>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">Vem se <span className="italic text-primary">cuidar.</span></h2>
              <div className="mt-7 space-y-6">
                <div className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">Zona Norte · Natal/RN</p><p className="mt-1 text-sm text-muted-foreground">Av. Dr. João Medeiros Filho, 3939</p></div></div>
                <div className="flex gap-3"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div className="w-full"><p className="mb-3 text-sm font-semibold">Horários</p><div className="space-y-2">{openingHours.map(([day, hour]) => <div key={day} className="flex justify-between gap-4 border-b border-dotted border-border pb-1 text-xs"><span>{day}</span><span className={hour === 'Fechado' ? 'text-muted-foreground' : 'font-medium'}>{hour}</span></div>)}</div></div></div>
              </div>
              <div className="mt-8 grid gap-2 min-[430px]:grid-cols-2">
                <BookingLink className="grid min-h-12 place-items-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft">Agendar online</BookingLink>
                <a href="https://www.google.com/maps/search/?api=1&query=Av.+Dr.+Jo%C3%A3o+Medeiros+Filho,+3939,+Natal+RN" target="_blank" rel="noreferrer" className="grid min-h-12 place-items-center rounded-2xl border border-primary/25 px-4 text-sm font-semibold text-primary">Como chegar</a>
              </div>
            </div>
            <div className="min-h-[420px] overflow-hidden rounded-3xl border border-border/60 bg-secondary shadow-soft">
              <iframe loading="lazy" title="Mapa - Milly Rodrigues em Natal/RN" src="https://www.google.com/maps?q=Av.+Dr.+Jo%C3%A3o+Medeiros+Filho,+3939,+Natal+-+RN&output=embed" className="h-full min-h-[420px] w-full grayscale-[.3]" />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#2b211c] px-4 py-10 text-[#bfb2a8] sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-display text-2xl font-semibold text-[#fffaf5]">Milly Rodrigues</p><p className="mt-1 text-[9px] uppercase tracking-[0.24em] text-[#c8998a]">Depilação &amp; Estética</p></div>
          <p className="text-xs">© {new Date().getFullYear()} Milly Rodrigues · Natal/RN</p>
          <div className="flex gap-2">
            <a href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 hover:bg-white/10"><Instagram className="h-4 w-4" /></a>
            <a href={whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 hover:bg-white/10"><MessageCircle className="h-4 w-4" /></a>
          </div>
        </div>
      </footer>

      <a href={`${whatsapp}?text=Ol%C3%A1%2C%20gostaria%20de%20tirar%20uma%20d%C3%BAvida.`} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp" className="fixed bottom-5 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lift transition-transform hover:scale-105 sm:bottom-6 sm:right-6">
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}
