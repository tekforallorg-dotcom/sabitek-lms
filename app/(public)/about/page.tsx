'use client'

import Link from 'next/link'
import {
  GraduationCap,
  Building2,
  UserCheck,
  ArrowRight,
  QrCode,
  BarChart3,
  Smartphone,
  Languages,
  BookOpen,
  Wifi,
} from 'lucide-react'
import { Reveal, SectionLabel, GRAIN } from '@/components/marketing/primitives'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fffcfb] text-gray-900 overflow-x-clip">
      {/* ============================================ */}
      {/* HERO — what Sabitek delivers                  */}
      {/* ============================================ */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-28 right-[-10%] w-[32rem] h-[32rem] bg-rose-100/70 rounded-full blur-[110px]" />
        <div className="absolute top-52 left-[-12%] w-80 h-80 bg-red-50 rounded-full blur-[90px]" />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
            backgroundSize: '26px 26px',
            maskImage: 'radial-gradient(ellipse 60% 55% at 50% 30%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 30%, black, transparent)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: GRAIN }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-20 sm:pb-16 text-center">
          <Reveal>
            <SectionLabel centered>About Sabitek</SectionLabel>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.08] mb-5">
              Training that ends in{' '}
              <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-pink-600">
                verified skills.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10">
              Most training fails quietly: content is scattered, progress is invisible,
              and nobody can prove what was learned. Sabitek gives institutions and
              instructors one place to run structured programs, see completion as it
              happens, and issue credentials employers can verify.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="grid grid-cols-3 gap-px max-w-lg mx-auto rounded-2xl overflow-hidden border border-rose-100 bg-rose-100">
              {[
                { value: '95%', label: 'completion rate' },
                { value: '1,000+', label: 'active learners' },
                { value: '4', label: 'countries reached' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/90 backdrop-blur px-3 py-4 text-center">
                  <div className="text-xl sm:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-rose-600">
                    {stat.value}
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================ */}
      {/* WHO IT'S FOR — one result per audience        */}
      {/* ============================================ */}
      <section className="py-12 sm:py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-14 mb-10">
            <Reveal>
              <div>
                <SectionLabel>Who we serve</SectionLabel>
                <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-snug">
                  One platform,{' '}
                  <span className="font-serif italic text-red-600">three outcomes</span>
                </h2>
              </div>
            </Reveal>
            <Reveal delay={100} className="self-end">
              <p className="text-gray-600 leading-relaxed max-w-lg">
                Whether you run a school, train a cohort, or teach your own students,
                the result is the same: learners who finish, and proof that they did.
              </p>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Building2,
                title: 'Institutions',
                result: 'Run programs at scale with full visibility',
                desc: 'Schools, NGOs, and government programs track every cohort’s participation and export evidence of outcomes for funders and boards.',
                link: '/request-access',
                linkText: 'Get Started',
              },
              {
                icon: UserCheck,
                title: 'Training providers',
                result: 'Turn your expertise into a digital academy',
                desc: 'Verified instructors get their own workspace: publish structured tracks, manage cohorts, and issue credentials under your brand.',
                link: '/become-a-provider',
                linkText: 'Become a Provider',
              },
              {
                icon: GraduationCap,
                title: 'Learners',
                result: 'Finish what you start, and prove it',
                desc: 'Clear paths with checkpoints, AI help in 5 local languages, and a QR-verified certificate at the end that employers can check.',
                link: '/courses',
                linkText: 'Browse Courses',
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group h-full flex flex-col bg-gradient-to-b from-white to-rose-50/40 p-6 sm:p-7 rounded-2xl border border-rose-100 ring-1 ring-white shadow-[0_10px_30px_-18px_rgba(225,29,72,0.25)] transition-all duration-300 hover:shadow-[0_24px_50px_-20px_rgba(225,29,72,0.4)] hover:-translate-y-1 hover:border-rose-200">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)] flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-1">
                    {item.title}
                  </p>
                  <h3 className="font-semibold text-[17px] leading-snug mb-2">{item.result}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{item.desc}</p>
                  <Link
                    href={item.link}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                  >
                    {item.linkText}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW RESULTS HAPPEN — capability strip         */}
      {/* ============================================ */}
      <section className="py-12 sm:py-14 bg-gradient-to-b from-white to-rose-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-10">
              <SectionLabel centered>How results happen</SectionLabel>
              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-snug">
                Built for{' '}
                <span className="font-serif italic text-red-600">real-world learning</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: BookOpen, title: 'Structured paths', desc: 'Programs broken into modules, lessons, and checkpoints, so learners always know the next step.' },
              { icon: BarChart3, title: 'Visible progress', desc: 'Completion tracked in real time. No more guessing who showed up or who fell behind.' },
              { icon: QrCode, title: 'Verifiable certificates', desc: 'Every credential carries a QR code anyone can scan to confirm it is real.' },
              { icon: Smartphone, title: 'Works on any phone', desc: 'Mobile-first design that runs on the devices your learners already own.' },
              { icon: Wifi, title: 'Low-bandwidth ready', desc: 'Built for unreliable networks, so learning does not stop when the connection dips.' },
              { icon: Languages, title: '5+ local languages', desc: 'AI support in English, Pidgin, Yorùbá, Hausa, and Igbo keeps every learner moving.' },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="h-full bg-white/80 backdrop-blur p-5 sm:p-6 rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-18px_rgba(225,29,72,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-20px_rgba(225,29,72,0.4)]">
                  <item.icon className="w-5 h-5 text-red-500 mb-3" />
                  <h3 className="font-semibold text-[15px] mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA                                           */}
      {/* ============================================ */}
      <section className="pb-16 pt-2 sm:pb-20 bg-rose-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 px-6 py-14 sm:px-14 sm:py-16 text-center ring-1 ring-white/20 shadow-[0_45px_90px_-35px_rgba(190,18,60,0.6)]">
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/15 to-transparent" aria-hidden="true" />
              <div className="absolute -top-20 -right-16 w-72 h-72 bg-white/10 rounded-full blur-[80px]" />
              <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-pink-300/25 rounded-full blur-[70px]" />
              <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: GRAIN }} />

              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-4">
                  Ready to see{' '}
                  <span className="font-serif italic">real completion?</span>
                </h2>
                <p className="text-base sm:text-lg text-white/85 mb-9 max-w-lg mx-auto">
                  Bring your institution, training center, or teaching practice onto
                  Sabitek. Applications are reviewed within 2-5 working days.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Link href="/request-access">
                    <span className="group inline-flex items-center justify-center gap-2 bg-white text-red-600 hover:bg-rose-50 px-9 py-3.5 text-sm font-semibold rounded-full shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-0.5 cursor-pointer">
                      Get Started
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                  <Link href="/become-a-provider">
                    <span className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur border border-white/40 text-white hover:bg-white/20 px-9 py-3.5 text-sm font-semibold rounded-full transition-all hover:-translate-y-0.5 cursor-pointer">
                      Become a Provider
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
