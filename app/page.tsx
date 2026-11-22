'use client'
import { useEffect, useState } from 'react'
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
import { Reveal } from '@/components/marketing/primitives'

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
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-clip">
      <style jsx global>{`
        ::selection { background: #fecaca; color: #7f1d1d; }
      `}</style>

      {/* ============================================ */}
      {/* HERO, split layout: story left, product right */}
      {/* ============================================ */}
      <section className="relative overflow-hidden">

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-24">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-8 items-center">
            {/* Left: the story */}
            <div className="text-center lg:text-left">
              <Reveal>
                <div className="inline-flex items-center gap-3 bg-white rounded-full border border-gray-200 shadow-sm pl-2 pr-4 py-2 mb-7">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600">
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </span>
                  <span className="text-xs font-medium tracking-wide text-gray-700">
                    Built for Africa&apos;s training ecosystem
                  </span>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <h1 className="text-[2.7rem] sm:text-6xl font-medium tracking-tight leading-[1.05] mb-6">
                  Deliver real training.{' '}
                  <span className="relative inline-block font-serif italic text-red-600">
                    Prove real outcomes.
                    <svg
                      className="absolute -bottom-2 sm:-bottom-3 left-0 w-full h-3"
                      viewBox="0 0 300 16"
                      fill="none"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path d="M4 11 C 75 3, 225 3, 296 9" stroke="#dc2626" strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" />
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
                        <Button className="group relative overflow-hidden w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-5 text-sm font-medium rounded-full ring-1 ring-red-600/50 transition-all">
                          Go to dashboard
                          <ArrowRight className="w-4 h-4 ml-2 transition-transform" />
                        </Button>
                      </Link>
                      <Link href="/courses">
                        <Button variant="outline" className="w-full sm:w-auto bg-white border-gray-200 hover:border-gray-200 hover:bg-white px-8 py-5 text-sm font-medium rounded-full shadow-sm transition-all">
                          Browse courses
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/request-access">
                        <Button className="group relative overflow-hidden w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-5 text-sm font-medium rounded-full ring-1 ring-red-600/50 transition-all">
                          Request access
                          <ArrowRight className="w-4 h-4 ml-2 transition-transform" />
                        </Button>
                      </Link>
                      <Link href="/auth/login">
                        <Button variant="outline" className="w-full sm:w-auto bg-white border-gray-200 hover:border-gray-200 hover:bg-white px-8 py-5 text-sm font-medium rounded-full shadow-sm transition-all">
                          Sign in
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </Reveal>

              <Reveal delay={400}>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2">
                  {['Works on any device', 'AI tutor included', 'Certificates verify by QR'].map((item, i) => (
                    <span key={i} className="flex items-center gap-2 text-sm text-gray-500">
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

                {/* learner phone card */}
                <div className="relative w-[264px] mx-auto bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs text-gray-400">Good evening</p>
                      <p className="text-sm font-medium text-gray-900">Ada is learning</p>
                    </div>
                    <div className="flex items-center gap-1 bg-red-50 border border-gray-200 rounded-full px-3 py-1">
                      <Flame className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs font-medium text-gray-800 tabular-nums">5</span>
                    </div>
                  </div>

                  {/* daily ring */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative w-14 h-14">
                      <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#fee2e2" strokeWidth="4" />
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#dc2626" strokeWidth="4" strokeDasharray="97.4" strokeDashoffset="24" strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-800">75%</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Daily goal almost there</p>
                      <p className="text-xs text-gray-500">1 lesson to go</p>
                    </div>
                  </div>

                  {/* current lesson */}
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs font-medium text-gray-800 truncate">Anatomy of a Good Prompt</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-red-100 overflow-hidden">
                      <div className="h-full w-[64%] rounded-full bg-red-600" />
                    </div>
                  </div>

                  {/* quiz passed row */}
                  <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      </span>
                      <span className="text-xs font-medium text-gray-700">Quiz passed</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                      <Zap className="w-3 h-3" /> +30 XP
                    </span>
                  </div>
                </div>

                {/* floating certificate chip */}
                <div className="hidden sm:block absolute -right-2 sm:right-0 lg:-right-2 top-8">
                  <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-600 shadow-sm flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Certificate issued</p>
                      <p className="text-xs text-gray-500">QR verified in seconds</p>
                    </div>
                  </div>
                </div>

                {/* floating cohort report chip */}
                <div className="hidden sm:block absolute -left-2 sm:left-0 lg:-left-4 bottom-6">
                  <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-3.5 h-3.5 text-red-500" />
                      <p className="text-xs font-medium text-gray-800">Cohort live report</p>
                    </div>
                    <div className="flex items-end gap-1 h-6 w-28">
                      {[40, 65, 50, 80, 70, 95].map((h, i) => (
                        <span key={i} style={{ height: `${h}%` }} className="flex-1 rounded-sm bg-red-600" />
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
      <section className="border-y border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {['Structured courses', 'AI lesson tutor', 'Verified certificates', 'Cohort links', 'Live reports'].map((item, i, arr) => (
            <span key={i} className="flex items-center gap-4 text-xs font-medium tracking-wide text-gray-500">
              {item}
              {i < arr.length - 1 && <span className="w-1 h-1 rounded-full bg-red-300" />}
            </span>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* THE PROBLEM, dark narrative band              */}
      {/* ============================================ */}
      <section className="relative overflow-hidden bg-gray-900 py-16 sm:py-24">
        <span className="absolute top-0 inset-x-16 h-px bg-gray-200" aria-hidden="true" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-20 items-center">
            <Reveal>
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="h-px w-8 bg-red-600" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-red-300">The problem</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-medium tracking-tight leading-[1.12] text-white mb-6">
                  Training does not fail at teaching.{' '}
                  <span className="font-serif italic text-red-300">
                    It fails at follow-through.
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-md">
                  Across Africa, serious programs still run on goodwill and group
                  chats. The teaching is real. The record of it is not, and funders,
                  employers and learners all pay for that gap.
                </p>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className="relative">
                <span className="absolute left-[21px] top-10 bottom-28 w-px bg-red-500/15" aria-hidden="true" />
                <div className="space-y-4">
                  {[
                    { icon: MessagesSquare, title: 'Content lives in chat groups and PDFs', desc: 'Scattered, unsequenced, gone when the group goes quiet' },
                    { icon: FileQuestion, title: 'Completion is a guess', desc: 'Assessments marked by hand, or never marked at all' },
                    { icon: ShieldAlert, title: 'Certificates anyone can forge', desc: 'A JPEG with a logo on it proves nothing to anyone' },
                  ].map((row, i) => (
                    <div key={i} className="relative flex items-start gap-4">
                      <div className="relative z-10 w-11 h-11 rounded-xl bg-white/[0.07] ring-1 ring-white/15 flex items-center justify-center flex-shrink-0">
                        <row.icon className="w-5 h-5 text-red-300" />
                      </div>
                      <div className="pt-1">
                        <p className="text-base font-medium text-white/90">{row.title}</p>
                        <p className="text-sm text-gray-400 leading-relaxed">{row.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative mt-7 ml-0 sm:ml-14 rounded-xl bg-red-500/20 border border-red-300/25 px-5 py-4">
                  <span className="absolute top-0 inset-x-6 h-px bg-gray-200" aria-hidden="true" />
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-red-200 mt-1 flex-shrink-0" />
                    <p className="text-sm text-gray-200 leading-relaxed">
                      <span className="font-medium text-white">Sabitek closes the loop:</span>{' '}
                      sequenced lessons, automatically graded quizzes, dropout
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
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="h-px w-10 bg-red-600" />
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-red-600">The system</span>
                <span className="h-px w-10 bg-red-600" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-medium tracking-tight leading-snug">
                Everything a training program needs,{' '}
                <span className="font-serif italic text-red-600">wired together</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Wide tile: the proof engine */}
            <Reveal className="md:col-span-4">
              <div className="group relative h-full overflow-hidden rounded-xl bg-gray-900 p-7 sm:p-8 ring-1 ring-white/10">
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-8">
                  <div className="flex-1">
                    <span className="inline-block text-xs font-medium uppercase tracking-[0.18em] text-red-300 mb-3">The proof engine</span>
                    <h3 className="text-xl sm:text-2xl font-medium text-white leading-snug mb-3">
                      Completion you can{' '}
                      <span className="font-serif italic text-red-300">defend</span>
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed max-w-sm">
                      Lessons unlock in sequence, quizzes grade on the server, and
                      the certificate at the end carries a QR code anyone can check.
                      No JPEGs, no guesswork.
                    </p>
                  </div>
                  {/* mini certificate visual */}
                  <div className="relative flex-shrink-0 w-52 mx-auto sm:mx-0" aria-hidden="true">
                    <div className="relative rounded-xl bg-gray-50 border border-gray-200 p-4 text-center shadow-sm">
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-2">Certificate</p>
                      <p className="font-serif italic text-sm text-gray-900 mb-1">Ada Okafor</p>
                      <div className="mx-auto w-10 h-px bg-red-300 mb-2" />
                      <p className="text-xs text-gray-500 mb-3">Data Literacy, verified</p>
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
              <div className="group relative h-full overflow-hidden rounded-xl bg-white p-6 border border-gray-200 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center mb-4">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-base mb-2">A tutor beside every lesson</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  SabiBot answers from the exact lesson on screen, in the learner&apos;s language.
                </p>
                <div className="rounded-xl bg-white border border-gray-200 px-4 py-3 text-xs text-gray-600 shadow-sm" aria-hidden="true">
                  <span className="font-medium text-red-600">SabiBot:</span> Think of a prompt like a recipe. Let us look at the one in this lesson...
                </div>
              </div>
            </Reveal>

            {/* Persona tiles */}
            {[
              {
                chip: 'Learners',
                chipClass: 'bg-gray-50 text-gray-700 ring-gray-200',
                icon: GraduationCap,
                title: 'Stay to the finish',
                desc: 'Streaks, points, badges and a daily goal keep learners coming back until the certificate.',
              },
              {
                chip: 'Instructors',
                chipClass: 'bg-gray-50 text-gray-700 ring-gray-200',
                icon: BookOpen,
                title: 'See everything',
                desc: 'A rich lesson composer, a drop-off funnel per lesson, and learner questions answered in place.',
              },
              {
                chip: 'Institutions',
                chipClass: 'bg-gray-50 text-gray-700 ring-gray-200',
                icon: Building2,
                title: 'Run cohorts, not chaos',
                desc: 'Branded workspace, sequenced programs, at-risk flags and CSV reports your funders can use.',
              },
            ].map((tile, i) => (
              <Reveal key={i} delay={i * 80} className="md:col-span-2">
                <div className="group h-full rounded-xl bg-white p-6 border border-gray-200 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-medium uppercase tracking-wide px-3 py-1 rounded-full ring-1 ${tile.chipClass}`}>
                      {tile.chip}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center">
                      <tile.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-medium text-base mb-2">{tile.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{tile.desc}</p>
                </div>
              </Reveal>
            ))}

            {/* Cohort link tile */}
            <Reveal delay={120} className="md:col-span-3">
              <div className="group h-full rounded-xl bg-white p-6 border border-gray-200 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center mb-4">
                  <Link2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-base mb-2">One link enrolls a cohort</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Share it on WhatsApp, print it on a flyer. Learners land on your
                  branded page and start immediately.
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 shadow-sm" aria-hidden="true">
                  <span className="text-xs font-mono text-gray-700">sabitek.app/c/yourprogram</span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-100 rounded-full px-2 py-1">32 joined</span>
                </div>
              </div>
            </Reveal>

            {/* Any device tile */}
            <Reveal delay={160} className="md:col-span-3">
              <div className="group h-full rounded-xl bg-white p-6 border border-gray-200 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center mb-4">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-base mb-2">Zero apps, any device</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Runs in the browser, light on data, built for the phones and
                  networks your learners actually have.
                </p>
                <div className="flex flex-wrap gap-2" aria-hidden="true">
                  {['No downloads', 'Low bandwidth', 'Mobile-first'].map((chip, i) => (
                    <span key={i} className="text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">
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
      <section className="relative py-14 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="h-px w-10 bg-red-600" />
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-red-600">Getting started</span>
                <span className="h-px w-10 bg-red-600" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-medium tracking-tight leading-snug">
                Three steps to your{' '}
                <span className="font-serif italic text-red-600">first cohort</span>
              </h2>
            </div>
          </Reveal>

          <div className="relative">
            {/* connecting line, desktop */}
            <span className="hidden md:block absolute top-[22px] left-[17%] right-[17%] h-px bg-red-200" aria-hidden="true" />
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { num: '1', title: 'Apply for access', desc: 'Apply as an organisation or an independent instructor. Applications are reviewed within 2 to 5 working days.' },
                { num: '2', title: 'Add your courses', desc: 'Build lessons in the composer, attach quizzes, arrange courses into a sequenced program.' },
                { num: '3', title: 'Share one link', desc: 'Learners join at sabitek.app/c/yourname. Progress starts arriving live the same day.' },
              ].map((step, i) => (
                <Reveal key={i} delay={i * 100}>
                  <div className="flex gap-4 text-left md:block md:text-center md:px-2">
                    <div className="relative inline-flex flex-shrink-0 w-11 h-11 rounded-full bg-red-600 ring-4 ring-[#fffcfb] items-center justify-center md:mb-4">
                      <span className="text-white font-medium">{step.num}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-base mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed md:max-w-[32ch] md:mx-auto">{step.desc}</p>
                    </div>
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
      <section className="pb-16 pt-4 sm:pb-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-xl bg-gray-900 px-6 py-12 sm:px-12 sm:py-14 ring-1 ring-white/10">
              <span className="absolute top-0 inset-x-12 h-px bg-gray-200" aria-hidden="true" />

              <div className="relative grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="h-px w-8 bg-red-600" />
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-red-300">For partners and funders</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-medium tracking-tight leading-snug text-white mb-4">
                    Built to prove outcomes to the{' '}
                    <span className="font-serif italic text-red-300">people who fund them</span>
                  </h2>
                  <p className="text-gray-300 leading-relaxed mb-7 max-w-md">
                    When you sponsor a cohort on Sabitek, you do not get an attendance
                    sheet. You get verified completion, quiz-backed mastery, and dropout
                    caught early enough to act on.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/request-access">
                      <Button className="group w-full sm:w-auto bg-white border border-gray-200 text-gray-900 hover:bg-red-50 px-7 py-5 text-sm font-medium rounded-full transition-all">
                        Request access
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform" />
                      </Button>
                    </Link>
                    <Link href="/about">
                      <Button variant="outline" className="w-full sm:w-auto bg-white/5 border border-white/25 text-white hover:bg-white/15 hover:text-white px-7 py-5 text-sm font-medium rounded-full transition-all">
                        Partner with us
                      </Button>
                    </Link>
                  </div>
                  {!user && (
                    <p className="text-sm text-gray-400 mt-6">
                      Individual learner?{' '}
                      <Link href="/waitlist" className="text-red-200 underline underline-offset-4 hover:text-white font-medium">
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
                    <div key={i} className="flex items-start gap-4 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-4">
                      <row.icon className="w-5 h-5 text-red-300 mt-1 flex-shrink-0" />
                      <span className="text-sm text-red-50/85 leading-relaxed">{row.text}</span>
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
