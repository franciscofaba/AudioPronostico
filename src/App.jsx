import { useMemo, useState } from 'react'
import {
  Activity, AlertCircle, ArrowRight, BarChart3, BookOpen, Check,
  ChevronDown, Clock3, Ear, FileDown, HeartPulse, Info, RotateCcw,
  ShieldCheck, Sparkles, Stethoscope, TrendingUp, UserRound,
} from 'lucide-react'

const diaoOptions = {
  age: [['< 30', 0], ['30–39', 1], ['40–49', 2], ['50–59', 3], ['≥ 60', 4]],
  therapy: [['< 3', 0], ['3–7', 1], ['≥ 7', 3]],
  pta: [['≤ 40', 0], ['≤ 60', 1], ['≤ 80', 2], ['≤ 90', 3], ['> 90', 4]],
  shape: [['Ascendente', 0], ['Plana / Horizontal', 1], ['Descendente', 2], ['Profunda', 3]],
  vertigo: [['No', 0], ['Sí', 1]],
}

const coefficients = { age: 1.2, therapy: 1.6, pta: 1.3, shape: 2.3, vertigo: 2.8 }

const initialPatient = {
  name: '', age: 45, vertigo: 'No', presentation: '3-7 Días',
  affectedPta: 60, healthyPta: 15, wrs: 50,
  diaoAge: '40–49', diaoTherapy: '3–7', diaoPta: '≤ 60', diaoShape: 'Plana / Horizontal', diaoVertigo: 'No',
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))
const pointsFor = (list, value) => list.find(([label]) => label === value)?.[1] ?? 0

function calculateDiao(patient) {
  const parts = {
    age: pointsFor(diaoOptions.age, patient.diaoAge) * coefficients.age,
    therapy: pointsFor(diaoOptions.therapy, patient.diaoTherapy) * coefficients.therapy,
    pta: pointsFor(diaoOptions.pta, patient.diaoPta) * coefficients.pta,
    shape: pointsFor(diaoOptions.shape, patient.diaoShape) * coefficients.shape,
    vertigo: pointsFor(diaoOptions.vertigo, patient.diaoVertigo) * coefficients.vertigo,
  }
  const total = Object.values(parts).reduce((sum, value) => sum + value, 0)
  if (total < 5) return { parts, total, probability: 81.4, risk: 'Riesgo bajo', prognosis: 'Excelente pronóstico', tone: 'good' }
  if (total >= 12) return { parts, total, probability: 10.1, risk: 'Riesgo alto', prognosis: 'Pronóstico pobre', tone: 'bad' }
  return { parts, total, probability: 31, risk: 'Riesgo moderado', prognosis: 'Pronóstico reservado', tone: 'medium' }
}

function calculateSeo(patient) {
  const presentationPoints = { '≤ 3 Días': 18, '3-7 Días': 14, '8-14 Días': 8, '15-28 Días': 4, '> 28 Días': 0 }
  const parts = {
    age: Math.max(0, (90 - clamp(patient.age, 0, 110)) * 0.3),
    vertigo: patient.vertigo === 'No' ? 11 : 0,
    presentation: presentationPoints[patient.presentation] ?? 0,
    affectedPta: Math.max(0, (100 - clamp(patient.affectedPta, 0, 120)) * 0.51),
    healthyPta: Math.max(0, (100 - clamp(patient.healthyPta, 0, 120)) * 0.63),
    wrs: Math.max(0, (clamp(patient.wrs, 0, 100) - 20) * 0.125),
  }
  const total = Object.values(parts).reduce((sum, value) => sum + value, 0)
  const probability = Math.min(99, Math.max(1, ((total - 40) / 200) * 100))
  return { parts, total, probability }
}

function SelectField({ label, value, options, onChange }) {
  return <label className="block">
    <span className="label">{label}</span>
    <span className="relative block">
      <select className="field appearance-none pr-9" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
    </span>
  </label>
}

function NumberField({ label, value, min, max, suffix, onChange }) {
  return <label className="block">
    <span className="label">{label}</span>
    <span className="relative block">
      <input className="field pr-12" type="number" min={min} max={max} value={value} onChange={e => onChange(clamp(e.target.value, min, max))} />
      <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400">{suffix}</span>
    </span>
  </label>
}

