import Link from 'next/link';
import { 
  Brain, 
  Sparkles, 
  MessageCircle, 
  Target, 
  GraduationCap,
  BookOpen,
  Award,
  LineChart,
  CheckCircle,
  FileText,
  Zap,
  Users,
  Globe,
  Smartphone,
  Languages,
  DollarSign,
  TrendingUp,
  Clock,
  Briefcase,
  Bot
} from 'lucide-react';

export const metadata = {
  title: 'About Sabitek | School of the Free',
  description: 'AI-powered learning platform built for African learners. Structured courses, smart notes, AI quizzes, and career guidance.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-block mb-4">
                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider bg-red-50 px-3 py-1 rounded-full">
                  Sabitek - School of the free
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                About Sabitek
              </h1>
              
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  Sabitek is a digital school built for people who are hungry to learn but 
                  tired of being overwhelmed.
                </p>
                <p>
                  Instead of leaving you to swim through millions of random videos and tutorials, 
                  Sabitek gives you clear learning paths, a friendly AI learning assistant, and 
                  courses you can actually finish, many of them free or very affordable.
                </p>
                <p>
                  Whether you're a student, teacher, busy professional, or organisation that 
                  wants to train people better, Sabitek is your "School of the free" where 
                  real skills meet accessible learning.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-8">
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                  AI-powered learning journeys
                </span>
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                  Built for African learners
                </span>
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                  Free and low-cost courses
                </span>
              </div>
            </div>

            {/* Right: Visual Card */}
            <div className="relative">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="space-y-4">
                  {/* SabiBot - Red Circle with White Icon */}
                  <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">SabiBot</p>
                      <p className="text-xs text-gray-500">AI Learning Assistant</p>
                    </div>
                  </div>
                  
                  {/* SabiQuiz - White Circle with Red Icon */}
                  <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 border-2 border-gray-100">
                      <Sparkles className="w-6 h-6 text-red-600" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">SabiQuiz</p>
                      <p className="text-xs text-gray-500">AI Assessment Partner</p>
                    </div>
                  </div>
                  
                  {/* SabiAdvisor - White Circle with Red Icon */}
                  <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 border-2 border-gray-100">
                      <Briefcase className="w-6 h-6 text-red-600" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">SabiAdvisor</p>
                      <p className="text-xs text-gray-500">Career & Learning Guide</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Is Sabitek */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left: Description */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                What is Sabitek?
              </h2>
              
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  Sabitek is an AI-powered learning platform that turns knowledge into experience.
                </p>
                
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">It helps you:</p>
                  <ul className="space-y-1.5 ml-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>Turn scattered content into well-structured courses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>Learn through modules and bite-sized lessons</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>Use AI to understand, revise, and stay on track</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>Earn certificates that reflect your effort</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 space-y-3 text-xs">
                  <p className="text-gray-700">
                    <strong>For schools, tutors, and organisations:</strong> A simple way to 
                    turn your trainings and content into a proper digital academy.
                  </p>
                  <p className="text-gray-700">
                    <strong>For learners:</strong> A place where you don't just watch — you 
                    learn with support.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Structured Learning
                </h3>
                <p className="text-xs text-gray-600">
                  Clear paths from start to finish
                </p>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  AI Support
                </h3>
                <p className="text-xs text-gray-600">
                  Smart assistance built-in
                </p>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Certificates
                </h3>
                <p className="text-xs text-gray-600">
                  Recognition that counts
                </p>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  For Everyone
                </h3>
                <p className="text-xs text-gray-600">
                  Individuals & institutions
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Spotlight - Three Pillars */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              AI at the Heart of Sabitek
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Three intelligent features that make learning personal, effective, and guided
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* SabiBot */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  <Bot className="w-3.5 h-3.5" />
                  AI Learning Assistant
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  SabiBot
                </h3>
              </div>

              <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
                <p>
                  More than a chatbot – a personal learning companion that understands your 
                  goals through natural conversation.
                </p>
                
                <div className="space-y-2">
                  <p className="font-medium text-gray-900 text-sm">Builds your path:</p>
                  <ul className="space-y-1 ml-3">
                    <li>• Suggests courses that fit you</li>
                    <li>• Recommends where to start</li>
                    <li>• Focuses on skills that matter</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-gray-900 text-sm">Gives insights:</p>
                  <ul className="space-y-1 ml-3">
                    <li>• Where you're improving</li>
                    <li>• Where you struggle</li>
                    <li>• Encouragement to stay on track</li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5" />
                    English, Hausa, Igbo, Yoruba, Pidgin
                  </p>
                </div>
              </div>
            </div>

            {/* SabiQuiz */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Quizzes
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  SabiQuiz 
                </h3>
              </div>

              <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
                <p>
                  AI-powered quiz engine that turns learning into active practice by 
                  auto-generating quizzes from your actual lessons.
                </p>
                
                <div className="space-y-2">
                  <p className="font-medium text-gray-900 text-sm">Helps you:</p>
                  <ul className="space-y-1 ml-3">
                    <li>• Test your understanding</li>
                    <li>• Discover what you've absorbed</li>
                    <li>• Reinforce long-term memory</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-gray-900 text-sm">Shows you:</p>
                  <ul className="space-y-1 ml-3">
                    <li>• Topics you're strong in</li>
                    <li>• Areas needing practice</li>
                    <li>• Improvement over time</li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Saves tutors time while keeping learners engaged
                  </p>
                </div>
              </div>
            </div>

            {/* SabiAdvisor */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  <Briefcase className="w-3.5 h-3.5" />
                  AI Career Guide
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  SabiAdvisor 
                </h3>
              </div>

              <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
                <p>
                  Helps you explore careers and roles – from data to design, coding to 
                  digital marketing.
                </p>
                
                <div className="space-y-2">
                  <p className="font-medium text-gray-900 text-sm">Breaks down:</p>
                  <ul className="space-y-1 ml-3">
                    <li>• What roles look like</li>
                    <li>• Skills they require</li>
                    <li>• Possible learning paths</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-gray-900 text-sm">Supports:</p>
                  <ul className="space-y-1 ml-3">
                    <li>• Secondary students</li>
                    <li>• Fresh graduates</li>
                    <li>• Career switchers</li>
                    <li>• Digital skills seekers</li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Connects learning to real opportunities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Notes & AI Summaries */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Smart Lesson Notes & AI Summaries ✍️
              </h2>
              <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                Learning is not just about watching or reading — it's about processing and 
                remembering. Sabitek gives you tools to make what you learn truly stick.
              </p>

              <div className="space-y-6">
                {/* Smart Notes */}
                <div className="bg-gradient-to-r from-green-50 to-transparent p-5 rounded-xl border-l-4 border-green-500">
                  <div className="flex items-start gap-3 mb-2">
                    <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                    <h3 className="text-sm font-bold text-gray-900">Smart Lesson Notes</h3>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1.5 ml-8">
                    <li>• Dedicated notes space per lesson</li>
                    <li>• Jot down key points in your own words</li>
                    <li>• Capture questions and "aha!" moments</li>
                    <li>• Save life/work-relevant examples</li>
                    <li>• Notes stay attached for easy revision</li>
                  </ul>
                </div>

                {/* AI Summaries */}
                <div className="bg-gradient-to-r from-blue-50 to-transparent p-5 rounded-xl border-l-4 border-blue-500">
                  <div className="flex items-start gap-3 mb-2">
                    <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                    <h3 className="text-sm font-bold text-gray-900">AI-Generated Summaries</h3>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1.5 ml-8">
                    <li>• AI-powered recaps after lessons or modules</li>
                    <li>• Turn long content into short, clear summaries</li>
                    <li>• Highlight the most important ideas</li>
                    <li>• Simple, friendly language</li>
                    <li>• Quick revision before quizzes or interviews</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-700">
                  <strong className="text-gray-900">Smart Notes + AI Summaries + SabiQuiz</strong> together 
                  make learning deeper and more memorable.
                </p>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs font-semibold text-gray-900">Your Notes</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-100 rounded w-full"></div>
                      <div className="h-2 bg-gray-100 rounded w-4/5"></div>
                      <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-semibold text-gray-900">AI Summary</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-blue-50 rounded w-full"></div>
                      <div className="h-2 bg-blue-50 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Learners Can Enjoy */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              What Learners Can Enjoy
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Sabitek is built to make learning feel clear, supported, and rewarding
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
              <BookOpen className="w-6 h-6 text-red-600 mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Structured Courses</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Courses broken into modules and short lessons with clear beginning, middle, and end
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
              <GraduationCap className="w-6 h-6 text-blue-600 mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Multi-format Lessons</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Videos, readable explanations, PDFs, and slides – learn your way
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
              <FileText className="w-6 h-6 text-green-600 mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Smart Lesson Notes</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Save thoughts, questions, and key points for each lesson
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
              <Zap className="w-6 h-6 text-yellow-600 mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 mb-2">AI Summaries</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Fast, clear recaps to help you remember more
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
              <Sparkles className="w-6 h-6 text-purple-600 mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 mb-2">SabiQuiz Checkpoints</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Auto-generated quizzes to test understanding and build confidence
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
              <Bot className="w-6 h-6 text-red-600 mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 mb-2">SabiBot Support</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Ask for explanations in English, Hausa, Igbo, Yoruba, or Pidgin
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
              <LineChart className="w-6 h-6 text-blue-600 mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Progress Tracking</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                See how much you've completed and resume where you left off
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
              <Award className="w-6 h-6 text-green-600 mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Certificates</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Complete courses and earn shareable certificates for CV, LinkedIn, employers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Schools & Organisations Gain */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                What Schools, Tutors & Organisations Gain
              </h2>
              
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  Sabitek makes it easy to turn your knowledge and content into a professional 
                  learning experience that learners actually complete.
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <span>Turn content into beautiful, guided courses with modules and lessons</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>Keep learners engaged with AI quizzes, notes & summaries</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span>See who is learning, how far they've gone, and how they're performing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <span>Offer certificates that learners value and can show</span>
                  </li>
                </ul>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-700 italic">
                    You focus on content and impact. Sabitek handles structure, AI, and 
                    learner experience.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Stats Cards */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-red-50 to-transparent p-5 rounded-xl border-l-4 border-red-500">
                <TrendingUp className="w-6 h-6 text-red-600 mb-2" />
                <h3 className="text-sm font-bold text-gray-900 mb-1">Better Engagement</h3>
                <p className="text-xs text-gray-600">
                  AI quizzes and summaries keep learners active and interested
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-transparent p-5 rounded-xl border-l-4 border-blue-500">
                <LineChart className="w-6 h-6 text-blue-600 mb-2" />
                <h3 className="text-sm font-bold text-gray-900 mb-1">Clear Analytics</h3>
                <p className="text-xs text-gray-600">
                  Track progress, completion rates, and quiz performance
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-transparent p-5 rounded-xl border-l-4 border-green-500">
                <Clock className="w-6 h-6 text-green-600 mb-2" />
                <h3 className="text-sm font-bold text-gray-900 mb-1">Time Saved</h3>
                <p className="text-xs text-gray-600">
                  AI generates quizzes and summaries automatically from your content
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Built for African Learners */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Built for African Learners First
          </h2>
          <p className="text-sm text-gray-600 mb-12 max-w-2xl mx-auto">
            Whether you're in a busy city or a quiet town, Sabitek brings a school experience 
            to wherever you are
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Mobile-First</h3>
              <p className="text-xs text-gray-600">
                Works great on phones where most learning happens
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">All Levels</h3>
              <p className="text-xs text-gray-600">
                Supports different learning speeds and backgrounds
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Languages className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Local Languages</h3>
              <p className="text-xs text-gray-600">
                Uses English, Hausa, Igbo, Yoruba, and Pidgin
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Affordable</h3>
              <p className="text-xs text-gray-600">
                Many free and low-cost learning options available
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - ULTRA REFINED */}
      <section className="relative overflow-hidden">
        {/* Multi-layer Gradient with High Transparency */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-red-600/30 to-red-700/20"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-orange-500/10 via-transparent to-pink-500/10"></div>
        
        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 backdrop-blur-3xl bg-white/40"></div>

        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Join the School of the Free
            </h2>
            
            <div className="space-y-4 text-sm text-gray-700 mb-10 max-w-2xl mx-auto leading-relaxed">
              <p>
                <strong className="text-gray-900 font-semibold">Learners:</strong> Start a course, talk to SabiBot, 
                take a SabiQuiz, and see how learning can feel guided and enjoyable.
              </p>
              <p>
                <strong className="text-gray-900 font-semibold">Schools & Tutors:</strong> Turn your knowledge into 
                structured, AI-supported courses your learners will actually complete.
              </p>
              <p>
                <strong className="text-gray-900 font-semibold">Organisations & NGOs:</strong> Use Sabitek to train 
                staff and communities with a modern, AI-enabled learning platform.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/courses"
                className="inline-flex items-center px-8 py-3.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all text-sm shadow-xl hover:shadow-2xl hover:scale-105"
              >
                Start Learning
              </Link>
              <Link
                href="/schools-and-tutors"
                className="inline-flex items-center px-8 py-3.5 bg-white/80 backdrop-blur-sm text-gray-900 font-semibold rounded-xl border-2 border-gray-200 hover:bg-white transition-all text-sm shadow-lg"
              >
                For Schools & Tutors
              </Link>
            </div>

            <p className="text-xs text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Sabitek – School of the free. Where your curiosity meets clear paths, smart notes, 
              AI support, and real skills.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}