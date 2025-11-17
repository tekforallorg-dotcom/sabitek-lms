'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, ChevronDown, ChevronRight,
  Sparkles, Users, GraduationCap,
  MessageCircle, Award, BookOpen,
  Zap, Target, Heart, Globe,
  CreditCard, HelpCircle, Check
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: any;
  color: string;
  questions: FAQItem[];
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  const categories: FAQCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      color: 'red',
      questions: [
        {
          question: 'What is Sabitek?',
          answer: 'Sabitek is an AI-powered learning management system designed specifically for African learners and underserved communities. We provide structured courses, AI learning assistants, smart quizzes, and certificates to make quality education accessible to everyone.'
        },
        {
          question: 'How do I sign up?',
          answer: 'Click the "Get Started" button on our homepage. You can sign up with your email address or use Google authentication. Once registered, you\'ll have immediate access to our free courses and can explore all features.'
        },
        {
          question: 'Is Sabitek really free?',
          answer: 'Yes! We offer many free courses as part of our mission to democratize education. Some premium courses and features are paid, but our core learning experience is completely free. We believe learning should be accessible to everyone.'
        },
        {
          question: 'What devices can I use?',
          answer: 'Sabitek works on any device - desktop, laptop, tablet, or smartphone. Our platform is mobile-first, meaning it\'s optimized for phones where most learning happens in Africa. You can switch between devices seamlessly.'
        },
        {
          question: 'Do I need an internet connection?',
          answer: 'Currently, yes. However, we\'re working on offline capabilities for downloaded courses. You\'ll be able to download lessons and access them without internet, syncing your progress when you reconnect.'
        }
      ]
    },
    {
      id: 'learners',
      title: 'For Learners',
      icon: GraduationCap,
      color: 'blue',
      questions: [
        {
          question: 'How do courses work?',
          answer: 'Courses are organized into modules, each with multiple lessons. Lessons can include videos, text content, PDFs, and slides. You progress through them at your own pace, take quizzes to test understanding, and earn certificates upon completion.'
        },
        {
          question: 'Can I take notes during lessons?',
          answer: 'Absolutely! Every lesson has a Smart Notes feature where you can jot down key points, questions, or personal insights. Your notes are saved automatically and stay attached to each lesson for easy revision.'
        },
        {
          question: 'What languages are available?',
          answer: 'Sabitek supports English, Hausa, Igbo, Yoruba, and Nigerian Pidgin. Our AI assistant SabiBot can help explain concepts in any of these languages, making learning more accessible.'
        },
        {
          question: 'How do I track my progress?',
          answer: 'Your learner dashboard shows completion percentages for each course, quiz scores, time spent learning, and upcoming lessons. You can see detailed analytics on your strengths and areas needing improvement.'
        },
        {
          question: 'Can I learn at my own pace?',
          answer: 'Yes! All courses are self-paced. There are no deadlines unless you\'re enrolled through a school or organization. You can pause, resume, and revisit lessons anytime.'
        }
      ]
    },
    {
      id: 'ai-features',
      title: 'AI Features',
      icon: Sparkles,
      color: 'purple',
      questions: [
        {
          question: 'What is SabiBot?',
          answer: 'SabiBot is your personal AI learning assistant. Ask questions about your courses, get explanations in simpler terms, receive study suggestions, and get encouragement. SabiBot understands context from your learning journey and provides personalized guidance.'
        },
        {
          question: 'How does SabiQuiz work?',
          answer: 'SabiQuiz automatically generates quizzes from lesson content using AI. It creates relevant questions to test your understanding, provides instant feedback, and adapts difficulty based on your performance. Every quiz helps reinforce what you\'ve learned.'
        },
        {
          question: 'What is SabiAdvisor?',
          answer: 'SabiAdvisor is your AI career counselor. It helps you explore different career paths, understand required skills, suggests relevant courses, and creates personalized learning roadmaps based on your goals and interests.'
        },
        {
          question: 'Are AI summaries accurate?',
          answer: 'Yes! Our AI summaries are generated from actual lesson content and reviewed for accuracy. They highlight key concepts, main ideas, and important details to help you revise quickly before quizzes or exams.'
        },
        {
          question: 'Can I trust AI-generated content?',
          answer: 'Absolutely. All AI features are built on proven models and validated by educational standards. Human instructors review AI-generated quizzes and summaries. We use AI to enhance learning, not replace quality instruction.'
        }
      ]
    },
    {
      id: 'schools-tutors',
      title: 'For Schools & Tutors',
      icon: Users,
      color: 'green',
      questions: [
        {
          question: 'How do schools use Sabitek?',
          answer: 'Schools can create custom learning portals for their students, upload course content, track learner progress, issue certificates, and access analytics on class performance. We handle the tech infrastructure while you focus on teaching.'
        },
        {
          question: 'Can I create my own courses?',
          answer: 'Yes! Instructors can easily create courses by uploading videos, PDFs, slides, and text. Our system automatically structures them into modules and lessons. AI features like quizzes and summaries are generated automatically.'
        },
        {
          question: 'How do I manage multiple classes?',
          answer: 'The instructor dashboard lets you manage unlimited courses and learner groups. You can see who\'s enrolled, track progress, view quiz scores, and communicate with learners - all from one central location.'
        },
        {
          question: 'What analytics do I get?',
          answer: 'Detailed analytics show enrollment rates, completion percentages, average quiz scores, time spent learning, topic-level performance, and learner engagement. Export reports for institutional requirements.'
        },
        {
          question: 'How much does it cost for schools?',
          answer: 'Pricing is customized based on number of learners and features needed. Contact us at impact@tekforall.org for a tailored quote. Part of institutional fees helps fund free access for disadvantaged learners.'
        }
      ]
    },
    {
      id: 'certificates',
      title: 'Certificates & Progress',
      icon: Award,
      color: 'yellow',
      questions: [
        {
          question: 'How do I earn a certificate?',
          answer: 'Complete all lessons and modules in a course, pass the required quizzes (usually 70% or higher), and you\'ll automatically receive a certificate. It\'s generated instantly and available for download.'
        },
        {
          question: 'Are certificates recognized?',
          answer: 'Sabitek certificates show completion of structured learning programs. While not accredited qualifications, they demonstrate skills learned and commitment to education. Many employers value them for digital skills training.'
        },
        {
          question: 'Can I share my certificate?',
          answer: 'Yes! Certificates include a unique QR code for verification. You can download as PDF, share on LinkedIn, add to your CV, or email to employers. Each certificate is verifiable on our platform.'
        },
        {
          question: 'What if I fail a quiz?',
          answer: 'You can retake quizzes as many times as needed. We encourage learning from mistakes. Review the lesson content, check your notes, ask SabiBot for help, then try again. There\'s no penalty for retaking.'
        },
        {
          question: 'Do certificates expire?',
          answer: 'No, Sabitek certificates never expire. They\'re permanently recorded in your learner profile and can be accessed anytime. The verification QR code remains valid indefinitely.'
        }
      ]
    },
    {
      id: 'pricing',
      title: 'Pricing & Plans',
      icon: CreditCard,
      color: 'indigo',
      questions: [
        {
          question: 'What is free on Sabitek?',
          answer: 'Many courses, AI features (SabiBot, SabiQuiz, Smart Notes), progress tracking, and certificates are completely free. Our mission is to make quality education accessible, so core features remain free forever.'
        },
        {
          question: 'What are paid features?',
          answer: 'Some advanced courses created by professional instructors, specialized certifications, and premium content may have fees. Schools and organizations pay for custom portals and advanced analytics. Individual learners access most features free.'
        },
        {
          question: 'How does pricing help communities?',
          answer: 'Part of revenue from paid courses and institutional subscriptions funds free access for disadvantaged learners. When you pay, you\'re helping sponsor education for those who need it most.'
        },
        {
          question: 'Can I get a refund?',
          answer: 'Yes, if you purchase a paid course and it\'s not what you expected, contact us within 7 days for a full refund. We want you to be satisfied with your learning experience.'
        },
        {
          question: 'Are there student discounts?',
          answer: 'We offer significant discounts for verified students, teachers, and NGO workers. Most educational content remains free. Contact impact@tekforall.org for special pricing.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical & Support',
      icon: HelpCircle,
      color: 'gray',
      questions: [
        {
          question: 'What if I forgot my password?',
          answer: 'Click "Forgot Password" on the login page. Enter your email address, and we\'ll send a password reset link. Follow the instructions to create a new password securely.'
        },
        {
          question: 'How do I contact support?',
          answer: 'Email us at impact@tekforall.org for help with technical issues, or impact@tekforall.org for partnerships and institutional inquiries. We typically respond within 24-48 hours.'
        },
        {
          question: 'Is my data safe?',
          answer: 'Absolutely. We use industry-standard encryption, secure authentication, and never sell your data. Your learning progress, notes, and personal information are protected. Read our Privacy Policy for details.'
        },
        {
          question: 'Can I delete my account?',
          answer: 'Yes. Go to Settings > Account > Delete Account. This permanently removes your data. Note: certificates earned are archived for verification purposes even after account deletion.'
        },
        {
          question: 'What browsers are supported?',
          answer: 'Sabitek works on all modern browsers: Chrome, Firefox, Safari, Edge, and Opera. For best experience, use the latest version. Mobile browsers on iOS and Android are fully supported.'
        }
      ]
    }
  ];

  const toggleQuestion = (categoryId: string, questionIndex: number) => {
    const key = `${categoryId}-${questionIndex}`;
    const newOpen = new Set(openQuestions);
    if (newOpen.has(key)) {
      newOpen.delete(key);
    } else {
      newOpen.add(key);
    }
    setOpenQuestions(newOpen);
  };

  const filteredCategories = categories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const colorClasses = {
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-500', hover: 'hover:bg-red-50' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500', hover: 'hover:bg-blue-50' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-500', hover: 'hover:bg-purple-50' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-500', hover: 'hover:bg-green-50' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-500', hover: 'hover:bg-yellow-50' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-500', hover: 'hover:bg-indigo-50' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-500', hover: 'hover:bg-gray-50' }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-50/50 to-white">
        <div className="absolute inset-0 bg-grid-gray-100/50"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-red-100 px-4 py-2 rounded-full mb-6 shadow-sm">
            <HelpCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs font-semibold text-gray-700">Frequently Asked Questions</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How can we help you?
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Find answers to common questions about Sabitek, our AI features, courses, and how to get the most out of your learning experience.
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all text-sm"
            />
          </div>
        </div>
      </section>

      {/* Category Quick Links */}
      <section className="border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon;
              const colors = colorClasses[category.color as keyof typeof colorClasses];
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    const element = document.getElementById(category.id);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border whitespace-nowrap transition-all ${colors.hover} ${
                    activeCategory === category.id 
                      ? `${colors.bg} ${colors.text} border-current` 
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{category.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try different keywords or browse categories below</p>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredCategories.map((category) => {
                const Icon = category.icon;
                const colors = colorClasses[category.color as keyof typeof colorClasses];
                
                return (
                  <div key={category.id} id={category.id} className="scroll-mt-24">
                    {/* Category Header */}
                    <div className={`flex items-center gap-3 mb-6 pb-4 border-b-2 ${colors.border}`}>
                      <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                        <p className="text-sm text-gray-500">{category.questions.length} questions</p>
                      </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-3">
                      {category.questions.map((question, index) => {
                        const key = `${category.id}-${index}`;
                        const isOpen = openQuestions.has(key);
                        
                        return (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all"
                          >
                            <button
                              onClick={() => toggleQuestion(category.id, index)}
                              className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <ChevronRight 
                                  className={`w-5 h-5 ${colors.text} flex-shrink-0 mt-0.5 transition-transform ${
                                    isOpen ? 'rotate-90' : ''
                                  }`}
                                />
                                <span className="font-semibold text-gray-900">{question.question}</span>
                              </div>
                            </button>
                            
                            <div
                              className={`transition-all duration-300 ease-in-out ${
                                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                              } overflow-hidden`}
                            >
                              <div className={`px-5 pb-5 pl-14 ${colors.bg} bg-opacity-30`}>
                                <p className="text-sm text-gray-700 leading-relaxed">{question.answer}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Still Need Help */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center shadow-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Still need help?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our support team is here to help you with any questions about Sabitek.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm shadow-lg"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Support
              </Link>
              <Link
                href="/schools-and-tutors"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors text-sm"
              >
                <Users className="w-4 h-4 mr-2" />
                For Schools & Tutors
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="border-t border-gray-100 py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">24/7</div>
              <div className="text-sm text-gray-600">Support Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">48hrs</div>
              <div className="text-sm text-gray-600">Response Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-sm text-gray-600">Free Core Features</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">5+</div>
              <div className="text-sm text-gray-600">Languages Supported</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}