'use client'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Bot,
  Users,
  BookOpen,
  Award,
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
  Smartphone,
  GraduationCap,
  ShieldCheck,
  BarChart3,
  QrCode,
  Link2,
  Building2,
  Flame,
  MessageSquare,
} from 'lucide-react'

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")"

/* Scroll-reveal wrapper */
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
    >
      {children}
    </div>
  )
}

/* Section label: thin rule + tracked caps */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="h-px w-8 bg-gradient-to-r from-red-500 to-transparent" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">
        {children}
      </span>
    </div>
  )
}

/* Checkmark bullet row */
function CheckRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-rose-500 shadow-sm shadow-rose-200 flex items-center justify-center flex-shrink-0">
        <CheckCircle className="w-3 h-3 text-white" />
      </span>
      <span className="text-[15px] text-gray-700 leading-relaxed">{children}</span>
    </div>
  )
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [])

  return (
    <div className="min-h-screen bg-[#fffcfb] text-gray-900 overflow-x-clip">
      <style jsx global>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(28px, -18px); }
        }
        @keyframes float-a {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-12px) rotate(-5deg); }
        }
        @keyframes float-b {
          0%, 100% { transform: translateY(0) rotate(4deg); }
          50% { transform: translateY(-9px) rotate(4deg); }
        }
        .animate-drift { animation: drift 16s ease-in-out infinite; }
        .animate-float-a { animation: float-a 7s ease-in-out infinite; }
        .animate-float-b { animation: float-b 8s ease-in-out infinite; }
        ::selection { background: #fecdd3; color: #881337; }
        @media (prefers-reduced-motion: reduce) {
          .animate-drift, .animate-float-a, .animate-float-b { animation: none; }
        }
      `}</style>

      {/* ============================================ */}
      {/* HERO                                          */}
      {/* ============================================ */}
      <section className="relative overflow-hidden">
        {/* Layer 1: soft washes */}
        <div className="absolute -top-32 right-[-10%] w-[36rem] h-[36rem] bg-rose-100/80 rounded-full blur-[110px] animate-drift" />
        <div className="absolute top-44 left-[-12%] w-[28rem] h-[28rem] bg-red-50 rounded-full blur-[90px]" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[44rem] h-[22rem] bg-pink-50/80 rounded-full blur-[100px]" />

        {/* Layer 2: concentric rings behind headline */}
        <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
          <div className="w-[34rem] h-[34rem] sm:w-[46rem] sm:h-[46rem] rounded-full border border-rose-200/50" />
          <div className="absolute inset-14 rounded-full border border-rose-200/40" />
          <div className="absolute inset-28 rounded-full border border-rose-200/30" />
        </div>

        {/* Layer 3: dotted texture + grain */}
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
            backgroundSize: '26px 26px',
            maskImage: 'radial-gradient(ellipse 60% 55% at 50% 38%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 38%, black, transparent)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none" style={{ backgroundImage: GRAIN }} />

        {/* Floating glass cards, desktop only */}
        <div className="hidden xl:block absolute left-[7%] top-[30%] animate-float-a" aria-hidden="true">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 ring-1 ring-rose-100/80 shadow-[0_24px_50px_-18px_rgba(225,29,72,0.3)] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-md shadow-rose-200 flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">Certificate issued</p>
                <p className="text-[11px] text-gray-500">QR verified in seconds</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-rose-100 overflow-hidden">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-red-400 to-rose-500" />
            </div>
          </div>
        </div>

        <div className="hidden xl:block absolute right-[7%] top-[48%] animate-float-b" aria-hidden="true">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 ring-1 ring-rose-100/80 shadow-[0_24px_50px_-18px_rgba(225,29,72,0.3)] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-md shadow-rose-200 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">Cohort progress</p>
                <p className="text-[11px] text-gray-500">At-risk learners flagged early</p>
              </div>
            </div>
            <div className="mt-3 flex items-end gap-1 h-7">
              {[35, 55, 42, 70, 60, 85, 100].map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h}%` }}
                  className="flex-1 rounded-sm bg-gradient-to-t from-rose-400 to-pink-300"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-16 sm:pt-24 sm:pb-24 text-center">
          <Reveal>
            <div className="flex items-center justify-center gap-4 mb-7">
              <span className="hidden sm:block h-px w-12 bg-gradient-to-r from-transparent to-rose-300" />
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-red-600">
                For institutions, NGOs, training centers and instructors across Africa
              </p>
              <span className="hidden sm:block h-px w-12 bg-gradient-to-l from-transparent to-rose-300" />
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-[2.6rem] sm:text-6xl font-semibold tracking-tight leading-[1.06] mb-2">
              Deliver real training.
            </h1>
            <div className="relative inline-block mb-7">
              <span className="font-serif italic text-[2.6rem] sm:text-6xl leading-[1.06] text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-pink-600">
                Prove real outcomes.
              </span>
              {/* hand-drawn underline flourish */}
              <svg
                className="absolute -bottom-3 sm:-bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-3 sm:h-4"
                viewBox="0 0 300 16"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M4 11 C 75 3, 225 3, 296 9"
                  stroke="url(#uline)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="uline" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f43f5e" stopOpacity="0.25" />
                    <stop offset="0.5" stopColor="#e11d48" stopOpacity="0.8" />
                    <stop offset="1" stopColor="#ec4899" stopOpacity="0.25" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-3">
              Sabitek is the AI-powered learning platform that runs your courses,
              keeps learners engaged to the finish line, and issues certificates
              anyone can verify in seconds.
            </p>
            <p className="text-sm text-gray-500 max-w-xl mx-auto mb-9">
              Mobile-first and light on data. If your learners have a phone, they can learn.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button className="group relative overflow-hidden w-full sm:w-auto bg-gradient-to-b from-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-8 py-5 text-sm font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:shadow-[0_18px_38px_-10px_rgba(225,29,72,0.6)] hover:-translate-y-0.5">
                      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" />
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <Link href="/courses">
                    <Button variant="outline" className="w-full sm:w-auto bg-white/70 backdrop-blur border-rose-100 hover:border-rose-200 hover:bg-white px-8 py-5 text-sm font-semibold rounded-full shadow-sm transition-all hover:-translate-y-0.5">
                      Browse Courses
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/request-access">
                    <Button className="group relative overflow-hidden w-full sm:w-auto bg-gradient-to-b from-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-8 py-5 text-sm font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:shadow-[0_18px_38px_-10px_rgba(225,29,72,0.6)] hover:-translate-y-0.5">
                      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" />
                      Get Started Free
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full sm:w-auto bg-white/70 backdrop-blur border-rose-100 hover:border-rose-200 hover:bg-white px-8 py-5 text-sm font-semibold rounded-full shadow-sm transition-all hover:-translate-y-0.5">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-white/50 backdrop-blur-md rounded-full border border-white/70 ring-1 ring-rose-100/70 shadow-[0_10px_30px_-14px_rgba(225,29,72,0.25)] px-6 py-2.5">
              {['Works on any phone', 'AI tutor included', 'Certificates verify by QR'].map((item, i, arr) => (
                <span key={i} className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-red-500" />
                    {item}
                  </span>
                  {i < arr.length - 1 && <span className="hidden sm:block w-1 h-1 rounded-full bg-rose-300" />}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Quiet capability strip, dot separated */}
      <section className="border-y border-rose-100/80 bg-gradient-to-r from-rose-50/60 via-white to-rose-50/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {['Structured courses', 'AI lesson tutor', 'Verified certificates', 'Cohort links', 'Live reports'].map((item, i, arr) => (
            <span key={i} className="flex items-center gap-4 text-xs font-medium tracking-wide text-gray-500">
              {item}
              {i < arr.length - 1 && <span className="w-1 h-1 rounded-full bg-rose-300" />}
            </span>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* THE PROBLEM, dark band                        */}
      {/* ============================================ */}
      <section className="relative overflow-hidden bg-[#1c1412] py-16 sm:py-20">
        <div className="absolute -top-24 right-[10%] w-96 h-96 bg-rose-900/30 rounded-full blur-[100px]" aria-hidden="true" />
        <div className="absolute -bottom-32 left-[5%] w-80 h-80 bg-red-950/60 rounded-full blur-[90px]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: GRAIN }} />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-snug text-white mb-6">
              Training does not fail at teaching.{' '}
              <span className="font-serif italic text-rose-300">It fails at follow-through.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-base sm:text-lg text-rose-100/70 leading-relaxed mb-4">
              Across Africa, serious programs still run on chat groups, PDFs and hope.
              Nobody knows who actually finished, quizzes are marked by hand or not at
              all, and certificates are images anyone can forge.
            </p>
            <p className="text-base sm:text-lg text-rose-100/70 leading-relaxed">
              Sabitek replaces that with structure: sequenced lessons, checkpoints graded
              on the server, dropout flagged before it happens, and credentials that
              anyone can verify. All on the ordinary phones your learners already own.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS, three persona panels            */}
      {/* ============================================ */}
      <section className="relative py-14 sm:py-16 bg-white">
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: GRAIN }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-red-400" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">How it works</span>
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-red-400" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-snug">
                One platform,{' '}
                <span className="font-serif italic text-red-600">three seats at the table</span>
              </h2>
              <p className="text-gray-600 mt-3">
                Learners learn, instructors see everything, institutions get proof.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                chip: 'For learners',
                chipClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                icon: GraduationCap,
                title: 'A tutor in your pocket',
                items: [
                  'Lessons unlock in order as you master each one',
                  'SabiBot explains the exact lesson you are reading, in your language',
                  'Streaks, XP and badges keep you coming back daily',
                  'Finish with a certificate anyone can scan and trust',
                ],
              },
              {
                chip: 'For instructors',
                chipClass: 'bg-rose-50 text-rose-700 ring-rose-200',
                icon: BookOpen,
                title: 'Author once, see everything',
                items: [
                  'A modern lesson composer with rich blocks and images',
                  'Quizzes graded on the server, never in the browser',
                  'A funnel that shows exactly where learners drop off',
                  'Announce to the class and answer questions inside the lesson',
                ],
              },
              {
                chip: 'For institutions',
                chipClass: 'bg-amber-50 text-amber-700 ring-amber-200',
                icon: Building2,
                title: 'Run cohorts, not chaos',
                items: [
                  'Your own branded workspace with private courses',
                  'One link enrolls a whole cohort: sabitek.app/c/yourname',
                  'Programs that unlock course by course, in sequence',
                  'Live reports with at-risk flags and CSV export for funders',
                ],
              },
            ].map((panel, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group h-full bg-gradient-to-b from-white to-rose-50/40 p-6 sm:p-7 rounded-2xl border border-rose-100 ring-1 ring-white shadow-[0_10px_30px_-18px_rgba(225,29,72,0.25)] transition-all duration-300 hover:shadow-[0_24px_50px_-20px_rgba(225,29,72,0.4)] hover:-translate-y-1 hover:border-rose-200">
                  <div className="flex items-center justify-between mb-5">
                    <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ring-1 ${panel.chipClass}`}>
                      {panel.chip}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                      <panel.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-4">{panel.title}</h3>
                  <div className="space-y-3">
                    {panel.items.map((item, j) => (
                      <div key={j} className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* WHY IT'S DIFFERENT, numbered cards            */}
      {/* ============================================ */}
      <section className="relative py-14 sm:py-16 bg-gradient-to-b from-white to-rose-50/50">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1fr_1.6fr] gap-8 lg:gap-14 mb-10">
            <Reveal>
              <div>
                <SectionLabel>Why it&apos;s different</SectionLabel>
                <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-snug">
                  Not another LMS{' '}
                  <span className="font-serif italic text-red-600">bolted onto Africa</span>
                </h2>
              </div>
            </Reveal>
            <Reveal delay={100} className="self-end">
              <p className="text-gray-600 leading-relaxed max-w-lg">
                Most platforms track attendance and call it learning. Sabitek is built
                around a harder question: can you prove it worked?
              </p>
            </Reveal>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: QrCode,
                num: '01',
                title: 'Proof, not promises',
                desc: 'Completion means every lesson finished in sequence and every quiz passed on our servers. The certificate carries a QR code anyone can verify in seconds.',
              },
              {
                icon: Smartphone,
                num: '02',
                title: 'Built for real networks',
                desc: 'No app to install, light pages, and content that works on the phones and data plans your learners actually have.',
              },
              {
                icon: Bot,
                num: '03',
                title: 'AI that tutors, not distracts',
                desc: 'SabiBot answers from the lesson your learner is actually on, speaks local languages, and is engineered to stay affordable at scale.',
              },
              {
                icon: Flame,
                num: '04',
                title: 'Retention is built in',
                desc: 'Daily streaks with a safety freeze, nudge emails at the right moment, and at-risk flags that reach admins before learners disappear.',
              },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="group relative h-full overflow-hidden bg-gradient-to-b from-white to-rose-50/40 p-6 sm:p-7 rounded-2xl border border-rose-100 ring-1 ring-white shadow-[0_10px_30px_-18px_rgba(225,29,72,0.25)] transition-all duration-300 hover:shadow-[0_24px_50px_-20px_rgba(225,29,72,0.4)] hover:-translate-y-1 hover:border-rose-200">
                  <span className="absolute -right-1 -bottom-7 font-serif italic text-[5.5rem] leading-none text-rose-100/70 select-none pointer-events-none transition-colors group-hover:text-rose-100" aria-hidden="true">
                    {f.num}
                  </span>
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)] flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                      <f.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-[15px] mb-1.5">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-[46ch]">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRODUCT PROMISES, elevated glass card         */}
      {/* ============================================ */}
      <section className="py-10 sm:py-12 bg-rose-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-rose-100 ring-1 ring-white shadow-[0_30px_60px_-30px_rgba(225,29,72,0.3)] overflow-hidden">
              <span className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
              <div className="absolute -top-24 left-1/3 w-72 h-72 bg-rose-50 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-y-8 py-10 px-6">
                {[
                  { icon: Smartphone, value: '0', label: 'Apps to install. Runs in any browser' },
                  { icon: Link2, value: '1 link', label: 'Enrolls an entire cohort' },
                  { icon: QrCode, value: 'Seconds', label: 'To verify any certificate' },
                  { icon: Bot, value: '24/7', label: 'AI tutor beside every lesson' },
                ].map((stat, i) => (
                  <div key={i} className={`text-center px-4 ${i > 0 ? 'lg:border-l lg:border-rose-100' : ''}`}>
                    <div className="flex justify-center mb-2">
                      <stat.icon className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-rose-600 mb-1">
                      {stat.value}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 max-w-[20ch] mx-auto">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOR EDUCATORS                                 */}
      {/* ============================================ */}
      <section className="py-14 sm:py-16 bg-gradient-to-b from-rose-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal>
              <div>
                <SectionLabel>For Educators</SectionLabel>
                <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-snug mb-4">
                  Turn your knowledge into a{' '}
                  <span className="font-serif italic text-red-600">digital academy</span>
                </h2>
                <p className="text-gray-600 leading-relaxed mb-7 max-w-md">
                  Author rich lessons, watch your learners progress in real time, and
                  issue certificates. All without writing a single line of code.
                </p>

                <div className="space-y-3 mb-8">
                  <CheckRow>Compose lessons with rich text, video, images and callouts</CheckRow>
                  <CheckRow>Attach quizzes that gate progress and grade themselves</CheckRow>
                  <CheckRow>See the exact lesson where learners drop off</CheckRow>
                  <CheckRow>Issue verifiable QR certificates automatically</CheckRow>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/schools-and-tutors">
                    <Button className="group relative overflow-hidden w-full sm:w-auto bg-gradient-to-b from-gray-800 to-gray-950 hover:to-gray-800 text-white px-7 py-5 text-sm font-semibold rounded-full shadow-[0_14px_28px_-12px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-0.5">
                      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent rounded-full pointer-events-none" />
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <Link href="/become-a-provider">
                    <Button variant="outline" className="w-full sm:w-auto bg-white/70 backdrop-blur border-rose-100 hover:border-rose-200 hover:bg-white px-7 py-5 text-sm font-semibold rounded-full shadow-sm transition-all hover:-translate-y-0.5">
                      Become a Provider
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* Mock instructor dashboard with layered depth */}
            <Reveal delay={150}>
              <div className="relative max-w-lg mx-auto lg:max-w-none">
                {/* tilted backdrop panel */}
                <div className="absolute inset-4 rotate-3 rounded-3xl bg-gradient-to-br from-rose-200/70 to-pink-100/70 blur-[1px]" aria-hidden="true" />

                <div className="relative bg-white/85 backdrop-blur-xl rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_40px_80px_-35px_rgba(225,29,72,0.45)] overflow-hidden">
                  {/* window chrome */}
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-rose-50">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-200" />
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-100" />
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-50 border border-rose-100" />
                    <span className="ml-3 text-xs font-medium text-gray-400">Instructor dashboard</span>
                  </div>

                  <div className="p-5 sm:p-6 space-y-5">
                    {/* course progress rows */}
                    <div className="space-y-3.5">
                      {[
                        { icon: BookOpen, name: 'Digital Marketing 101', pct: 72 },
                        { icon: GraduationCap, name: 'Data Literacy Cohort B', pct: 45 },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
                            <row.icon className="w-4 h-4 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between mb-1.5">
                              <p className="text-xs font-semibold text-gray-800 truncate">{row.name}</p>
                              <span className="text-[11px] font-medium text-rose-500 tabular-nums">{row.pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-rose-50 overflow-hidden">
                              <div
                                style={{ width: `${row.pct}%` }}
                                className="h-full rounded-full bg-gradient-to-r from-red-500 to-pink-400"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* inline metric tiles */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: TrendingUp, label: 'Lessons completed', value: '128' },
                        { icon: Target, label: 'Avg. quiz score', value: '87%' },
                        { icon: MessageSquare, label: 'Questions answered', value: '12' },
                        { icon: Zap, label: 'At-risk flagged', value: '3' },
                      ].map((m, i) => (
                        <div key={i} className="rounded-xl bg-gradient-to-b from-rose-50/70 to-white border border-rose-100 px-3.5 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <m.icon className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-[11px] text-gray-500">{m.label}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 tabular-nums">{m.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* floating certificate chip overlapping the panel */}
                <div className="absolute -bottom-5 -right-3 sm:-right-6 animate-float-b">
                  <div className="bg-white/75 backdrop-blur-xl rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_40px_-16px_rgba(225,29,72,0.4)] px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 shadow-sm flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Certificate issued</p>
                      <p className="text-[11px] text-gray-500">Ada O. finished with 94%</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* THREE STEPS                                   */}
      {/* ============================================ */}
      <section className="py-14 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-red-400" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">Getting started</span>
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-red-400" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-snug">
                Three steps to your{' '}
                <span className="font-serif italic text-red-600">first cohort</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                num: '1',
                title: 'Create your workspace',
                desc: 'Sign up as an instructor or apply as an institution. Free to start, no card required.',
              },
              {
                num: '2',
                title: 'Add your courses',
                desc: 'Build lessons in the composer, attach quizzes, and arrange courses into a sequenced program.',
              },
              {
                num: '3',
                title: 'Share one link',
                desc: 'Learners join your cohort at sabitek.app/c/yourname. You watch progress arrive live.',
              },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="relative h-full bg-white/80 backdrop-blur p-6 sm:p-7 rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-18px_rgba(225,29,72,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_45px_-20px_rgba(225,29,72,0.4)]">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-b from-red-500 to-rose-600 shadow-[0_10px_20px_-8px_rgba(225,29,72,0.5)] flex items-center justify-center mb-5">
                    <span className="text-white font-semibold">{step.num}</span>
                  </div>
                  <h3 className="font-semibold text-[15px] mb-1.5">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOR PARTNERS AND FUNDERS, dark card           */}
      {/* ============================================ */}
      <section className="py-10 sm:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-[#1c1412] px-6 py-12 sm:px-12 sm:py-14 ring-1 ring-white/10 shadow-[0_40px_80px_-35px_rgba(28,20,18,0.7)]">
              <div className="absolute -top-20 right-[15%] w-72 h-72 bg-rose-900/30 rounded-full blur-[90px]" aria-hidden="true" />
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: GRAIN }} />

              <div className="relative grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="h-px w-8 bg-gradient-to-r from-rose-400 to-transparent" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-300">For partners and funders</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-snug text-white mb-4">
                    Built to prove outcomes to the{' '}
                    <span className="font-serif italic text-rose-300">people who fund them</span>
                  </h2>
                  <p className="text-rose-100/70 leading-relaxed mb-7 max-w-md">
                    When you sponsor a cohort on Sabitek, you do not get an attendance
                    sheet. You get verified completion, quiz-backed mastery, and dropout
                    caught early enough to act on.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/request-access">
                      <Button className="group w-full sm:w-auto bg-white text-gray-900 hover:bg-rose-50 px-7 py-5 text-sm font-semibold rounded-full shadow-[0_14px_28px_-12px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-0.5">
                        Partner With Us
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                    <Link href="/about">
                      <Button variant="outline" className="w-full sm:w-auto bg-white/5 backdrop-blur border border-white/25 text-white hover:bg-white/15 hover:text-white px-7 py-5 text-sm font-semibold rounded-full transition-all hover:-translate-y-0.5">
                        About Sabitek
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: ShieldCheck, text: 'Every completion backed by sequenced lessons and server-graded quizzes' },
                    { icon: BarChart3, text: 'Cohort reports with completion, activity and at-risk flags, exportable to CSV' },
                    { icon: QrCode, text: 'Certificates your stakeholders can verify themselves, no email chain needed' },
                    { icon: Users, text: 'Read-only viewer seats so funders see progress without touching anything' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-start gap-3.5 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5">
                      <row.icon className="w-5 h-5 text-rose-300 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-rose-50/85 leading-relaxed">{row.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CTA                                     */}
      {/* ============================================ */}
      <section className="pb-16 pt-4 sm:pb-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 px-6 py-16 sm:px-14 sm:py-20 text-center ring-1 ring-white/20 shadow-[0_45px_90px_-35px_rgba(190,18,60,0.6)]">
              {/* light source from the top */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/15 to-transparent" aria-hidden="true" />
              {/* glow orbs */}
              <div className="absolute -top-24 -right-16 w-80 h-80 bg-white/10 rounded-full blur-[80px]" />
              <div className="absolute -bottom-28 -left-16 w-72 h-72 bg-pink-300/25 rounded-full blur-[70px]" />
              {/* concentric rings, top right */}
              <svg className="absolute -top-20 -right-20 w-80 h-80 opacity-25" viewBox="0 0 200 200" fill="none" aria-hidden="true">
                <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="0.75" />
                <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="99" stroke="white" strokeWidth="0.4" />
              </svg>
              {/* dotted texture + grain */}
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '26px 26px' }}
              />
              <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: GRAIN }} />

              <div className="relative">
                <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white mb-4">
                  Ready to run training{' '}
                  <span className="font-serif italic">that ends in proof?</span>
                </h2>
                <p className="text-base sm:text-lg text-white/85 mb-9 max-w-lg mx-auto">
                  Create your workspace today. Your first cohort could be learning
                  this week.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  {!user ? (
                    <>
                      <Link href="/request-access">
                        <Button className="group w-full sm:w-auto bg-white text-red-600 hover:bg-rose-50 px-9 py-5 text-sm font-semibold rounded-full shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)]">
                          Get Started Free
                          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                      </Link>
                      <Link href="/about">
                        <Button variant="outline" className="w-full sm:w-auto bg-white/10 backdrop-blur border border-white/40 text-white hover:bg-white/20 hover:text-white px-9 py-5 text-sm font-semibold rounded-full transition-all hover:-translate-y-0.5">
                          Learn More
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link href="/courses">
                      <Button className="group w-full sm:w-auto bg-white text-red-600 hover:bg-rose-50 px-9 py-5 text-sm font-semibold rounded-full shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-0.5">
                        Explore Courses
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                  )}
                </div>

                {!user && (
                  <p className="text-sm text-white/70 mt-7">
                    Individual learner?{' '}
                    <Link href="/waitlist" className="text-white underline underline-offset-4 hover:text-white/90 font-medium">
                      Join the waitlist
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
