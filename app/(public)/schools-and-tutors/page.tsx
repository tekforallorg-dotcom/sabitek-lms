'use client';

import { useState } from 'react';
import { 
  Users,
  Sparkles,
  Brain,
  Award,
  LineChart,
  CheckCircle,
  TrendingUp,
  Clock,
  BookOpen,
  FileText,
  Zap,
  Bot,
  Building,
  Heart,
  Globe,
  ArrowRight,
  Upload,
  MessageCircle,
  BarChart3,
  Target
} from 'lucide-react';

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
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Sabitek for Schools and Tutors
              </h1>
              
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Turn your school, training centre, or tutorials into an AI-powered digital academy. 
                Sabitek gives you ready-made tools to deliver structured courses, keep learners 
                engaged, and measure real progress.
              </p>

              <div className="space-y-2 mb-8">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>Custom learning space for your learners</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>AI assistance, quizzes, notes and summaries built-in</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>Certificates and analytics without the tech headache</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm shadow-lg"
                >
                  Talk to our team
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors text-sm"
                >
                  See how Sabitek helps
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-red-50/50 via-white to-gray-50/50 rounded-2xl p-8 border border-gray-100">
                <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Your Digital Academy</p>
                      <p className="text-xs text-gray-500">Powered by AI</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Active learners</span>
                      <span className="font-semibold text-gray-900">245</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Completion rate</span>
                      <span className="font-semibold text-green-600">87%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Certificates issued</span>
                      <span className="font-semibold text-gray-900">198</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/80 p-3 rounded-lg border border-gray-100 text-center">
                    <Bot className="w-5 h-5 text-red-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">SabiBot</p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-lg border border-gray-100 text-center">
                    <Sparkles className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">SabiQuiz</p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-lg border border-gray-100 text-center">
                    <Award className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Certificates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Sabitek */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Why schools and tutors choose Sabitek
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Sabitek makes it easy to turn your knowledge and content into a professional 
              learning experience that learners actually complete without building your own tech.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                AI-powered learning journeys
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your courses automatically get AI support through SabiBot, SabiQuiz, Smart Notes 
                and AI summaries.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                Less admin, more teaching
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                We take care of the platform, hosting, and updates so you can focus on content 
                and learners.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                Impact built in
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Every deployment helps unlock sponsored access for disadvantaged communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section id="features" className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                What you get with Sabitek
              </h2>
              
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>Custom portal branded for your school, academy, or organisation.</p>
                <p>Ability to turn videos, slides, PDFs, and notes into structured courses with modules and lessons.</p>
                <p>Built-in AI tools so every course feels modern, interactive, and personalised.</p>
                <p>Certificates and progress tracking that make learning feel serious and recognised.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-gray-700">Structured courses with modules and lessons</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-gray-700">SabiBot learning assistant inside your courses</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700">SabiQuiz AI-generated quizzes</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">Smart lesson notes per lesson</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="text-gray-700">AI-generated lesson summaries</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-gray-700">Certificates on completion</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <LineChart className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700">Learner dashboards and progress tracking</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-gray-700">Instructor views to see learner activity</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-gray-700">Accessible on mobile, tablet, and desktop</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Schools */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                For schools, NGOs and organisations
              </h2>
              
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Sabitek gives you a ready-made digital academy for your students, beneficiaries, 
                or staff. You bring the content and learning goals, we handle structure, AI, 
                and learner experience.
              </p>

              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm text-gray-700">
                    Turn your content into beautiful, guided courses with modules and lessons
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700">
                    Keep learners engaged with AI quizzes, Smart Notes and summaries
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">
                    See who is learning, how far they have gone, and how they are performing
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-700">
                    Offer certificates that learners value and can show
                  </span>
                </li>
              </ul>

              <p className="text-xs text-gray-600 italic">
                You focus on content and impact. Sabitek handles the platform, AI, and delivery.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-red-50 to-transparent p-5 rounded-xl border-l-4 border-red-500">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Better Engagement</h3>
                    <p className="text-xs text-gray-600">
                      AI quizzes, notes and summaries keep learners active and interested
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-transparent p-5 rounded-xl border-l-4 border-blue-500">
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Clear Analytics</h3>
                    <p className="text-xs text-gray-600">
                      Track enrolment, completion rates, and quiz performance at a glance
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-transparent p-5 rounded-xl border-l-4 border-green-500">
                <div className="flex items-start gap-3">
                  <Clock className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Time Saved</h3>
                    <p className="text-xs text-gray-600">
                      We handle the infrastructure and AI workflows so your team does not have to
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Tutors */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              For tutors, trainers and academies
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Sabitek gives you a complete, AI-enabled classroom without needing your own 
              website or LMS.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <Upload className="w-8 h-8 text-red-600 mb-4" />
              <h3 className="text-sm font-bold text-gray-900 mb-2">Host your courses easily</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Upload videos, slides, PDFs and notes. Turn them into structured courses in minutes.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <Brain className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-sm font-bold text-gray-900 mb-2">Built-in AI support</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                SabiBot, SabiQuiz, Smart Notes and summaries are available to your learners from day one.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <Users className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="text-sm font-bold text-gray-900 mb-2">Reach ready learners</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Option to publish your courses to Sabitek wider learner community.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <Target className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="text-sm font-bold text-gray-900 mb-2">Sustainable revenue, fair share</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Set free or paid options for your courses while Sabitek manages infrastructure and access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Designed for impact, not just profit
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Sabitek is built with disadvantaged learners in mind. When schools, tutors and 
              organisations choose Sabitek, they are not just getting a powerful platform, 
              they are helping unlock learning access for those who need it most.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Cross-subsidised access</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Part of what institutions pay helps fund sponsored seats for underserved learners.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Community programmes</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Sabitek partners with NGOs and initiatives to deliver digital skills to youth, 
                women and communities at the edge.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Ethical AI for education</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                AI features are designed to support learning, not replace teachers or push paywalls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Easy to start, easy to integrate
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="mb-2">
                <span className="inline-block bg-red-50 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">
                  Step 1
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Discover</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Share your goals, type of learners, and existing content
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mb-2">
                <span className="inline-block bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
                  Step 2
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Set up</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                We help you organise your courses, enable the right AI features, and brand your space
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <div className="mb-2">
                <span className="inline-block bg-green-50 text-green-600 text-xs font-semibold px-3 py-1 rounded-full">
                  Step 3
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Launch and grow</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Invite learners, track their progress, and refine your programmes over time
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-600 text-center italic">
            Sabitek can run as your main learning platform or sit alongside your existing systems. 
            We will help you choose what works best.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Ready to explore Sabitek for your school or training?
              </h2>
              
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Tell us a bit about your school, organisation or tutorials and we will get back 
                to you with options tailored to your learners and goals.
              </p>

              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                No complicated sales funnel, just a conversation about what you are trying to 
                achieve and whether Sabitek is a good fit.
              </p>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  We typically respond within a few working days
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="organisation" className="block text-xs font-semibold text-gray-700 mb-1">
                    Organisation, school or brand name
                  </label>
                  <input
                    type="text"
                    id="organisation"
                    required
                    value={formData.organisation}
                    onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

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
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="school">School or College</option>
                    <option value="ngo">NGO or Non-profit</option>
                    <option value="company">Company or Training department</option>
                    <option value="tutor">Independent tutor or trainer</option>
                    <option value="other">Other</option>
                  </select>
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
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-semibold text-gray-700 mb-1">
                    What would you like to do with Sabitek?
                  </label>
                  <textarea
                    id="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Run digital skills training for 200 students or Host my paid graphic design course"
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {formState === 'success' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Thank you! We have received your message and will get back to you soon.
                    </p>
                  </div>
                )}

                {formState === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      Something went wrong. Please try again or email us directly at impact@tekforall.org
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formState === 'loading'}
                  className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formState === 'loading' ? 'Sending...' : 'Send enquiry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}