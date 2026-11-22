'use client'

import Link from 'next/link'
import {
  Building2,
  UserCheck,
  ArrowRight,
  CheckCircle,
  BarChart3,
  QrCode,
  Clock,
  Upload,
  Users,
  Rocket,
} from 'lucide-react'
import { Reveal, SectionLabel } from '@/components/marketing/primitives'

export default function SchoolsAndTutorsPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 overflow-x-clip">
      {/* ============================================ */}
      {/* HERO — the result, up front                   */}
      {/* ============================================ */}
      <section className="relative overflow-hidden">

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-14 sm:pt-20 sm:pb-18">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div>
                <SectionLabel>For institutions and educators</SectionLabel>
                <h1 className="text-3xl sm:text-5xl font-medium tracking-tight leading-[1.08] mb-5">
                  Launch your first cohort{' '}
                  <span className="font-serif italic text-red-600">
                    in days, not months.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-7 max-w-lg">
                  Schools, NGOs, government programs, and independent trainers use
                  Sabitek to run structured training with live progress and
                  certificates anyone can verify. No developers, no setup projects.
                </p>

                <div className="space-y-3 mb-8">
                  {[
                    'Your own branded workspace, provisioned on approval',
                    'See who is on track and who is falling behind, live',
                    'QR-verified certificates funders and employers trust',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-red-600 shadow-sm flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </span>
                      <span className="text-base text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/request-access">
                    <span className="group relative overflow-hidden inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-sm font-medium rounded-full ring-1 ring-red-600/50 transition-all cursor-pointer">
                      Request access
                      <ArrowRight className="w-4 h-4 transition-transform" />
                    </span>
                  </Link>
                  <Link href="/become-a-provider">
                    <span className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-white border border-gray-200 hover:border-gray-200 hover:bg-white text-gray-700 px-8 py-4 text-sm font-medium rounded-full shadow-sm transition-all cursor-pointer">
                      I teach independently
                    </span>
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* Proof panel: cohort snapshot */}
            <Reveal delay={150}>
              <div className="relative max-w-md mx-auto lg:max-w-none">
                <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-200" />
                    <span className="w-2.5 h-2.5 rounded-full bg-red-100" />
                    <span className="w-2.5 h-2.5 rounded-full bg-red-50 border border-gray-200" />
                    <span className="ml-3 text-xs font-medium text-gray-400">Example cohort overview</span>
                  </div>
                  <div className="p-5 sm:p-6 space-y-4">
                    {[
                      { name: 'Digital Skills, Cohort 3', pct: 82, meta: '41 of 50 on track' },
                      { name: 'Teacher Upskilling Program', pct: 64, meta: '32 of 50 on track' },
                    ].map((row, i) => (
                      <div key={i}>
                        <div className="flex items-baseline justify-between mb-2">
                          <p className="text-xs font-medium text-gray-800">{row.name}</p>
                          <span className="text-xs font-medium text-red-600 tabular-nums">{row.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-red-50 overflow-hidden mb-1">
                          <div style={{ width: `${row.pct}%` }} className="h-full rounded-full bg-red-600" />
                        </div>
                        <p className="text-xs text-gray-400">{row.meta}</p>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <QrCode className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-xs text-gray-500">Certificates issued</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 tabular-nums">128 this term</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-xs text-gray-500">Completion</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 tabular-nums">95% average</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TWO PATHS — institution vs independent        */}
      {/* ============================================ */}
      <section className="py-12 sm:py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-10">
              <SectionLabel centered>Two ways in</SectionLabel>
              <h2 className="text-2xl sm:text-4xl font-medium tracking-tight leading-snug">
                Pick the path that{' '}
                <span className="font-serif italic text-red-600">fits you</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: Building2,
                eyebrow: 'Organizations',
                title: 'Schools, NGOs, government, companies',
                points: [
                  'Run multiple programs and cohorts under one workspace',
                  'Add program managers and facilitators to share the work',
                  'Export participation evidence for funders and boards',
                ],
                link: '/request-access',
                linkText: 'Request access',
                primary: true,
              },
              {
                icon: UserCheck,
                eyebrow: 'Independent',
                title: 'Instructors, trainers, academies',
                points: [
                  'Your own branded workspace, no institution required',
                  'Publish structured tracks from content you already have',
                  'Issue certificates under your own training brand',
                ],
                link: '/become-a-provider',
                linkText: 'Apply as an instructor',
                primary: false,
              },
            ].map((card, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="group h-full flex flex-col bg-white p-7 sm:p-8 rounded-xl border border-gray-200 transition-all duration-300 relative overflow-hidden">
                  <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center">
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">{card.eyebrow}</p>
                      <h3 className="font-medium text-base leading-snug">{card.title}</h3>
                    </div>
                  </div>
                  <div className="space-y-3 mb-7 flex-1">
                    {card.points.map((point, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-1" />
                        <span className="text-sm text-gray-600 leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                  <Link href={card.link}>
                    <span
                      className={`group/btn inline-flex items-center justify-center gap-2 w-full py-3 text-sm font-medium rounded-full transition-all cursor-pointer ${
                        card.primary
                          ? 'relative overflow-hidden bg-red-600 hover:bg-red-700 text-white ring-1 ring-red-600/50'
                          : 'bg-white border border-gray-200 hover:border-gray-200 text-gray-700 shadow-sm'
                      }`}
                    >
                      {card.linkText}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </span>
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* OUTCOMES — what you walk away with            */}
      {/* ============================================ */}
      <section className="py-12 sm:py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-10">
              <SectionLabel centered>What you get</SectionLabel>
              <h2 className="text-2xl sm:text-4xl font-medium tracking-tight leading-snug">
                Results you can{' '}
                <span className="font-serif italic text-red-600">show, not tell</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Rocket, title: 'Faster launches', desc: 'Upload videos, slides, and PDFs; AI turns them into quizzes and summaries. A full program in days.' },
              { icon: BarChart3, title: 'No silent dropouts', desc: 'Live participation tracking flags who is behind while there is still time to act.' },
              { icon: QrCode, title: 'Credible certificates', desc: 'QR-verified credentials that funders, boards, and employers can check in seconds.' },
              { icon: Users, title: 'Learners who finish', desc: 'Structured paths plus AI support in 5 local languages keep completion high.' },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 70}>
                <div className="group h-full bg-white p-6 rounded-xl border border-gray-200 transition-all duration-300">
                  <div className="w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:-rotate-3">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-medium text-base mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS — three steps                    */}
      {/* ============================================ */}
      <section className="py-12 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-10">
              <SectionLabel centered>How it works</SectionLabel>
              <h2 className="text-2xl sm:text-4xl font-medium tracking-tight leading-snug">
                From application to{' '}
                <span className="font-serif italic text-red-600">first certificate</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Clock, step: '1', title: 'Apply in 5 minutes', desc: 'Tell us about your organization or training. We review within 2-5 working days.' },
              { icon: Upload, step: '2', title: 'Get your workspace', desc: 'On approval your workspace is provisioned. Upload content; AI builds quizzes and summaries.' },
              { icon: QrCode, step: '3', title: 'Launch and certify', desc: 'Invite your cohort, watch progress live, and issue verified certificates at the finish line.' },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 90}>
                <div className="relative h-full bg-white p-6 sm:p-7 rounded-xl border border-gray-200 overflow-hidden">
                  <div className="relative">
                    <item.icon className="w-5 h-5 text-red-500 mb-4" />
                    <h3 className="font-medium text-base mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-[28ch]">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA                                           */}
      {/* ============================================ */}
      <section className="pb-16 pt-4 sm:pb-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="rounded-xl bg-white border border-gray-200 px-6 py-12 sm:px-14 sm:py-14 text-center">
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-gray-900 mb-4">
                Your next cohort could start{' '}
                <span className="font-serif italic text-red-600">next week.</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-lg mx-auto">
                Apply today. Most applications are reviewed within 2 to 5 working days.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link href="/request-access">
                  <span className="group inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-9 py-4 text-sm font-medium rounded-full ring-1 ring-red-600/50 transition-all cursor-pointer">
                    Request access
                    <ArrowRight className="w-4 h-4 transition-transform" />
                  </span>
                </Link>
                <Link href="/become-a-provider">
                  <span className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-9 py-4 text-sm font-medium rounded-full transition-all cursor-pointer">
                    Apply as an instructor
                  </span>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
