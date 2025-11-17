'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Search, Mail, AlertTriangle, School, Users, 
  Lightbulb, BookOpen, HelpCircle, GraduationCap,
  ArrowRight, Sparkles
} from 'lucide-react';

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const quickActions = [
    {
      value: 'technical',
      icon: AlertTriangle,
      title: 'Report a technical issue',
      description: 'Something not working as expected? Send us the details.',
      color: 'red'
    },
    {
      value: 'school',
      icon: School,
      title: 'School or organisation support',
      description: 'Need help setting up Sabitek for your learners?',
      color: 'blue'
    },
    {
      value: 'tutor',
      icon: GraduationCap,
      title: 'Tutor & creator help',
      description: 'Questions about hosting or managing your courses?',
      color: 'green'
    },
    {
      value: 'partnership',
      icon: Lightbulb,
      title: 'Partnerships & projects',
      description: 'Want to collaborate on programmes or communities?',
      color: 'purple'
    }
  ];

  const helpCategories = [
    {
      icon: Users,
      title: 'Learners',
      links: [
        { text: 'How do I enrol in a course?', href: '#' },
        { text: 'I can\'t log in to my account', href: '#' },
        { text: 'My certificate won\'t download', href: '#' },
        { text: 'How do I change my language?', href: '#' }
      ],
      contactSubject: 'learner'
    },
    {
      icon: School,
      title: 'Schools & Organisations',
      links: [
        { text: 'How Sabitek works for schools', href: '/schools-and-tutors' },
        { text: 'Starting a pilot programme', href: '#' },
        { text: 'Understanding learner analytics', href: '#' },
        { text: 'Impact & sponsored seats', href: '/about' }
      ],
      contactSubject: 'school'
    },
    {
      icon: GraduationCap,
      title: 'Tutors & Creators',
      links: [
        { text: 'Getting started as a tutor', href: '#' },
        { text: 'Publishing your first course', href: '#' },
        { text: 'Free vs paid courses', href: '#' },
        { text: 'Supporting your learners', href: '#' }
      ],
      contactSubject: 'tutor'
    }
  ];

  const featuredGuides = [
    {
      title: 'What is Sabitek – School of the free?',
      description: 'Learn about our mission and how we\'re making education accessible',
      icon: BookOpen,
      href: '/about'
    },
    {
      title: 'How AI supports your learners on Sabitek',
      description: 'Discover SabiBot, SabiQuiz, and Smart Notes',
      icon: Sparkles,
      href: '/faq#ai-features'
    },
    {
      title: 'Using Sabitek in your school or programme',
      description: 'Everything you need to get started',
      icon: School,
      href: '/schools-and-tutors'
    }
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-1.5 rounded-full mb-6 shadow-sm">
            <HelpCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs font-medium text-gray-700">Support Center</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            How can we help?
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Find quick answers, explore guides, or talk directly to the Sabitek team. 
            We're here to support your learning and teaching.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search help topics (e.g. 'certificate', 'login', 'school setup')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all text-sm"
            />
          </div>
        </div>
      </section>

      {/* Quick Action Tiles */}
      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const colorClasses = {
                red: 'bg-red-50 text-red-600 group-hover:bg-red-100',
                blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
                green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
                purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100'
              };
              
              return (
                <Link
                  key={index}
                  href={`/contact?subject=${action.value}`}
                  className="group flex items-start gap-4 p-5 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all bg-white"
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${colorClasses[action.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-red-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-8 text-center">
            Browse by topic
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {helpCategories.map((category, index) => {
              const Icon = category.icon;
              
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-red-600" />
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {category.title}
                  </h3>
                  
                  <ul className="space-y-2.5 mb-6">
                    {category.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link
                          href={link.href}
                          className="text-sm text-gray-600 hover:text-red-600 transition-colors flex items-center gap-2"
                        >
                          <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                          {link.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href={`/contact?subject=${category.contactSubject}`}
                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <Mail className="w-4 h-4" />
                    Contact us about this
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Guides */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-8 text-center">
            Featured guides
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredGuides.map((guide, index) => {
              const Icon = guide.icon;
              
              return (
                <Link
                  key={index}
                  href={guide.href}
                  className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-red-200 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-red-600" />
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                    {guide.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {guide.description}
                  </p>
                  
                  <div className="flex items-center gap-1 text-sm text-red-600 font-medium">
                    Learn more
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Still Need Help CTA */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Still need help?
            </h2>
            
            <p className="text-base text-gray-600 mb-8 max-w-xl mx-auto">
              Can't find what you're looking for? Our team reads every message and will 
              get back to you with support tailored to your situation.
            </p>
            
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Mail className="w-5 h-5 mr-2" />
              Contact Sabitek Support
            </Link>
            
            <p className="text-xs text-gray-500 mt-4">
              We typically respond within a few working days
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}