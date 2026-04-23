'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  Sparkles, 
  HelpCircle,
  ChevronRight, 
  Bot, 
  Briefcase, 
  Users, 
  BookOpen, 
  Award, 
  ArrowRight,
  Zap,
  Globe,
  Target,
  TrendingUp,
  CheckCircle,
  Star,
  Smartphone,
  Languages,
  GraduationCap
} from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50">
      {/* ============================================ */}
      {/* HERO SECTION - Compact */}
      {/* ============================================ */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100 via-pink-50 to-red-50" />
        <div className="absolute inset-0 bg-gradient-to-tr from-red-100/50 via-transparent to-pink-100/50" />
        
        {/* Subtle floating elements */}
        <div className="absolute top-10 right-[10%] w-20 h-20 bg-gradient-to-br from-red-200/30 to-rose-200/30 rounded-2xl rotate-12 blur-sm" />
        <div className="absolute bottom-10 left-[5%] w-16 h-16 bg-gradient-to-br from-pink-200/30 to-red-200/30 rounded-xl -rotate-12 blur-sm" />

        <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-red-600 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border border-red-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                For Institutions, Training Centers, and Verified Instructors
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-3 leading-tight">
                Learn Smarter with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">
                  AI-Powered
                </span>
                {' '}Education
              </h1>
              
              <p className="text-sm sm:text-base text-gray-600 mb-3 max-w-lg mx-auto lg:mx-0">
                Learning infrastructure for institutions. Structured courses, smart quizzes, credentials, and cohort tools in one place.
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-lg mx-auto lg:mx-0">
                Powering schools, NGOs, government training programs, and verified training providers across Africa.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6">
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <Button className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-5 text-sm font-semibold rounded-xl shadow-lg shadow-red-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5">
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/courses">
                      <Button variant="outline" className="w-full sm:w-auto bg-white/80 border-gray-200 hover:bg-white px-6 py-5 text-sm font-semibold rounded-xl transition-all hover:-translate-y-0.5">
                        Browse Courses
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/request-access">
                      <Button className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-5 text-sm font-semibold rounded-xl shadow-lg shadow-red-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5">
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/auth/login">
                      <Button variant="outline" className="w-full sm:w-auto bg-white/80 border-gray-200 hover:bg-white px-6 py-5 text-sm font-semibold rounded-xl transition-all hover:-translate-y-0.5">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Trust Indicators - Compact */}
              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white shadow-sm"
                    />
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-gray-900">1,000+</span> learners
                  </p>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">4.9</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: SabiSuite Card - Compact Glassmorphism */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-red-500/20 via-pink-500/20 to-red-500/20 rounded-2xl blur-xl opacity-60" />
              
              <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/50">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">SabiSuite</h3>
                    <p className="text-xs text-gray-500">AI-Powered Learning Tools</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { icon: Bot, name: 'SabiBot', desc: 'AI Learning Assistant', href: '/sabibot' },
                    { icon: HelpCircle, name: 'SabiQuiz', desc: 'Smart Quiz Generator', href: '/sabiquiz' },
                    { icon: Briefcase, name: 'SabiAdvisor', desc: 'Career & CV Builder', href: '/sabiadvisor' },
                    { icon: Users, name: 'SabiCommunity', desc: 'Peer Mentorship', href: '/community' },
                  ].map((tool, i) => (
                    <Link key={i} href={tool.href}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 hover:bg-white border border-transparent hover:border-red-100 hover:shadow-md transition-all cursor-pointer group">
                        <div className="w-9 h-9 bg-gray-50 group-hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors">
                          <tool.icon className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{tool.name}</p>
                          <p className="text-xs text-gray-500 truncate">{tool.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curved transition */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" className="w-full h-8 sm:h-12">
            <path d="M0 60V20C360 0 720 0 1080 20C1260 30 1380 40 1440 40V60H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES SECTION - Compact */}
      {/* ============================================ */}
      <section className="py-10 sm:py-14 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-br from-red-50 to-rose-50 rounded-full blur-3xl opacity-50" />
        
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-red-50 to-rose-50 rounded-full text-xs font-semibold text-red-600 mb-2">
              Why Sabitek
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Succeed</span>
            </h2>
            <p className="text-sm text-gray-600 max-w-xl mx-auto">
              From structured courses to AI-powered tools, the complete learning ecosystem
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: BookOpen, title: 'Structured Learning', desc: 'Clear paths with progress tracking', gradient: 'from-red-500 to-rose-500' },
              { icon: Bot, title: 'AI Support', desc: 'Help in 5 local languages', gradient: 'from-rose-500 to-red-500' },
              { icon: Award, title: 'Certificates', desc: 'Verifiable QR credentials', gradient: 'from-red-600 to-rose-500' },
              { icon: Sparkles, title: 'Smart Quizzes', desc: 'AI-generated assessments', gradient: 'from-rose-500 to-red-600' },
              { icon: Briefcase, title: 'Career Builder', desc: 'CVs, interviews & guidance', gradient: 'from-red-500 to-rose-600' },
              { icon: Users, title: 'Peer Mentorship', desc: 'Learn from those ahead', gradient: 'from-rose-600 to-red-500' },
            ].map((feature, i) => (
              <div 
                key={i}
                className="group bg-white p-4 sm:p-5 rounded-xl border border-gray-100 hover:border-red-100 shadow-sm hover:shadow-lg hover:shadow-red-100/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* STATS SECTION - Compact with Gradient */}
      {/* ============================================ */}
      <section className="relative py-10 sm:py-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 bg-gradient-to-tr from-red-900/20 via-transparent to-rose-900/20" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
              Globally Trusted
            </h2>
            <p className="text-xs text-gray-400">And growing every day</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: '100+', label: 'Courses', icon: BookOpen },
              { value: '1,000+', label: 'Learners', icon: Users },
              { value: '50+', label: 'Instructors', icon: GraduationCap },
              { value: '95%', label: 'Completion', icon: TrendingUp },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <stat.icon className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mb-0.5">{stat.value}</div>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOR EDUCATORS SECTION - Compact */}
      {/* ============================================ */}
      <section className="relative py-10 sm:py-14 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="absolute top-10 right-0 w-48 h-48 bg-gradient-to-br from-red-100/40 to-rose-100/40 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-red-100 to-rose-100 rounded-full text-xs font-semibold text-red-600 mb-3">
                For Educators
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Turn Your Knowledge into a{' '}
                <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Digital Academy</span>
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload content, let AI enhance it, track learners, and issue certificates.
              </p>
              
              <div className="space-y-2 mb-5">
                {[
                  'Upload videos, slides, PDFs',
                  'AI generates quizzes & summaries',
                  'Track learner progress',
                  'Issue verifiable certificates',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/schools-and-tutors">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-4 text-sm font-semibold rounded-xl shadow-lg transition-all hover:-translate-y-0.5">
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: TrendingUp, title: 'Engagement', desc: 'AI keeps learners active', color: 'from-red-500 to-rose-500' },
                { icon: Target, title: 'Analytics', desc: 'Track performance', color: 'from-rose-500 to-red-500' },
                { icon: Zap, title: 'Time Saved', desc: 'Auto quiz creation', color: 'from-red-600 to-rose-500' },
                { icon: Globe, title: 'Reach More', desc: 'Mobile-first design', color: 'from-rose-500 to-red-600' },
              ].map((card, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all hover:-translate-y-0.5">
                  <div className={`w-9 h-9 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center mb-2 shadow-md`}>
                    <card.icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-0.5">{card.title}</h3>
                  <p className="text-xs text-gray-500">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* BUILT FOR AFRICA - Compact */}
      {/* ============================================ */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-red-50 to-rose-50 rounded-full text-xs font-semibold text-red-600 mb-2">
              Our Focus
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Built for{' '}
              <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Every Learner</span>
            </h2>
            <p className="text-sm text-gray-600">Education that meets you where you are</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Smartphone, title: 'Mobile-First', desc: 'Works on any phone' },
              { icon: TrendingUp, title: 'All Levels', desc: 'Beginner to advanced' },
              { icon: Languages, title: 'Local Languages', desc: '5+ languages' },
              { icon: Zap, title: 'Affordable', desc: 'Many free options' },
            ].map((item, i) => (
              <div key={i} className="group bg-gray-50 hover:bg-white p-4 rounded-xl border border-transparent hover:border-red-100 hover:shadow-lg transition-all text-center hover:-translate-y-1">
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-red-100 to-rose-100 group-hover:from-red-500 group-hover:to-rose-500 rounded-xl flex items-center justify-center mb-2 transition-all shadow">
                  <item.icon className="w-5 h-5 text-red-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-0.5">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CTA - Compact */}
      {/* ============================================ */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-rose-500 to-red-600" />
        <div className="absolute inset-0 bg-gradient-to-tr from-red-600/30 via-transparent to-pink-500/30" />
        
        {/* Subtle shapes */}
        <div className="absolute top-5 left-5 w-20 h-20 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-5 right-5 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        {/* Curved top */}
        <div className="absolute top-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none" className="w-full h-6 sm:h-8 rotate-180">
            <path d="M0 40V0C360 26 720 40 1080 26C1260 20 1380 10 1440 0V40H0Z" fill="white"/>
          </svg>
        </div>

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Ready to Start Learning?
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-6 max-w-xl mx-auto">
            Bring structured learning to your institution, training center, or program.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!user && (
              <>
                <Link href="/request-access">
                  <Button className="w-full sm:w-auto bg-white text-red-500 hover:bg-gray-100 px-8 py-5 text-base font-bold rounded-xl shadow-xl transition-all hover:shadow-2xl hover:-translate-y-0.5">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" className="w-full sm:w-auto bg-transparent border-2 border-white/40 text-white hover:bg-white/10 px-8 py-5 text-base font-semibold rounded-xl transition-all hover:-translate-y-0.5">
                    Learn More
                  </Button>
                </Link>
              </>
            )}
            {!user && (
              <p className="text-sm text-white/70 mt-4">
                Individual learner? <Link href="/waitlist" className="text-white underline underline-offset-2 hover:text-white/90 font-medium">Join the waitlist</Link>
              </p>
            )}
            {user && (
              <Link href="/courses">
                <Button className="w-full sm:w-auto bg-white text-red-500 hover:bg-gray-100 px-8 py-5 text-base font-bold rounded-xl shadow-xl transition-all hover:shadow-2xl hover:-translate-y-0.5">
                  Explore Courses
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}