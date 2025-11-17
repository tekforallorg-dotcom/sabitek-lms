'use client';

import { useState } from 'react';
import {
  Mail, AlertTriangle, School, GraduationCap,
  Lightbulb, CheckCircle, Loader2
} from 'lucide-react';

export default function ContactPage() {
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const subjects = [
    {
      value: 'technical',
      label: 'Report a technical issue',
      description: 'Something not working as expected? Send us the details.',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      value: 'school',
      label: 'School or organisation support',
      description: 'Need help setting up Sabitek for your learners?',
      icon: School,
      color: 'blue'
    },
    {
      value: 'tutor',
      label: 'Tutor & creator help',
      description: 'Questions about hosting or managing your courses?',
      icon: GraduationCap,
      color: 'green'
    },
    {
      value: 'partnership',
      label: 'Partnerships & projects',
      description: 'Want to collaborate on programmes or communities?',
      icon: Lightbulb,
      color: 'purple'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('loading');

    try {
      // Get the selected subject label
      const selectedSubject = subjects.find(s => s.value === formData.subject);
      const subjectLabel = selectedSubject?.label || 'General Enquiry';

      // Send form data to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: subjectLabel,
          message: formData.message,
        }),
      });

      if (response.ok) {
        setFormState('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setFormState('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setFormState('error');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-1.5 rounded-full mb-6 shadow-sm">
            <Mail className="w-4 h-4 text-red-600" />
            <span className="text-xs font-medium text-gray-700">Contact Us</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get in touch
          </h1>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            Select a topic below, fill in your details, and we'll get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 md:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                What can we help you with? <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.map((subject) => {
                  const Icon = subject.icon;
                  const isSelected = formData.subject === subject.value;

                  const colorClasses = {
                    red: isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200',
                    blue: isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200',
                    green: isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200',
                    purple: isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                  };

                  const iconColorClasses = {
                    red: 'text-red-600 bg-red-100',
                    blue: 'text-blue-600 bg-blue-100',
                    green: 'text-green-600 bg-green-100',
                    purple: 'text-purple-600 bg-purple-100'
                  };

                  return (
                    <button
                      key={subject.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, subject: subject.value })}
                      className={`relative text-left p-4 border-2 rounded-xl transition-all ${
                        colorClasses[subject.color as keyof typeof colorClasses]
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          iconColorClasses[subject.color as keyof typeof iconColorClasses]
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 mb-1">
                            {subject.label}
                          </div>
                          <div className="text-xs text-gray-600 line-clamp-2">
                            {subject.description}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle className="w-5 h-5 text-red-600" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                Your name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all text-sm"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Your email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all text-sm"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                Message <span className="text-red-600">*</span>
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all text-sm resize-none"
                placeholder="Please provide as much detail as possible..."
              />
            </div>

            {/* Success Message */}
            {formState === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <p className="text-sm font-medium">
                    Thank you! Your message has been sent successfully. We'll get back to you within 1-2 working days.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {formState === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="text-sm font-medium">
                    Sorry, something went wrong. Please try again or email us directly at impact@tekforall.org
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formState === 'loading' || !formData.subject}
              className="w-full px-6 py-3.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {formState === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending message...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send message
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-500">
              We typically respond within 1-2 working days
            </p>
          </form>
        </div>
      </section>

      {/* Browse by Topic */}
      <section className="py-12 md:py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Browse by topic
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Learners</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• How do I enrol in a course?</li>
                <li>• I can't log in to my account</li>
                <li>• My certificate won't download</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Schools & Organisations</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• How Sabitek works for schools</li>
                <li>• Starting a pilot programme</li>
                <li>• Understanding analytics</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Tutors & Creators</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Getting started as a tutor</li>
                <li>• Publishing your first course</li>
                <li>• Free vs paid courses</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
