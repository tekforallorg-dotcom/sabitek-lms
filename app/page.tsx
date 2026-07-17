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
  CheckCircle,
  Smartphone,
  GraduationCap,
  ShieldCheck,
  BarChart3,
  QrCode,
  Link2,
  Building2,
  Flame,
  Zap,
  MessagesSquare,
  FileQuestion,
  ShieldAlert,
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
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-10px) rotate(-4deg); }
        }
        @keyframes float-b {
          0%, 100% { transform: translateY(0) rotate(3deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
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
      {/* HERO, split layout: story left, product right */}
      {/* ============================================ */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-32 right-[-8%] w-[34rem] h-[34rem] bg-rose-100/80 rounded-full blur-[110px] animate-drift" />
        <div className="absolute top-52 left-[-12%] w-[26rem] h-[26rem] bg-red-50 rounded-full blur-[90px]" />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
            backgroundSize: '26px 26px',
            maskImage: 'radial-gradient(ellipse 50% 60% at 72% 40%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 50% 60% at 72% 40%, black, transparent)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none" style={{ backgroundImage: GRAIN }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-24">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-8 items-center">
            {/* Left: the story */}
            <div className="text-center lg:text-left">
              <Reveal>
                <div className="inline-flex items-center gap-2.5 bg-white/60 backdrop-blur rounded-full border border-white ring-1 ring-rose-100 shadow-sm pl-2 pr-4 py-1.5 mb-7">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-b from-red-500 to-rose-600">
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </span>
                  <span className="text-xs font-semibold tracking-wide text-gray-700">
                    Built for Africa&apos;s training ecosystem
                  </span>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <h1 className="text-[2.7rem] sm:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
                  Deliver real training.{' '}
                  <span className="relative inline-block font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-pink-600">
                    Prove real outcomes.
                    <svg
                      className="absolute -bottom-2 sm:-bottom-3 left-0 w-full h-3"
                      viewBox="0 0 300 16"
                      fill="none"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path d="M4 11 C 75 3, 225 3, 296 9" stroke="url(#uline)" strokeWidth="4" strokeLinecap="round" />
                      <defs>
                        <linearGradient id="uline" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#f43f5e" stopOpacity="0.25" />
                          <stop offset="0.5" stopColor="#e11d48" stopOpacity="0.8" />
                          <stop offset="1" stopColor="#ec4899" stopOpacity="0.25" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={200}>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                  Sabitek runs your courses, keeps learners engaged to the finish
                  line, and issues certificates anyone can verify in seconds.
                  Institutions, NGOs, training centers and instructors, one platform.
                </p>
              </Reveal>

              <Reveal delay={300}>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
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
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2">
                  {['Works on any device', 'AI tutor included', 'Certificates verify by QR'].map((item, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-sm text-gray-500">
                      <CheckCircle className="w-3.5 h-3.5 text-red-500" />
                      {item}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right: layered product composition */}
            <Reveal delay={250}>
              <div className="relative max-w-sm mx-auto lg:max-w-none lg:mx-0 lg:pl-6" aria-hidden="true">
                {/* tilted backdrop */}
                <div className="absolute inset-x-10 inset-y-4 rotate-6 rounded-[2.5rem] bg-gradient-to-br from-rose-200/60 to-pink-100/60 blur-[2px]" />

                {/* learner phone card */}
                <div className="relative w-[264px] mx-auto bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white ring-1 ring-rose-100 shadow-[0_40px_80px_-30px_rgba(225,29,72,0.45)] p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[11px] text-gray-400">Good evening</p>
                      <p className="text-sm font-semibold text-gray-900">Ada is learning</p>
                    </div>
                    <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-1">
                      <Flame className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs font-semibold text-gray-800 tabular-nums">5</span>
                    </div>
                  </div>

                  {/* daily ring */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative w-14 h-14">
                      <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ffe4e6" strokeWidth="4" />
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="url(#ringGrad)" strokeWidth="4" strokeDasharray="97.4" strokeDashoffset="24" strokeLinecap="round" />
                        <defs>
                          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop stopColor="#ef4444" />
                            <stop offset="1" stopColor="#e11d48" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-gray-800">75%</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Daily goal almost there</p>
                      <p className="text-[11px] text-gray-500">1 lesson to go</p>
                    </div>
                  </div>

                  {/* current lesson */}
                  <div className="rounded-xl bg-gradient-to-b from-rose-50/80 to-white border border-rose-100 p-3.5 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs font-semibold text-gray-800 truncate">Anatomy of a Good Prompt</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-rose-100 overflow-hidden">
                      <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-red-500 to-pink-400" />
                    </div>
                  </div>

                  {/* quiz passed row */}
                  <div className="flex items-center justify-between rounded-xl bg-white border border-rose-100 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      </span>
                      <span className="text-xs font-medium text-gray-700">Quiz passed</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-rose-600">
                      <Zap className="w-3 h-3" /> +30 XP
                    </span>
                  </div>
                </div>

                {/* floating certificate chip */}
                <div className="absolute -right-2 sm:right-0 lg:-right-2 top-8 animate-float-b">
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_45px_-16px_rgba(225,29,72,0.4)] px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 shadow-sm flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Certificate issued</p>
                      <p className="text-[11px] text-gray-500">QR verified in seconds</p>
                    </div>
                  </div>
                </div>

                {/* floating cohort report chip */}
                <div className="absolute -left-2 sm:left-0 lg:-left-4 bottom-6 animate-float-a">
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_45px_-16px_rgba(225,29,72,0.4)] px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-3.5 h-3.5 text-red-500" />
                      <p className="text-xs font-semibold text-gray-800">Cohort live report</p>
                    </div>
                    <div className="flex items-end gap-1 h-6 w-28">
                      {[40, 65, 50, 80, 70, 95].map((h, i) => (
                        <span key={i} style={{ height: `${h}%` }} className="flex-1 rounded-sm bg-gradient-to-t from-rose-400 to-pink-300" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Quiet capability strip */}
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
      {/* THE PROBLEM, dark narrative band              */}
      {/* ============================================ */}
      <section className="relative overflow-hidden bg-[#1c1412] py-16 sm:py-24">
        <div className="absolute -top-24 right-[8%] w-[28rem] h-[28rem] bg-rose-900/40 rounded-full blur-[110px]" aria-hidden="true" />
        <div className="absolute -bottom-36 left-[4%] w-96 h-96 bg-red-950/70 rounded-full blur-[100px]" aria-hidden="true" />
        <span className="absolute top-0 inset-x-16 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" aria-hidden="true" />
        <div
          className="absolute inset-0 opacity-[0.14] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,228,230,0.4) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 55% 65% at 78% 40%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 55% 65% at 78% 40%, black, transparent)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: GRAIN }} />
        <span className="absolute -top-6 left-[3%] font-serif italic text-[16rem] leading-none text-rose-500/[0.07] select-none pointer-events-none" aria-hidden="true">
          &ldquo;
        </span>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-20 items-center">
            <Reveal>
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="h-px w-8 bg-gradient-to-r from-rose-400 to-transparent" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-300">The problem</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.12] text-white mb-6">
                  Training does not fail at teaching.{' '}
                  <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-rose-200 to-pink-300">
                    It fails at follow-through.
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-rose-100/70 leading-relaxed max-w-md">
                  Across Africa, serious programs still run on goodwill and group
                  chats. The teaching is real. The record of it is not, and funders,
                  employers and learners all pay for that gap.
                </p>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className="relative">
                <span className="absolute left-[21px] top-10 bottom-28 w-px bg-gradient-to-b from-rose-500/15 via-rose-400/40 to-rose-300/70" aria-hidden="true" />
                <div className="space-y-4">
                  {[
                    { icon: MessagesSquare, title: 'Content lives in chat groups and PDFs', desc: 'Scattered, unsequenced, gone when the group goes quiet' },
                    { icon: FileQuestion, title: 'Completion is a guess', desc: 'Assessments marked by hand, or never marked at all' },
                    { icon: ShieldAlert, title: 'Certificates anyone can forge', desc: 'A JPEG with a logo on it proves nothing to anyone' },
                  ].map((row, i) => (
                    <div key={i} className="relative flex items-start gap-4">
                      <div className="relative z-10 w-11 h-11 rounded-xl bg-white/[0.07] ring-1 ring-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                        <row.icon className="w-5 h-5 text-rose-300" />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-[15px] font-semibold text-white/90">{row.title}</p>
                        <p className="text-sm text-rose-100/50 leading-relaxed">{row.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative mt-7 ml-0 sm:ml-14 rounded-2xl bg-gradient-to-b from-rose-500/20 to-rose-500/[0.07] border border-rose-300/25 backdrop-blur px-5 py-4 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)]">
                  <span className="absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-rose-300/70 to-transparent" aria-hidden="true" />
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-rose-200 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-rose-50/90 leading-relaxed">
                      <span className="font-semibold text-white">Sabitek closes the loop:</span>{' '}
                      sequenced lessons, checkpoints graded on the server, dropout
                      flagged early, and credentials anyone can verify.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* THE SYSTEM, bento grid                        */}
      {/* ============================================ */}
      <section className="relative py-14 sm:py-20 bg-white">
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: GRAIN }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-red-400" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">The system</span>
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-red-400" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-snug">
                Everything a training program needs,{' '}
                <span className="font-serif italic text-red-600">wired together</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-fr">
            {/* Wide tile: the proof engine */}
            <Reveal className="md:col-span-4">
              <div className="group relative h-full overflow-hidden rounded-3xl bg-[#1c1412] p-7 sm:p-8 ring-1 ring-white/10 shadow-[0_24px_60px_-30px_rgba(28,20,18,0.8)]">
                <div className="absolute -top-16 right-[10%] w-64 h-64 bg-rose-900/40 rounded-full blur-[80px]" aria-hidden="true" />
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: GRAIN }} />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-8">
                  <div className="flex-1">
                    <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-300 mb-3">The proof engine</span>
                    <h3 className="text-xl sm:text-2xl font-semibold text-white leading-snug mb-3">
                      Completion you can{' '}
                      <span className="font-serif italic text-rose-300">defend</span>
                    </h3>
                    <p className="text-sm text-rose-100/60 leading-relaxed max-w-sm">
                      Lessons unlock in sequence, quizzes grade on the server, and
                      the certificate at the end carries a QR code anyone can check.
                      No JPEGs, no guesswork.
                    </p>
                  </div>
                  {/* mini certificate visual */}
                  <div className="relative flex-shrink-0 w-52 mx-auto sm:mx-0" aria-hidden="true">
                    <div className="absolute inset-2 rotate-3 rounded-2xl bg-rose-500/20 blur-[2px]" />
                    <div className="relative rounded-2xl bg-[#fffcf9] border border-rose-200 p-4 text-center shadow-xl">
                      <p className="text-[9px] uppercase tracking-[0.25em] text-gray-400 mb-1.5">Certificate</p>
                      <p className="font-serif italic text-sm text-gray-900 mb-1">Ada Okafor</p>
                      <div className="mx-auto w-10 h-px bg-rose-300 mb-1.5" />
                      <p className="text-[10px] text-gray-500 mb-2.5">Data Literacy, verified</p>
                      <div className="mx-auto w-9 h-9 rounded-md bg-gray-900 flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* AI tutor tile */}
            <Reveal delay={80} className="md:col-span-2">
              <div className="group relative h-full overflow-hidden rounded-3xl bg-gradient-to-b from-white to-rose-50/40 p-6 border border-rose-100 ring-1 ring-white shadow-[0_10px_30px_-18px_rgba(225,29,72,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-20px_rgba(225,29,72,0.4)]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)] flex items-center justify-center mb-4">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-[15px] mb-1.5">A tutor beside every lesson</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  SabiBot answers from the exact lesson on screen, in the learner&apos;s language.
                </p>
                <div className="rounded-xl bg-white border border-rose-100 px-3.5 py-2.5 text-xs text-gray-600 shadow-sm" aria-hidden="true">
                  <span className="font-semibold text-rose-600">SabiBot:</span> Think of a prompt like a recipe. Let us look at the one in this lesson...
                </div>
              </div>
            </Reveal>

            {/* Persona tiles */}
            {[
              {
                chip: 'Learners',
                chipClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                icon: GraduationCap,
                title: 'Stay to the finish',
                desc: 'Streaks, XP, badges and a daily goal ring built on the habit loops that make Duolingo work.',
              },
              {
                chip: 'Instructors',
                chipClass: 'bg-rose-50 text-rose-700 ring-rose-200',
                icon: BookOpen,
                title: 'See everything',
                desc: 'A rich lesson composer, a drop-off funnel per lesson, and learner questions answered in place.',
              },
              {
                chip: 'Institutions',
                chipClass: 'bg-amber-50 text-amber-700 ring-amber-200',
                icon: Building2,
                title: 'Run cohorts, not chaos',
                desc: 'Branded workspace, sequenced programs, at-risk flags and CSV reports your funders can use.',
              },
            ].map((tile, i) => (
              <Reveal key={i} delay={i * 80} className="md:col-span-2">
                <div className="group h-full rounded-3xl bg-gradient-to-b from-white to-rose-50/40 p-6 border border-rose-100 ring-1 ring-white shadow-[0_10px_30px_-18px_rgba(225,29,72,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-20px_rgba(225,29,72,0.4)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ring-1 ${tile.chipClass}`}>
                      {tile.chip}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                      <tile.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-[15px] mb-1.5">{tile.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{tile.desc}</p>
                </div>
              </Reveal>
            ))}

            {/* Cohort link tile */}
            <Reveal delay={120} className="md:col-span-3">
              <div className="group h-full rounded-3xl bg-gradient-to-b from-white to-rose-50/40 p-6 border border-rose-100 ring-1 ring-white shadow-[0_10px_30px_-18px_rgba(225,29,72,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-20px_rgba(225,29,72,0.4)]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)] flex items-center justify-center mb-4">
                  <Link2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-[15px] mb-1.5">One link enrolls a cohort</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Share it on WhatsApp, print it on a flyer. Learners land on your
                  branded page and start immediately.
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-rose-100 px-4 py-2 shadow-sm" aria-hidden="true">
                  <span className="text-xs font-mono text-gray-700">sabitek.app/c/yourprogram</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">32 joined</span>
                </div>
              </div>
            </Reveal>

            {/* Any device tile */}
            <Reveal delay={160} className="md:col-span-3">
              <div className="group h-full rounded-3xl bg-gradient-to-b from-white to-rose-50/40 p-6 border border-rose-100 ring-1 ring-white shadow-[0_10px_30px_-18px_rgba(225,29,72,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-20px_rgba(225,29,72,0.4)]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)] flex items-center justify-center mb-4">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-[15px] mb-1.5">Zero apps, any device</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Runs in the browser, light on data, built for the phones and
                  networks your learners actually have.
                </p>
                <div className="flex flex-wrap gap-2" aria-hidden="true">
                  {['No downloads', 'Low bandwidth', 'Mobile-first'].map((chip, i) => (
                    <span key={i} className="text-[11px] font-medium text-gray-600 bg-white border border-rose-100 rounded-full px-3 py-1 shadow-sm">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* THREE STEPS, connected timeline               */}
      {/* ============================================ */}
      <section className="relative py-14 sm:py-20 bg-gradient-to-b from-white to-rose-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-12">
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

          <div className="relative">
            {/* connecting line, desktop */}
            <span className="hidden md:block absolute top-[22px] left-[17%] right-[17%] h-px bg-gradient-to-r from-rose-200 via-rose-300 to-rose-200" aria-hidden="true" />
            <div className="grid md:grid-cols-3 gap-10 md:gap-6">
              {[
                { num: '1', title: 'Create your workspace', desc: 'Sign up as an instructor or apply as an institution. Free to start, no card required.' },
                { num: '2', title: 'Add your courses', desc: 'Build lessons in the composer, attach quizzes, arrange courses into a sequenced program.' },
                { num: '3', title: 'Share one link', desc: 'Learners join at sabitek.app/c/yourname. Progress starts arriving live the same day.' },
              ].map((step, i) => (
                <Reveal key={i} delay={i * 100}>
                  <div className="text-center px-2">
                    <div className="relative inline-flex w-11 h-11 rounded-full bg-gradient-to-b from-red-500 to-rose-600 shadow-[0_10px_20px_-8px_rgba(225,29,72,0.5)] ring-4 ring-[#fffcfb] items-center justify-center mb-4">
                      <span className="text-white font-semibold">{step.num}</span>
                    </div>
                    <h3 className="font-semibold text-[15px] mb-1.5">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-[32ch] mx-auto">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOR PARTNERS AND FUNDERS, closing dark card   */}
      {/* ============================================ */}
      <section className="pb-16 pt-4 sm:pb-20 bg-rose-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-[#1c1412] px-6 py-12 sm:px-12 sm:py-14 ring-1 ring-white/10 shadow-[0_40px_80px_-35px_rgba(28,20,18,0.7)]">
              <div className="absolute -top-20 right-[15%] w-72 h-72 bg-rose-900/30 rounded-full blur-[90px]" aria-hidden="true" />
              <div className="absolute -bottom-24 left-[10%] w-64 h-64 bg-red-950/50 rounded-full blur-[80px]" aria-hidden="true" />
              <span className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" aria-hidden="true" />
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
                        Get Started Free
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                    <Link href="/about">
                      <Button variant="outline" className="w-full sm:w-auto bg-white/5 backdrop-blur border border-white/25 text-white hover:bg-white/15 hover:text-white px-7 py-5 text-sm font-semibold rounded-full transition-all hover:-translate-y-0.5">
                        Partner With Us
                      </Button>
                    </Link>
                  </div>
                  {!user && (
                    <p className="text-sm text-rose-100/50 mt-6">
                      Individual learner?{' '}
                      <Link href="/waitlist" className="text-rose-200 underline underline-offset-4 hover:text-white font-medium">
                        Join the waitlist
                      </Link>
                    </p>
                  )}
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
    </div>
  )
}
