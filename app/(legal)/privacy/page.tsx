import Link from 'next/link';
import { Shield, Lock, Eye, Database, Cookie, Globe, Mail, AlertTriangle, FileText } from 'lucide-react';
export const metadata = {
  title: 'Privacy Policy | Sabitek',
  description: 'Privacy Policy for Sabitek Learning Management System - How we collect, use, and protect your data',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
     {/* Hero Section */}
<div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div className="flex items-center gap-4 mb-6">
      <Shield className="w-12 h-12" />
      <div>
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="text-red-100 mt-2">Last updated: November 16, 2025</p>
      </div>
    </div>
    <p className="text-lg text-red-50 max-w-3xl">
      Your privacy is important to us. This policy explains how we collect, use, protect, 
      and share your personal information when you use Sabitek.
    </p>
  </div>
</div>

      {/* Quick Stats */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-t-4 border-green-500">
            <Lock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">256-bit</p>
            <p className="text-sm text-gray-600">Encryption</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-t-4 border-blue-500">
            <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">GDPR</p>
            <p className="text-sm text-gray-600">Compliant</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-t-4 border-purple-500">
            <Eye className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">Zero</p>
            <p className="text-sm text-gray-600">Data Selling</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-t-4 border-red-500">
            <Shield className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">Full</p>
            <p className="text-sm text-gray-600">Control</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10 mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-6 overflow-x-auto py-4 text-sm">
            <a href="#collection" className="whitespace-nowrap text-gray-600 hover:text-blue-600 transition">
              1. Data Collection
            </a>
            <a href="#usage" className="whitespace-nowrap text-gray-600 hover:text-blue-600 transition">
              2. How We Use Data
            </a>
            <a href="#sharing" className="whitespace-nowrap text-gray-600 hover:text-blue-600 transition">
              3. Data Sharing
            </a>
            <a href="#security" className="whitespace-nowrap text-gray-600 hover:text-blue-600 transition">
              4. Security
            </a>
            <a href="#rights" className="whitespace-nowrap text-gray-600 hover:text-blue-600 transition">
              5. Your Rights
            </a>
            <a href="#cookies" className="whitespace-nowrap text-gray-600 hover:text-blue-600 transition">
              6. Cookies
            </a>
            <a href="#children" className="whitespace-nowrap text-gray-600 hover:text-blue-600 transition">
              7. Children
            </a>
            <a href="#international" className="whitespace-nowrap text-gray-600 hover:text-blue-600 transition">
              8. International
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="mb-12 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Our Commitment to Your Privacy</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                Sabitek (operated by Tek4All Digital Inclusion Initiative) is committed to protecting 
                your personal information. We collect only what we need, use it responsibly, and give 
                you full control over your data. We never sell your personal information to third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Information We Collect */}
        <section id="collection" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">1. Information We Collect</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">1.1 Information You Provide</h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3">Account Information</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Full name</li>
                    <li>• Email address</li>
                    <li>• Password (encrypted)</li>
                    <li>• Profile photo (optional)</li>
                    <li>• Role (learner/instructor/admin)</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">Educational Data</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Course enrollments</li>
                    <li>• Progress and completion data</li>
                    <li>• Quiz responses and scores</li>
                    <li>• Certificates earned</li>
                    <li>• Learning preferences</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-5 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3">Content You Create</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Course materials (instructors)</li>
                    <li>• Comments and discussions</li>
                    <li>• Reviews and ratings</li>
                    <li>• Support messages</li>
                  </ul>
                </div>

                <div className="bg-orange-50 p-5 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-3">Payment Information</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Billing address</li>
                    <li>• Transaction history</li>
                    <li>• Payment method (via secure processor)</li>
                    <li>• Instructor payout details</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">1.2 Automatically Collected Information</h3>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Technical Data</h4>
                <ul className="grid md:grid-cols-2 gap-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>IP address and location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Device type and browser</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Operating system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Pages visited and time spent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Referral sources</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Session duration</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">1.3 AI-Enhanced Features</h3>
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-900 mb-3">
                  Our AI features (SabiQuiz, SabiAdvisor) may process:
                </p>
                <ul className="text-sm text-purple-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Course content for quiz generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Your queries to our AI career advisor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Learning patterns for personalized recommendations</span>
                  </li>
                </ul>
                <p className="text-sm text-purple-800 mt-3">
                  <strong>Note:</strong> AI processing is done securely and your data is not used to 
                  train external AI models without consent.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: How We Use Your Information */}
        <section id="usage" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">2. How We Use Your Information</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2.1 Platform Operations</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide access to courses and learning materials</li>
                <li>Track your progress and issue certificates</li>
                <li>Process payments and manage subscriptions</li>
                <li>Facilitate instructor-student interactions</li>
                <li>Send course-related notifications</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2.2 Personalization and Improvement</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Recommend courses based on your interests</li>
                <li>Customize your learning experience</li>
                <li>Analyze usage patterns to improve platform features</li>
                <li>Generate AI-powered quizzes and learning aids</li>
                <li>Provide career guidance through SabiAdvisor</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2.3 Communication</h3>
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 mb-3">We may contact you for:</p>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>✉️ Account updates and security alerts</li>
                  <li>📚 New courses and learning opportunities</li>
                  <li>🎓 Certificate availability notifications</li>
                  <li>💬 Responses to your support inquiries</li>
                  <li>📊 Platform updates and feature announcements</li>
                  <li>🎯 Promotional offers (you can opt-out)</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2.4 Legal and Safety</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Comply with legal obligations and court orders</li>
                <li>Enforce our Terms and Conditions</li>
                <li>Prevent fraud and unauthorized access</li>
                <li>Protect user safety and platform security</li>
                <li>Resolve disputes and investigate violations</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Information Sharing */}
        <section id="sharing" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">3. How We Share Your Information</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-600">
              <p className="font-semibold text-red-900 text-lg mb-2">
                🚫 We Never Sell Your Personal Data
              </p>
              <p className="text-sm text-red-800">
                Your personal information is not for sale. We do not sell, rent, or trade your data 
                to third parties for their marketing purposes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">3.1 Service Providers</h3>
              <p className="mb-3">We share data with trusted service providers who help us operate the platform:</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Supabase</h4>
                  <p className="text-sm text-gray-700">Database hosting and authentication</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">AI Services</h4>
                  <p className="text-sm text-gray-700">OpenAI, Gemini, DeepSeek for AI features</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Payment Processors</h4>
                  <p className="text-sm text-gray-700">Secure payment handling (PCI DSS compliant)</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Email Services</h4>
                  <p className="text-sm text-gray-700">Resend for transactional emails</p>
                </div>
              </div>

              <p className="text-sm mt-4 bg-yellow-50 p-4 rounded border border-yellow-200">
                <strong>Note:</strong> All service providers are contractually bound to protect your 
                data and use it only for specified purposes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">3.2 Public Information</h3>
              <p className="mb-3">Certain information is publicly visible:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your profile name and photo (if provided)</li>
                <li>Course reviews and ratings you publish</li>
                <li>Public comments and forum posts</li>
                <li>Instructor profile information</li>
                <li>Certificates with verification codes</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">3.3 Legal Requirements</h3>
              <p>We may disclose information when required by law or to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Comply with legal process or government requests</li>
                <li>Enforce our Terms and Conditions</li>
                <li>Protect rights, property, or safety of Sabitek or others</li>
                <li>Prevent fraud or security threats</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Data Security */}
        <section id="security" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">4. Data Security</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4.1 Security Measures</h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Encryption
                  </h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• SSL/TLS for data in transit</li>
                    <li>• AES-256 for data at rest</li>
                    <li>• Encrypted password storage</li>
                    <li>• Secure API communications</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Access Controls
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Multi-factor authentication available</li>
                    <li>• Role-based access permissions</li>
                    <li>• Regular security audits</li>
                    <li>• Automated threat detection</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-5 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Data Protection
                  </h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Regular backups</li>
                    <li>• Redundant storage systems</li>
                    <li>• Data loss prevention</li>
                    <li>• Disaster recovery plans</li>
                  </ul>
                </div>

                <div className="bg-orange-50 p-5 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Monitoring
                  </h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• 24/7 security monitoring</li>
                    <li>• Intrusion detection systems</li>
                    <li>• Anomaly detection</li>
                    <li>• Incident response team</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4.2 Your Responsibility</h3>
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-900 mb-3">
                  While we implement strong security measures, you also play a role in protecting your account:
                </p>
                <ul className="text-sm text-yellow-800 space-y-2">
                  <li>✓ Use a strong, unique password</li>
                  <li>✓ Enable two-factor authentication</li>
                  <li>✓ Don't share your login credentials</li>
                  <li>✓ Log out from shared devices</li>
                  <li>✓ Report suspicious activity immediately</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4.3 Data Breach Notification</h3>
              <p>
                In the unlikely event of a data breach affecting your personal information, we will 
                notify you within 72 hours via email and provide details about the incident, affected 
                data, and steps we're taking to address it.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Your Rights */}
        <section id="rights" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">5. Your Privacy Rights</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <p className="text-lg font-medium text-gray-900">
              You have the following rights regarding your personal data:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">🔍 Right to Access</h4>
                <p className="text-sm text-blue-800">
                  Request a copy of all personal data we hold about you. We'll provide this in a 
                  readable format within 30 days.
                </p>
              </div>

              <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3">✏️ Right to Rectification</h4>
                <p className="text-sm text-green-800">
                  Correct any inaccurate or incomplete personal information in your account settings 
                  or by contacting us.
                </p>
              </div>

              <div className="bg-purple-50 p-5 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3">🗑️ Right to Deletion</h4>
                <p className="text-sm text-purple-800">
                  Request deletion of your personal data. We'll comply unless we have legal grounds 
                  to retain it.
                </p>
              </div>

              <div className="bg-orange-50 p-5 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-3">📦 Right to Data Portability</h4>
                <p className="text-sm text-orange-800">
                  Receive your data in a structured, commonly used format and transfer it to another 
                  service.
                </p>
              </div>

              <div className="bg-red-50 p-5 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-900 mb-3">⛔ Right to Object</h4>
                <p className="text-sm text-red-800">
                  Object to processing of your data for marketing purposes or based on legitimate 
                  interests.
                </p>
              </div>

              <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-3">⏸️ Right to Restrict</h4>
                <p className="text-sm text-yellow-800">
                  Request that we limit how we use your data while you dispute its accuracy or 
                  lawfulness.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">5.1 How to Exercise Your Rights</h3>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <p className="font-semibold text-gray-900 mb-4">Contact us to exercise your rights:</p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> impact@tekforall.org</p>
                  <p><strong>Subject:</strong> Privacy Rights Request</p>
                  <p><strong>Response Time:</strong> Within 30 days</p>
                </div>
                <p className="text-sm mt-4 text-blue-900">
                  Please include your account email and specify which right you wish to exercise. 
                  We may verify your identity before processing requests.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Cookies */}
        <section id="cookies" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Cookie className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">6. Cookies and Tracking</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <p>
              We use cookies and similar technologies to improve your experience, analyze usage, 
              and deliver personalized content.
            </p>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">6.1 Types of Cookies</h3>
              
              <div className="space-y-4">
                <div className="bg-green-50 p-5 rounded-lg border-l-4 border-green-600">
                  <h4 className="font-semibold text-green-900 mb-2">Essential Cookies (Required)</h4>
                  <p className="text-sm text-green-800">
                    Necessary for platform functionality: authentication, security, and basic features. 
                    These cannot be disabled.
                  </p>
                </div>

                <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-600">
                  <h4 className="font-semibold text-blue-900 mb-2">Functional Cookies (Optional)</h4>
                  <p className="text-sm text-blue-800">
                    Remember your preferences, language settings, and customizations to enhance 
                    your experience.
                  </p>
                </div>

                <div className="bg-purple-50 p-5 rounded-lg border-l-4 border-purple-600">
                  <h4 className="font-semibold text-purple-900 mb-2">Analytics Cookies (Optional)</h4>
                  <p className="text-sm text-purple-800">
                    Help us understand how you use the platform so we can improve it. We use anonymized 
                    data where possible.
                  </p>
                </div>

                <div className="bg-orange-50 p-5 rounded-lg border-l-4 border-orange-600">
                  <h4 className="font-semibold text-orange-900 mb-2">Marketing Cookies (Optional)</h4>
                  <p className="text-sm text-orange-800">
                    Used to deliver relevant course recommendations and promotional content. You can 
                    opt-out anytime.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">6.2 Managing Cookies</h3>
              <p className="mb-3">You can control cookies through:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Our cookie preferences center (accessible from your account settings)</li>
                <li>Your browser settings (may affect site functionality)</li>
                <li>Third-party opt-out tools for analytics providers</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 7: Children's Privacy */}
        <section id="children" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">7. Children's Privacy</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-4 text-gray-700">
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <p className="font-semibold text-yellow-900 mb-3">
                Age Requirement: 13 Years or Older
              </p>
              <p className="text-sm text-yellow-800 mb-3">
                Sabitek is intended for users aged 13 and above. Users under 13 require parental or 
                guardian consent and supervision.
              </p>
              <ul className="text-sm text-yellow-800 space-y-2">
                <li>• We do not knowingly collect data from children under 13 without consent</li>
                <li>• Parents can request access to or deletion of their child's data</li>
                <li>• We limit data collection for users aged 13-18</li>
                <li>• Educational institutions must obtain proper consent before enrolling minors</li>
              </ul>
            </div>

            <p>
              If you believe we have inadvertently collected information from a child under 13 without 
              proper consent, please contact us immediately at <strong>privacy@sabitek.school</strong> 
              and we will delete the information promptly.
            </p>
          </div>
        </section>

        {/* Section 8: International Data Transfers */}
        <section id="international" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">8. International Data Transfers</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-4 text-gray-700">
            <p>
              Sabitek is based in Nigeria, but we serve learners globally. Your data may be processed 
              in different countries where our service providers operate.
            </p>

            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Data Protection Safeguards</h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• We use EU-approved Standard Contractual Clauses for data transfers</li>
                <li>• Service providers are required to maintain GDPR-equivalent protections</li>
                <li>• Data is encrypted during transfer and storage</li>
                <li>• We conduct regular compliance audits of third-party processors</li>
              </ul>
            </div>

            <p className="mt-4">
              <strong>Primary Data Locations:</strong> Nigeria (primary), United States (cloud hosting), 
              European Union (select services). All transfers comply with applicable data protection laws.
            </p>
          </div>
        </section>

        {/* Additional Sections */}
        <section className="mb-12 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Data Retention</h2>
            <div className="prose prose-gray max-w-none text-gray-700">
              <p className="mb-3">We retain your data for as long as necessary to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide our services and maintain your account</li>
                <li>Comply with legal obligations (e.g., tax records for 7 years)</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Prevent fraud and maintain security</li>
              </ul>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Retention Periods:</h4>
                <ul className="text-sm space-y-2">
                  <li>• <strong>Active accounts:</strong> Retained while account is active</li>
                  <li>• <strong>Closed accounts:</strong> Deleted within 90 days (some data retained for legal compliance)</li>
                  <li>• <strong>Course progress:</strong> Retained for 3 years after last activity</li>
                  <li>• <strong>Certificates:</strong> Retained permanently for verification</li>
                  <li>• <strong>Transaction records:</strong> 7 years (legal requirement)</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Third-Party Links</h2>
            <div className="prose prose-gray max-w-none text-gray-700">
              <p>
                Our platform may contain links to third-party websites, including course resources and 
                external tools. We are not responsible for the privacy practices of these sites. We 
                encourage you to review their privacy policies before providing any information.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <div className="prose prose-gray max-w-none text-gray-700">
              <p>
                We may update this Privacy Policy periodically to reflect changes in our practices or 
                legal requirements. Material changes will be notified via email and platform notification. 
                Continued use of Sabitek after changes constitutes acceptance of the updated policy.
              </p>
              <p className="mt-3">
                <strong>Last major update:</strong> November 16, 2025
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <p className="font-semibold text-gray-900 mb-4">
                Questions or concerns about your privacy?
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Privacy Officer:</strong> impact@tekforall.org</p>
                <p><strong>General Support:</strong> </p>
                <p><strong>Data Protection Officer:</strong> </p>
                <p><strong>Address:</strong> Tek4All Initiative, Abuja, FCT, Nigeria</p>
                <p><strong>Website:</strong> <Link href="/" className="text-blue-600 hover:text-blue-700">https://sabitek.school</Link></p>
              </div>
              <p className="text-sm mt-4 text-gray-600">
                We aim to respond to all privacy inquiries within 48 hours.
              </p>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link 
              href="/terms" 
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Read our Terms and Conditions
            </Link>
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Sabitek
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}