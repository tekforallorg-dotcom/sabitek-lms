'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users,
  Sparkles,
  Award,
  LineChart,
  CheckCircle,
  TrendingUp,
  Clock,
  BookOpen,
  FileText,
  Zap,
  Building2,
  Heart,
  Globe,
  ArrowRight,
  MessageCircle,
  BarChart3,
  Target,
  Smartphone,
  QrCode,
  GraduationCap,
  ClipboardList,
  UserCheck,
  Layers,
  Upload,
  Play
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

export default function SchoolsAndTutorsPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    organisation: '',
    role: '',
    country: '',
    type: '',
    learnerCount: '',
    description: ''
  });

  const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('loading');

    try {
      const response = await fetch('/api/contact/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormState('success');
        setFormData({
          fullName: '',
          email: '',
          organisation: '',
          role: '',
          country: '',
          type: '',
          learnerCount: '',
          description: ''
        });
      } else {
        setFormState('error');
      }
    } catch (error) {
      setFormState('error');
    }
  };

  return (
    <main className="min-h-screen bg-white overflow-hidden">
      {/* ========================================== */}
      {/* HERO SECTION */}
      {/* ========================================== */}
      <section className="relative pt-8 pb-12 sm:pt-12 sm:pb-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-50/80 via-white to-white" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-red-100/40 to-transparent rounded-full blur-3xl opacity-60" />
        
        {/* Floating orbs */}
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

        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="mb-4">
                <span className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm">
                  <Building2 className="w-3.5 h-3.5" />
                  For Institutions & Educators
                </span>
              </motion.div>

              <motion.h1 
                variants={fadeInUp}
                className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight"
              >
                Sabitek for Schools and{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">
                  Training Providers
                </span>
              </motion.h1>

              <motion.p 
                variants={fadeInUp}
                className="text-base text-gray-600 mb-6 leading-relaxed"
              >
                Deliver structured learning with clear progress and proof of completion. 
                Programs can be run for students, beneficiaries, or staff, with visibility 
                into participation, progress, and outcomes.
              </motion.p>

              <motion.div variants={fadeInUp} className="space-y-2 mb-6">
                {[
                  'Branded learning portal for your organisation',
                  'Structured programs with modules and lessons',
                  'Progress tracking and completion certificates',
                  'No technical overhead to manage'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-3"
              >
                <a
                  href="#contact"
                  className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-red-500/20 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Talk to our team
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 bg-white/70 backdrop-blur-sm hover:bg-white text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 shadow-sm transition-all duration-300 hover:-translate-y-0.5"
                >
                  See what you get
                </a>
              </motion.div>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-3 bg-gradient-to-r from-red-500/10 via-rose-500/10 to-red-400/10 rounded-2xl blur-xl" />
              <div className="relative bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">What Matters Most</p>
                    <p className="text-xs text-gray-500">Participation, follow-through, completion</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900">245</div>
                    <div className="text-xs text-gray-500">Active learners</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">87%</div>
                    <div className="text-xs text-gray-500">Completion rate</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900">198</div>
                    <div className="text-xs text-gray-500">Certificates</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Layers, label: 'Structured', color: 'bg-red-50 text-red-500' },
                    { icon: TrendingUp, label: 'Trackable', color: 'bg-blue-50 text-blue-500' },
                    { icon: Award, label: 'Certified', color: 'bg-green-50 text-green-500' },
                  ].map((item, i) => (
                    <div key={i} className={`${item.color.split(' ')[0]} p-3 rounded-xl text-center`}>
                      <item.icon className={`w-5 h-5 ${item.color.split(' ')[1]} mx-auto mb-1`} />
                      <p className="text-xs text-gray-600">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* WHY SABITEK */}
      {/* ========================================== */}
      <section className="py-10 sm:py-14 bg-white">
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
              <Sparkles className="w-3.5 h-3.5" />
              Why Sabitek
            </motion.span>
            <motion.h2 
              variants={fadeInUp}
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
            >
              Why schools and training providers{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">
                choose Sabitek
              </span>
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-sm text-gray-600 max-w-2xl mx-auto"
            >
              Chosen by organisations that need learning delivery to be clear, manageable, 
              and accountable, without building or maintaining their own systems.
            </motion.p>
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
                icon: Layers,
                title: 'Structured Program Delivery',
                desc: 'Content organised into modules and lessons that guide learners step by step, making it easier to stay on track and complete programs.',
                gradient: 'from-red-500 to-rose-500',
                shadow: 'shadow-red-500/15'
              },
              {
                icon: Zap,
                title: 'Reduced Administrative Load',
                desc: 'Platform setup, hosting, updates, and learner access are handled centrally, allowing teams to focus on instruction and outcomes.',
                gradient: 'from-blue-500 to-cyan-500',
                shadow: 'shadow-blue-500/15'
              },
              {
                icon: Target,
                title: 'Built-In Accountability',
                desc: 'Progress dashboards and completion data provide clear visibility into learner engagement and performance across cohorts.',
                gradient: 'from-green-500 to-emerald-500',
                shadow: 'shadow-green-500/15'
              },
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={scaleIn}
                whileHover={{ y: -4 }}
                className="group relative"
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${item.gradient} rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                <div className="relative bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className={`w-11 h-11 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg ${item.shadow} group-hover:scale-105 transition-transform duration-300`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================== */}
      {/* WHAT YOU GET */}
      {/* ========================================== */}
      <section id="features" className="py-10 sm:py-14 bg-gradient-to-b from-gray-50 to-white">
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
              <ClipboardList className="w-3.5 h-3.5" />
              Features
            </motion.span>
            <motion.h2 
              variants={fadeInUp}
              className="text-2xl sm:text-3xl font-bold text-gray-900"
            >
              What you get with Sabitek
            </motion.h2>
          </motion.div>

          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { icon: Building2, label: 'Custom portal for your organisation', color: 'text-red-500 bg-red-50' },
              { icon: BookOpen, label: 'Structured courses with modules', color: 'text-blue-500 bg-blue-50' },
              { icon: FileText, label: 'Built-in practice and assessments', color: 'text-green-500 bg-green-50' },
              { icon: BarChart3, label: 'Learner dashboards and progress', color: 'text-purple-500 bg-purple-50' },
              { icon: UserCheck, label: 'Instructor views for monitoring', color: 'text-orange-500 bg-orange-50' },
              { icon: QrCode, label: 'QR-verifiable certificates', color: 'text-cyan-500 bg-cyan-50' },
              { icon: Smartphone, label: 'Mobile, tablet, and desktop', color: 'text-pink-500 bg-pink-50' },
              { icon: LineChart, label: 'Reports and analytics', color: 'text-indigo-500 bg-indigo-50' },
              { icon: Globe, label: 'No technical overhead', color: 'text-teal-500 bg-teal-50' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={scaleIn}
                className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-9 h-9 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-700">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================== */}
      {/* FOR SCHOOLS & ORGANISATIONS */}
      {/* ========================================== */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.span 
                variants={fadeInUp}
                className="inline-flex items-center gap-1.5 text-red-500 text-xs font-bold tracking-wider uppercase mb-2"
              >
                <Building2 className="w-3.5 h-3.5" />
                For Institutions
              </motion.span>
              <motion.h2 
                variants={fadeInUp}
                className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4"
              >
                For schools, NGOs, and organisations
              </motion.h2>
              
              <motion.p 
                variants={fadeInUp}
                className="text-sm text-gray-600 leading-relaxed mb-5"
              >
                Sabitek supports institutions delivering learning at scale, whether for 
                students, beneficiaries, or staff.
              </motion.p>

              <motion.div variants={fadeInUp} className="space-y-3 mb-5">
                {[
                  'Deploy structured learning programs with defined paths',
                  'Monitor enrolment, progress, and completion',
                  'Identify where learners struggle or disengage',
                  'Generate reports and certificates that demonstrate outcomes'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 bg-red-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-red-500" />
                    </div>
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </motion.div>

              <motion.p 
                variants={fadeInUp}
                className="text-xs text-gray-500 italic"
              >
                Programs can be run independently or alongside existing systems.
              </motion.p>
            </motion.div>

            <motion.div 
              className="space-y-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {[
                { icon: TrendingUp, title: 'Better Engagement', desc: 'Structured paths keep learners active and progressing', color: 'border-red-500 from-red-50' },
                { icon: BarChart3, title: 'Clear Analytics', desc: 'Track enrolment, completion rates, and performance', color: 'border-blue-500 from-blue-50' },
                { icon: Clock, title: 'Time Saved', desc: 'We handle infrastructure so your team focuses on teaching', color: 'border-green-500 from-green-50' },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  variants={scaleIn}
                  className={`bg-gradient-to-r ${item.color} to-transparent p-4 rounded-xl border-l-4 ${item.color.split(' ')[0]}`}
                >
                  <div className="flex items-start gap-3">
                    <item.icon className={`w-5 h-5 ${item.color.includes('red') ? 'text-red-500' : item.color.includes('blue') ? 'text-blue-500' : 'text-green-500'} flex-shrink-0`} />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{item.title}</h3>
                      <p className="text-xs text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* FOR TUTORS */}
      {/* ========================================== */}
      <section className="py-10 sm:py-14 bg-gray-50">
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
              <GraduationCap className="w-3.5 h-3.5" />
              For Educators
            </motion.span>
            <motion.h2 
              variants={fadeInUp}
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
            >
              For tutors, trainers, and academies
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-sm text-gray-600 max-w-xl mx-auto"
            >
              Focus on teaching while Sabitek supports delivery and structure.
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { icon: Upload, title: 'Upload content', desc: 'Videos, slides, PDFs, and notes', gradient: 'from-red-500 to-rose-500' },
              { icon: Layers, title: 'Organise', desc: 'Structured lessons and modules', gradient: 'from-blue-500 to-cyan-500' },
              { icon: Play, title: 'Deliver', desc: 'Built-in practice and support', gradient: 'from-green-500 to-emerald-500' },
              { icon: Award, title: 'Certify', desc: 'Verifiable certificates', gradient: 'from-purple-500 to-violet-500' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={scaleIn}
                whileHover={{ y: -4 }}
                className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================== */}
      {/* RESPONSIBLE ACCESS */}
      {/* ========================================== */}
      <section className="py-10 sm:py-14 bg-white">
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
              <Heart className="w-3.5 h-3.5" />
              Responsible Access
            </motion.span>
            <motion.h2 
              variants={fadeInUp}
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
            >
              Designed for access and inclusion
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
              { icon: Heart, title: 'Cross-subsidised access', desc: 'Part of institutional usage supports sponsored learning access', color: 'bg-red-100 text-red-600' },
              { icon: Users, title: 'Community partnerships', desc: 'Partnerships with community programmes help extend reach', color: 'bg-blue-100 text-blue-600' },
              { icon: GraduationCap, title: 'Supports educators', desc: 'Technology designed to support educators, not replace them', color: 'bg-green-100 text-green-600' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={scaleIn}
                className="bg-gray-50 rounded-xl p-5 border border-gray-100 text-center"
              >
                <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================== */}
      {/* GETTING STARTED */}
      {/* ========================================== */}
      <section className="py-10 sm:py-14 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4">
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
              <Zap className="w-3.5 h-3.5" />
              Getting Started
            </motion.span>
            <motion.h2 
              variants={fadeInUp}
              className="text-2xl sm:text-3xl font-bold text-gray-900"
            >
              Easy to start, easy to integrate
            </motion.h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-6 mb-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { step: '1', icon: MessageCircle, title: 'Share Your Goals', desc: 'Tell us about your learners, objectives, and materials', color: 'bg-red-100 text-red-600' },
              { step: '2', icon: Building2, title: 'Set Up Your Program', desc: 'Courses organised with the right tools for your needs', color: 'bg-blue-100 text-blue-600' },
              { step: '3', icon: TrendingUp, title: 'Launch and Improve', desc: 'Invite learners, monitor progress, refine over time', color: 'bg-green-100 text-green-600' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={scaleIn}
                className="text-center"
              >
                <div className={`w-14 h-14 ${item.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <div className="mb-2">
                  <span className={`inline-block ${item.color.replace('100', '50')} text-xs font-semibold px-3 py-1 rounded-full`}>
                    Step {item.step}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs text-gray-500 text-center italic"
          >
            Sabitek can operate as a primary learning platform or complement existing systems.
          </motion.p>
        </div>
      </section>

      {/* ========================================== */}
      {/* CONTACT FORM */}
      {/* ========================================== */}
      <section id="contact" className="py-10 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 
                variants={fadeInUp}
                className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4"
              >
                Explore Sabitek for your school or training program
              </motion.h2>
              
              <motion.p 
                variants={fadeInUp}
                className="text-sm text-gray-600 leading-relaxed mb-4"
              >
                Share a few details about your organisation or training goals, and we'll 
                respond with options that fit your context.
              </motion.p>

              <motion.p 
                variants={fadeInUp}
                className="text-sm text-gray-600 leading-relaxed mb-5"
              >
                No complex sales process, just a conversation about whether Sabitek is 
                the right fit.
              </motion.p>

              <motion.div 
                variants={fadeInUp}
                className="p-4 bg-blue-50 rounded-xl border border-blue-100"
              >
                <p className="text-xs text-blue-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  We typically respond within a few working days
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-semibold text-gray-700 mb-1">
                      Full name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                      Work email
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="organisation" className="block text-xs font-semibold text-gray-700 mb-1">
                      Organisation name
                    </label>
                    <input
                      type="text"
                      id="organisation"
                      required
                      value={formData.organisation}
                      onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-xs font-semibold text-gray-700 mb-1">
                      Your role
                    </label>
                    <input
                      type="text"
                      id="role"
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="country" className="block text-xs font-semibold text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-xs font-semibold text-gray-700 mb-1">
                      I am a
                    </label>
                    <select
                      id="type"
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select type</option>
                      <option value="school">School or College</option>
                      <option value="ngo">NGO or Non-profit</option>
                      <option value="company">Company or Training department</option>
                      <option value="tutor">Independent tutor or trainer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="learnerCount" className="block text-xs font-semibold text-gray-700 mb-1">
                    Approximate number of learners
                  </label>
                  <input
                    type="text"
                    id="learnerCount"
                    value={formData.learnerCount}
                    onChange={(e) => setFormData({ ...formData, learnerCount: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-semibold text-gray-700 mb-1">
                    What would you like to do with Sabitek?
                  </label>
                  <textarea
                    id="description"
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Run digital skills training for 200 students"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {formState === 'success' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Thank you! We'll get back to you soon.
                    </p>
                  </div>
                )}

                {formState === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      Something went wrong. Please email us at impact@tekforall.org
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formState === 'loading'}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-red-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formState === 'loading' ? 'Sending...' : 'Send enquiry'}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* FOOTER CTA */}
      {/* ========================================== */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-rose-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-white/90 text-sm font-medium">
            Sabitek — Structured learning for institutions and educators who need training to lead somewhere.
          </p>
        </div>
      </section>
    </main>
  );
}