function ProbabilityRing({ value, color = '#278474', size = 174 }) {
  const radius = 68
  const circumference = 2 * Math.PI * radius
  const dash = circumference * value / 100
  return <div className="relative grid place-items-center" style={{ width: size, height: size }}>
    <svg className="-rotate-90" width={size} height={size} viewBox="0 0 174 174" aria-label={`${value.toFixed(1)} por ciento`}>
      <circle cx="87" cy="87" r={radius} fill="none" stroke="#e9efec" strokeWidth="12" />
      <circle cx="87" cy="87" r={radius} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${dash} ${circumference - dash}`} className="transition-all duration-700" />
    </svg>
    <div className="absolute text-center">
      <span className="font-display text-4xl font-extrabold tracking-tight">{Math.round(value)}</span><span className="font-display text-xl font-bold">%</span>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">probabilidad</p>
    </div>
  </div>
}

function ContributionBar({ label, value, max, accent = 'bg-teal-500' }) {
  return <div>
    <div className="mb-1.5 flex items-center justify-between text-xs">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="font-bold tabular-nums text-ink">{value.toFixed(1)} pts</span>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${accent} transition-all duration-500`} style={{ width: `${Math.min(100, value / max * 100)}%` }} />
    </div>
  </div>
}

function ModelPill({ active, children, onClick }) {
  return <button onClick={onClick} className={`min-h-10 min-w-0 rounded-full px-2 text-xs font-bold transition sm:px-4 sm:text-sm ${active ? 'bg-ink text-white shadow-lg shadow-ink/15' : 'text-slate-500 hover:bg-white'}`}>{children}</button>
}

