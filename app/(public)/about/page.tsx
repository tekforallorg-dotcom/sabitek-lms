'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Target, 
  BookOpen,
  FileText,
  Users,
  Smartphone,
  Languages,
  TrendingUp,
  Briefcase,
  Bot,
  MessageSquare,
  Video,
  HelpCircle,
  GraduationCap,
  ArrowRight,
  Building2,
  BarChart3,
  QrCode,
  Wifi,
  UserCheck,
  Play,
  Zap,
  CircleDot
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* ========================================== */}
      {/* HERO SECTION */}
      {/* ========================================== */}
      <section className="relative pt-8 pb-12 sm:pt-12 sm:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-50/80 via-white to-white" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-red-100/40 to-transparent rounded-full blur-3xl opacity-60" />

        <motion.div 
          className="absolute top-20 right-[20%] w-24 h-24 rounded-full bg-red-200/25 blur-2xl"
          animate={{ y: [0, -10, 0], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-10 left-[15%] w-32 h-32 rounded-full bg-rose-200/20 blur-2xl"
          animate={{ y: [0, 15, 0], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <motion.div 
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-4">
              <span className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
                Learning Infrastructure for Africa
              </span>
            </motion.div>

            <motion.h1 
              variants={fadeInUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight tracking-tight"
            >
              About{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">
                Sabitek
              </span>
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-6 leading-relaxed"
            >
              Learning infrastructure for{' '}
              <span className="text-gray-900 font-medium">institutions, training centers, and verified instructors</span>{' '}
              delivering structured programs with measurable outcomes.
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10"
            >
              <Link
                href="/courses"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-red-500/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                Start Learning
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/sabitools"
                className="group inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm hover:bg-white text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="w-6 h-6 bg-red-50 rounded-md flex items-center justify-center">
                  <Play className="w-3 h-3 text-red-500 ml-0.5" />
                </div>
                Explore SabiSuite
              </Link>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="grid grid-cols-3 gap-6 max-w-sm mx-auto"
            >
              {[
                { value: '1K+', label: 'Active Learners' },
                { value: '50+', label: 'Courses' },
                { value: '5+', label: 'Institutions' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========================================== */}
      {/* VISION SECTION */}
      {/* ========================================== */}
      <section className="py-10 sm:py-14 bg-white relative">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              <motion.span 
                variants={fadeInUp}
                className="inline-flex items-center gap-1.5 text-red-500 text-xs font-bold tracking-wider uppercase mb-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Our Vision
              </motion.span>
              <motion.h2 
                variants={fadeInUp}
                className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight"
              >
                Learning that{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">
                  leads somewhere
                </span>
              </motion.h2>
              
              <motion.div variants={fadeInUp} className="space-y-3 text-sm text-gray-600 leading-relaxed">
                <p>
                  Learning on Sabitek is organized into clear programs with defined paths, 
                  built-in practice, and progress tracking that supports completion.
                </p>
                <p>
                  The platform serves individual learners while enabling institutions, 
                  educators, and training programs to deliver learning with clear progress 
                  and proof of completion.
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-4 flex flex-wrap gap-2">
                {['Self-paced', 'Guided cohorts', 'Institution-led'].map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-3 bg-gradient-to-r from-red-500/10 via-rose-500/10 to-red-400/10 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-red-500/15 to-transparent rounded-full blur-2xl" />
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">Learning that Leads Somewhere</h3>
                      <p className="text-gray-400 text-xs">Our Core Philosophy</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-5">
                    Learning that is accessible, guided, and practical, so curiosity 
                    can translate into capability.
                  </p>
                  <div className="pt-4 border-t border-gray-700/50 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-rose-500 border-2 border-gray-900" style={{ zIndex: 4-i }} />
                      ))}
                    </div>
                    <span className="text-gray-400 text-xs">Join thousands of learners</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* PURPOSE SECTION */}
      {/* ========================================== */}
      <section className="py-10 sm:py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-red-50/20" />
        
        <div className="relative max-w-4xl mx-auto px-4">
          <motion.div 
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.span 
              variants={fadeInUp}
              className="inline-flex items-center gap-1.5 text-red-500 text-xs font-bold tracking-wider uppercase mb-2"
            >
              <Target className="w-3.5 h-3.5" />
              Purpose
            </motion.span>
            <motion.h2 
              variants={fadeInUp}
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6"
            >
              Why Sabitek exists
            </motion.h2>
            
            <motion.div 
              variants={fadeInUp}
              className="relative max-w-2xl mx-auto"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-red-400 to-rose-400 rounded-full" />
              <blockquote className="text-base sm:text-lg text-gray-600 leading-relaxed pl-5 text-left italic">
                &ldquo;Learning often fails not because people lack motivation, but because content 
                is fragmented, progress is unclear, and outcomes are difficult to demonstrate.&rdquo;
              </blockquote>
            </motion.div>
            
            <motion.p 
              variants={fadeInUp}
              className="mt-5 text-sm text-gray-600 leading-relaxed max-w-xl mx-auto"
            >
              Sabitek brings structure to learning delivery and completion with defined paths, 
              checkpoints, and assessments.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ========================================== */}
      {/* WHO WE SERVE */}
      {/* ========================================== */}
      <section className="py-10 sm:py-14 bg-white relative">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div 
            className="text-center mb-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.span 
              variants={fadeInUp}
              className="inline-flex items-center gap-1.5 text-red-500 text-xs font-bold tracking-wider uppercase mb-2"
            >
              <Users className="w-3.5 h-3.5" />
              Who We Serve
            </motion.span>
            <motion.h2 
              variants={fadeInUp}
              className="text-2xl sm:text-3xl font-bold text-gray-900"
            >
              Built for everyone who wants to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">
                learn and grow
              </span>
            </motion.h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: GraduationCap,
                title: 'Learners',
                desc: 'Individuals building skills at their own pace with clear structure and guidance.',
                gradient: 'from-red-500 to-rose-500',
                shadow: 'shadow-red-500/15',
                link: '/courses',
                linkText: 'Start learning'
              },
              {
                icon: UserCheck,
                title: 'Training Providers',
                desc: 'Verified instructors and trainers delivering structured programs with their own workspace.',
                gradient: 'from-blue-500 to-cyan-500',
                shadow: 'shadow-blue-500/15',
                link: '/become-a-provider',
                linkText: 'Become a provider'
              },
              {
                icon: Building2,
                title: 'Institutions',
                desc: 'Schools, NGOs, government agencies, and companies delivering training at scale.',
                gradient: 'from-emerald-500 to-green-500',
                shadow: 'shadow-emerald-500/15',
                link: '/request-access',
                linkText: 'Get Started'
              },
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={scaleIn}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group relative"
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${item.gradient} rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                <div className="relative bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  <div className={`w-11 h-11 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg ${item.shadow} group-hover:scale-105 transition-transform duration-300`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1.5">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">{item.desc}</p>
                  <Link 
                    href={item.link}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm text-gray-700 font-medium group-hover:text-red-500 transition-colors"
                  >
                    {item.linkText}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================== */}
      {/* PLATFORM FEATURES */}
      {/* ========================================== */}
      <section className="py-10 sm:py-14 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-48 h-48 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="relative max-w-5xl mx-auto px-4">
          <motion.div 
            className="text-center mb-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.span 
              variants={fadeInUp}
              className="inline-flex items-center gap-1.5 text-red-400 text-xs font-bold tracking-wider uppercase mb-2"
            >
              <Zap className="w-3.5 h-3.5" />
              Platform
            </motion.span>
            <motion.h2 
              variants={fadeInUp}
              className="text-2xl sm:text-3xl font-bold text-white mb-2"
            >
              Learning on Sabitek
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-sm text-gray-400 max-w-lg mx-auto"
            >
              A complete platform for structured learning and measurable outcomes
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { icon: BookOpen, title: 'Clear Paths', desc: 'Modules & lessons', gradient: 'from-red-500 to-rose-500' },
              { icon: Video, title: 'Multi-Format', desc: 'Video, text, PDF', gradient: 'from-blue-500 to-cyan-500' },
              { icon: HelpCircle, title: 'Practice', desc: 'Quizzes & checkpoints', gradient: 'from-green-500 to-emerald-500' },
              { icon: BarChart3, title: 'Progress', desc: 'Track completion', gradient: 'from-purple-500 to-violet-500' },
              { icon: QrCode, title: 'Certificates', desc: 'QR-verifiable', gradient: 'from-orange-500 to-amber-500' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={scaleIn}
                whileHover={{ y: -3 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
              >
                <div className={`w-9 h-9 bg-gradient-to-br ${item.gradient} rounded-lg flex items-center justify-center mb-2`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-0.5">{item.title}</h3>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================== */}
      {/* SABISUITE */}
      {/* ========================================== */}
      <section id="sabisuite" className="py-10 sm:py-14 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute top-10 left-0 w-40 h-40 bg-red-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-0 w-48 h-48 bg-rose-100/30 rounded-full blur-3xl" />
        
        <div className="relative max-w-5xl mx-auto px-4">
          <motion.div 
            className="text-center mb-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg shadow-red-500/20 mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                SabiSuite
              </span>
            </motion.div>
            <motion.h2 
              variants={fadeInUp}
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
            >
              The technology powering Sabitek
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-sm text-gray-600 max-w-lg mx-auto"
            >
              AI-powered tools for learning delivery, practice, and support
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: Bot,
                name: 'SabiBot',
                subtitle: 'Learning Assistant',
                desc: 'Supports learners by explaining concepts and guiding next steps.',
                feature: 'English, Pidgin, Yoruba, Hausa, Igbo',
                featureIcon: Languages,
                gradient: 'from-red-500 to-rose-500',
                tag: 'AI',
                tagColor: 'bg-red-50 text-red-600'
              },
              {
                icon: HelpCircle,
                name: 'SabiQuiz',
                subtitle: 'Smart Quiz Generator',
                desc: 'Turns learning materials into quizzes that reinforce understanding.',
                feature: 'Upload PDFs, documents, or paste text',
                featureIcon: FileText,
                gradient: 'from-blue-500 to-cyan-500',
                tag: 'AI',
                tagColor: 'bg-blue-50 text-blue-600'
              },
              {
                icon: Briefcase,
                name: 'SabiAdvisor',
                subtitle: 'Career and CV Tools',
                desc: 'CV building, interview preparation, and career guidance.',
                feature: 'Export to PDF and DOCX',
                featureIcon: FileText,
                gradient: 'from-emerald-500 to-green-500',
                tag: 'AI',
                tagColor: 'bg-emerald-50 text-emerald-600'
              },
              {
                icon: Users,
                name: 'SabiCommunity',
                subtitle: 'Peer Mentorship',
                desc: 'Peer discussion and mentorship for accountability.',
                feature: 'Connect with mentors and peers',
                featureIcon: MessageSquare,
                gradient: 'from-purple-500 to-violet-500',
                tag: 'Social',
                tagColor: 'bg-purple-50 text-purple-600'
              },
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={scaleIn}
                whileHover={{ y: -3 }}
                className="group relative"
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${item.gradient} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur`} />
                <div className="relative bg-white rounded-xl p-5 border border-gray-200 group-hover:border-transparent transition-all duration-300 h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                        <p className="text-gray-500 text-xs">{item.subtitle}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 ${item.tagColor} text-[10px] font-bold rounded-full`}>{item.tag}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{item.desc}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                    <item.featureIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span>{item.feature}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================== */}
      {/* DESIGN PRINCIPLES */}
      {/* ========================================== */}
      <section className="py-10 sm:py-14 bg-white relative">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div 
            className="text-center mb-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.span 
              variants={fadeInUp}
              className="inline-flex items-center gap-1.5 text-red-500 text-xs font-bold tracking-wider uppercase mb-2"
            >
              <CircleDot className="w-3.5 h-3.5" />
              Design Principles
            </motion.span>
            <motion.h2 
              variants={fadeInUp}
              className="text-2xl sm:text-3xl font-bold text-gray-900"
            >
              Built for real-world environments
            </motion.h2>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { icon: Smartphone, title: 'Mobile-first', desc: 'Everyday devices' },
              { icon: Wifi, title: 'Low-bandwidth', desc: 'Works anywhere' },
              { icon: Users, title: 'All levels', desc: 'Mixed literacy' },
              { icon: Languages, title: 'Local languages', desc: 'Accessible' },
              { icon: TrendingUp, title: 'Clear progress', desc: 'Visible completion' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={scaleIn}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group text-center p-4 rounded-xl bg-gray-50 hover:bg-gradient-to-br hover:from-red-500 hover:to-rose-500 transition-all duration-300 cursor-pointer"
              >
                <div className="w-10 h-10 bg-white group-hover:bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm transition-all duration-300">
                  <item.icon className="w-5 h-5 text-red-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-white text-sm mb-0.5 transition-colors duration-300">{item.title}</h3>
                <p className="text-xs text-gray-500 group-hover:text-white/80 transition-colors duration-300">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================== */}
      {/* FINAL CTA */}
      {/* ========================================== */}
      <section className="relative py-14 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-rose-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent" />
        
        <motion.div 
          className="absolute top-8 left-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-8 right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, delay: 1 }}
        />
        
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />

        <motion.div 
          className="relative max-w-3xl mx-auto px-4 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h2 
            variants={fadeInUp}
            className="text-2xl sm:text-3xl font-bold text-white mb-4"
          >
            Start delivering structured learning
          </motion.h2>
          
          <motion.p 
            variants={fadeInUp}
            className="text-sm text-white/80 mb-8 max-w-lg mx-auto leading-relaxed"
          >
            Schools, NGOs, training centers, and verified instructors use Sabitek to run programs with clear progress and proof of completion.
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto mb-8"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left border border-white/20">
              <GraduationCap className="w-7 h-7 text-white mb-2" />
              <h3 className="font-semibold text-white text-sm mb-1">For Learners</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Explore structured programs and complete learning with clarity.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left border border-white/20">
              <UserCheck className="w-7 h-7 text-white mb-2" />
              <h3 className="font-semibold text-white text-sm mb-1">For Institutions &amp; Providers</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Get your own workspace to create programs, manage cohorts, and issue credentials.
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              href="/request-access"
              className="group inline-flex items-center justify-center gap-2 bg-white text-red-600 hover:bg-gray-100 px-6 py-3 rounded-xl text-sm font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/become-a-provider"
              className="inline-flex items-center justify-center gap-2 bg-transparent text-white hover:bg-white/10 px-6 py-3 rounded-xl text-sm font-semibold border border-white/30 hover:border-white/50 transition-all duration-300 hover:-translate-y-0.5"
            >
              Become a Provider
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}