function App() {
  const [patient, setPatient] = useState(initialPatient)
  const [model, setModel] = useState('comparison')
  const [details, setDetails] = useState(false)
  const [patientOpen, setPatientOpen] = useState(true)
  const diao = useMemo(() => calculateDiao(patient), [patient])
  const seo = useMemo(() => calculateSeo(patient), [patient])
  const update = (key, value) => setPatient(current => ({ ...current, [key]: value }))
  const average = (diao.probability + seo.probability) / 2
  const overallLabel = average >= 60 ? 'Favorable' : average >= 30 ? 'Intermedio' : 'Desfavorable'
  const overallTone = average >= 60 ? 'text-teal-600 bg-teal-50' : average >= 30 ? 'text-amber-700 bg-amber-50' : 'text-coral bg-red-50'

  const reset = () => setPatient(initialPatient)

  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(39,132,116,.12),_transparent_32%),linear-gradient(180deg,#f7f9f6_0%,#eef2ee_100%)]">
    <header className="no-print sticky top-0 z-50 border-b border-white/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between px-3 py-3 sm:px-5 sm:py-4 lg:px-9">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-700 text-white shadow-lg shadow-teal-700/20 sm:h-10 sm:w-10"><Ear className="h-5 w-5" /></div>
          <div className="min-w-0"><p className="truncate font-display text-base font-extrabold leading-none tracking-tight sm:text-lg">AudioPronóstico</p><p className="mt-1 hidden text-[10px] font-bold uppercase tracking-[.18em] text-teal-600 min-[380px]:block">Soporte clínico</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Restablecer datos" onClick={reset} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 sm:flex sm:w-auto sm:gap-2 sm:px-3 sm:text-sm sm:font-semibold"><RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">Restablecer</span></button>
          <button aria-label="Guardar informe" onClick={() => window.print()} className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-white shadow-lg shadow-ink/15 transition hover:-translate-y-0.5 sm:flex sm:w-auto sm:gap-2 sm:px-4 sm:text-sm sm:font-bold"><FileDown className="h-4 w-4" /><span className="hidden sm:inline">Guardar informe</span></button>
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-[1480px] px-3 py-5 sm:px-5 sm:py-7 lg:px-9 lg:py-9">
      <section className="mb-5 flex min-w-0 flex-col justify-between gap-5 sm:mb-7 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-teal-600"><Sparkles className="h-4 w-4" /> Informe interactivo</div>
          <h1 className="max-w-3xl font-display text-[1.75rem] font-extrabold leading-[1.12] tracking-[-.035em] text-ink sm:text-3xl md:text-4xl">Pronóstico de recuperación auditiva</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">Estimación de curación completa en hipoacusia súbita neurosensorial unilateral idiopática.</p>
        </div>
        <div className="grid w-full grid-cols-3 items-center gap-1 rounded-full border border-white bg-white/80 p-1.5 shadow-sm sm:w-auto sm:gap-2 lg:self-auto">
          <ModelPill active={model === 'comparison'} onClick={() => setModel('comparison')}>Comparar</ModelPill>
          <ModelPill active={model === 'diao'} onClick={() => setModel('diao')}>Diao 2025</ModelPill>
          <ModelPill active={model === 'seo'} onClick={() => setModel('seo')}>Seo 2026</ModelPill>
        </div>
      </section>

      <div className="grid min-w-0 gap-4 sm:gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="card no-print h-fit overflow-hidden xl:sticky xl:top-24">
          <div className={`${patientOpen ? 'border-b' : ''} border-slate-100 px-5 py-4 sm:px-6 sm:py-5 xl:border-b`}>
            <div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><UserRound className="h-5 w-5" /></div><div className="min-w-0"><h2 className="font-display text-base font-extrabold">Datos del paciente</h2><p className="truncate text-xs text-slate-400">Los resultados se actualizan al instante</p></div></div><button aria-label={patientOpen ? 'Ocultar datos del paciente' : 'Mostrar datos del paciente'} onClick={() => setPatientOpen(v => !v)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500 xl:hidden"><ChevronDown className={`h-5 w-5 transition-transform ${patientOpen ? 'rotate-180' : ''}`} /></button></div>
          </div>
          <div className={`${patientOpen ? 'block' : 'hidden'} space-y-5 p-5 sm:p-6 xl:block`}>
            <label className="block"><span className="label">Nombre o identificador <span className="normal-case tracking-normal text-slate-400">(opcional)</span></span><input className="field" placeholder="Ej. Paciente 001" value={patient.name} onChange={e => update('name', e.target.value)} /></label>
            <div className="grid gap-3 min-[420px]:grid-cols-2"><NumberField label="Edad" value={patient.age} min={0} max={110} suffix="años" onChange={v => update('age', v)} /><SelectField label="Vértigo" value={patient.vertigo} options={['No', 'Sí']} onChange={v => update('vertigo', v)} /></div>
            <SelectField label="Tiempo inicio–consulta" value={patient.presentation} options={['≤ 3 Días', '3-7 Días', '8-14 Días', '15-28 Días', '> 28 Días']} onChange={v => update('presentation', v)} />
            <div className="grid gap-3 min-[420px]:grid-cols-2"><NumberField label="PTA afectado" value={patient.affectedPta} min={0} max={120} suffix="dB" onChange={v => update('affectedPta', v)} /><NumberField label="PTA sano" value={patient.healthyPta} min={0} max={120} suffix="dB" onChange={v => update('healthyPta', v)} /></div>
            <NumberField label="WRS inicial oído afectado" value={patient.wrs} min={0} max={100} suffix="%" onChange={v => update('wrs', v)} />
            <div className="rounded-xl bg-teal-50 p-3.5 text-xs leading-relaxed text-teal-900"><div className="flex gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" /><span>Estos valores alimentan el nomograma Seo. Diao usa categorías propias disponibles en su panel.</span></div></div>
          </div>
        </aside>

        <div className="min-w-0 space-y-4 sm:space-y-6">
          <section className="card overflow-hidden bg-ink text-white">
            <div className="grid lg:grid-cols-[1.05fr_.95fr]">
              <div className="relative overflow-hidden p-5 sm:p-7 lg:p-9">
                <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-teal-100"><HeartPulse className="h-4 w-4" /> Lectura general</div>
                  <div className="mt-5 flex flex-wrap items-end gap-3 sm:gap-4"><h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">{overallLabel}</h2><span className={`mb-1 rounded-full px-3 py-1 text-[11px] font-bold sm:text-xs ${overallTone}`}>Promedio descriptivo {average.toFixed(1)}%</span></div>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">Los modelos entregan estimaciones independientes. La concordancia y las diferencias deben interpretarse junto con la evaluación clínica completa.</p>
                  <div className="mt-7 grid grid-cols-3 divide-x divide-white/10">
                    <div className="pr-2"><p className="text-[10px] text-slate-400 sm:text-xs">Diao 2025</p><p className="mt-1 font-display text-lg font-extrabold sm:text-2xl">{diao.probability.toFixed(1)}%</p></div>
                    <div className="px-3 sm:px-6"><p className="text-[10px] text-slate-400 sm:text-xs">Seo 2026</p><p className="mt-1 font-display text-lg font-extrabold sm:text-2xl">{seo.probability.toFixed(1)}%</p></div>
                    <div className="pl-3 sm:pl-6"><p className="text-[10px] text-slate-400 sm:text-xs">Diferencia</p><p className="mt-1 whitespace-nowrap font-display text-lg font-extrabold sm:text-2xl">{Math.abs(diao.probability - seo.probability).toFixed(1)} <span className="text-xs sm:text-sm">pts</span></p></div>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 bg-white/[.04] p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-9">
                <div className="mb-5 flex items-center justify-between"><h3 className="text-sm font-bold">Comparación de modelos</h3><BarChart3 className="h-5 w-5 text-teal-300" /></div>
                {[['Diao', diao.probability, 'bg-teal-400'], ['Seo', seo.probability, 'bg-coral']].map(([name, value, color]) => <div className="mb-5" key={name}>
                  <div className="mb-2 flex justify-between text-xs"><span className="text-slate-300">{name}</span><span className="font-bold">{value.toFixed(1)}%</span></div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${value}%` }} /></div>
                </div>)}
                <div className="mt-7 flex justify-between border-t border-white/10 pt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><span>0% bajo</span><span>100% alto</span></div>
              </div>
            </div>
          </section>

          {(model === 'comparison' || model === 'diao') && <section className="card fade-up overflow-hidden">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:p-6 md:flex-row md:items-center lg:px-8">
              <div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Activity className="h-5 w-5" /></div><div className="min-w-0"><h2 className="font-display text-lg font-extrabold">Modelo Diao 2025</h2><p className="text-xs text-slate-400">Score ponderado de 5 variables clínicas</p></div></div>
              <span className={`self-start rounded-full px-3 py-1.5 text-xs font-bold ${diao.tone === 'good' ? 'bg-teal-50 text-teal-700' : diao.tone === 'bad' ? 'bg-red-50 text-coral' : 'bg-amber-50 text-amber-700'}`}>{diao.risk}</span>
            </div>
            <div className="grid lg:grid-cols-[1.15fr_.85fr]">
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:p-8">
                <SelectField label="Edad (rango)" value={patient.diaoAge} options={diaoOptions.age.map(x => x[0])} onChange={v => update('diaoAge', v)} />
                <SelectField label="Inicio–terapia (días)" value={patient.diaoTherapy} options={diaoOptions.therapy.map(x => x[0])} onChange={v => update('diaoTherapy', v)} />
                <SelectField label="Nivel inicial PTA (dB)" value={patient.diaoPta} options={diaoOptions.pta.map(x => x[0])} onChange={v => update('diaoPta', v)} />
                <SelectField label="Forma del audiograma" value={patient.diaoShape} options={diaoOptions.shape.map(x => x[0])} onChange={v => update('diaoShape', v)} />
                <SelectField label="Vértigo concomitante" value={patient.diaoVertigo} options={diaoOptions.vertigo.map(x => x[0])} onChange={v => update('diaoVertigo', v)} />
                <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/50 p-4"><p className="label">Puntaje total</p><p className="font-display text-3xl font-extrabold text-teal-700">{diao.total.toFixed(1)} <span className="text-sm font-semibold text-teal-600">pts</span></p></div>
              </div>
              <div className="flex flex-col items-center justify-center border-t border-slate-100 bg-slate-50/70 p-5 sm:p-7 lg:border-l lg:border-t-0">
                <ProbabilityRing value={diao.probability} color={diao.tone === 'good' ? '#278474' : diao.tone === 'bad' ? '#eb735b' : '#d3992f'} />
                <p className="mt-2 font-display text-lg font-extrabold">{diao.prognosis}</p>
                <p className="mt-1 text-center text-xs text-slate-400">Tasa estimada de curación completa · PTA final &lt; 25 dB</p>
              </div>
            </div>
          </section>}

          {(model === 'comparison' || model === 'seo') && <section className="card fade-up overflow-hidden">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:p-6 md:flex-row md:items-center lg:px-8">
              <div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-coral"><TrendingUp className="h-5 w-5" /></div><div className="min-w-0"><h2 className="font-display text-lg font-extrabold">Nomograma Seo 2026</h2><p className="text-xs text-slate-400">Proyección matemática individualizada · AUC reportada 0.858</p></div></div>
              <span className="self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{seo.total.toFixed(1)} puntos</span>
            </div>
            <div className="grid lg:grid-cols-[.8fr_1.2fr]">
              <div className="flex flex-col items-center justify-center border-b border-slate-100 bg-slate-50/70 p-5 sm:p-7 lg:border-b-0 lg:border-r">
                <ProbabilityRing value={seo.probability} color="#eb735b" />
                <p className="mt-2 font-display text-lg font-extrabold">Criterio Siegel</p>
                <p className="mt-1 text-center text-xs text-slate-400">Probabilidad estimada de recuperación completa</p>
              </div>
              <div className="min-w-0 p-5 sm:p-6 lg:p-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold">Aporte de cada variable</h3><button onClick={() => setDetails(v => !v)} className="min-h-10 rounded-lg px-2 text-xs font-bold text-teal-600 hover:bg-teal-50 hover:text-teal-700">{details ? 'Ocultar detalle' : 'Ver fórmulas'}</button></div>
                <div className="space-y-4">
                  <ContributionBar label="Reserva auditiva (oído sano)" value={seo.parts.healthyPta} max={63} />
                  <ContributionBar label="PTA oído afectado" value={seo.parts.affectedPta} max={51} />
                  <ContributionBar label="Tiempo a consulta" value={seo.parts.presentation} max={18} accent="bg-coral" />
                  <ContributionBar label="Edad" value={seo.parts.age} max={27} />
                  <ContributionBar label="Ausencia de vértigo" value={seo.parts.vertigo} max={11} accent="bg-coral" />
                  <ContributionBar label="WRS inicial" value={seo.parts.wrs} max={10} />
                </div>
                {details && <div className="mt-6 grid min-w-0 gap-2 overflow-x-auto rounded-xl bg-slate-50 p-4 font-mono text-[11px] leading-5 text-slate-500"><span>Edad: max(0, (90 − edad) × 0.3)</span><span>PTA afectado: max(0, (100 − PTA) × 0.51)</span><span>PTA sano: max(0, (100 − PTA) × 0.63)</span><span>WRS: max(0, (WRS − 20) × 0.125)</span><span>Probabilidad: min(99%, max(1%, (total − 40) ÷ 200))</span></div>}
              </div>
            </div>
          </section>}

          <section className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
            <div className="card p-5 sm:p-6 lg:p-8">
              <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><Stethoscope className="h-5 w-5" /></div><div><h2 className="font-display font-extrabold">Orientación clínica</h2><p className="text-xs text-slate-400">Según la estratificación de la planilla</p></div></div>
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                {diao.total < 5 && <p>El modelo Diao asocia este perfil con una respuesta excelente al tratamiento convencional y señala un régimen estándar de corticosteroides.</p>}
                {diao.total >= 5 && diao.total < 12 && <p>El modelo Diao sugiere seguimiento estrecho con audiometría en los días 3 y 7, y evaluar rescate intratimpánico temprano si no existe ganancia.</p>}
                {diao.total >= 12 && <p>El modelo Diao identifica un pronóstico pobre y plantea considerar terapia combinada intensa desde el inicio.</p>}
                {seo.probability < 30 && <div className="flex gap-3 rounded-xl bg-red-50 p-4 text-red-900"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-coral" /><p>Seo estima menos de 30%; la planilla sugiere considerar protocolos agresivos sistémicos e intratimpánicos desde el día 1.</p></div>}
                {seo.probability >= 30 && <div className="flex gap-3 rounded-xl bg-teal-50 p-4 text-teal-900"><Check className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" /><p>La estimación Seo se mantiene sobre el umbral de alerta del 30% definido en la planilla.</p></div>}
              </div>
            </div>
            <div className="card p-5 sm:p-6 lg:p-8">
              <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><ShieldCheck className="h-5 w-5" /></div><h2 className="font-display font-extrabold">Uso responsable</h2></div>
              <ul className="space-y-3 text-sm leading-5 text-slate-500">
                {['Herramienta de apoyo, no reemplaza el juicio clínico.', 'Confirmar datos con la ficha y audiometría del paciente.', 'Interpretar ambos modelos de forma independiente.', 'Documentar siempre la decisión terapéutica final.'].map(text => <li key={text} className="flex gap-2.5"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />{text}</li>)}
              </ul>
            </div>
          </section>

          <section className="card p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex min-w-0 items-start gap-3"><BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" /><div className="min-w-0"><h2 className="font-display text-sm font-extrabold">Base del informe</h2><p className="mt-1 text-xs leading-5 text-slate-400">Diao et al. (2025), 748 pacientes · Seo et al. (2026), 1.108 pacientes</p></div></div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400"><Clock3 className="h-4 w-4" /> Modelo clínico v1.0 · 01 sep 2026</div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
}

export default App
