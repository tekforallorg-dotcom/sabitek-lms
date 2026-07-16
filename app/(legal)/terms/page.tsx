import Link from 'next/link';
import { Scale, Shield, BookOpen, Users, AlertCircle, FileText, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Terms and Conditions | Sabitek',
  description: 'Terms and Conditions for using Sabitek Learning Management System',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4 mb-6">
            <Scale className="w-12 h-12" />
            <div>
              <h1 className="text-4xl font-bold">Terms and Conditions</h1>
              <p className="text-red-100 mt-2">Last updated: November 16, 2025</p>
            </div>
          </div>
          <p className="text-lg text-red-50 max-w-3xl">
            Welcome to Sabitek. By accessing our platform, you agree to these terms. 
            Please read them carefully before using our services.
          </p>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-6 overflow-x-auto py-4 text-sm">
            <a href="#acceptance" className="whitespace-nowrap text-gray-600 hover:text-red-600 transition">
              1. Acceptance
            </a>
            <a href="#accounts" className="whitespace-nowrap text-gray-600 hover:text-red-600 transition">
              2. Accounts
            </a>
            <a href="#content" className="whitespace-nowrap text-gray-600 hover:text-red-600 transition">
              3. Content
            </a>
            <a href="#payments" className="whitespace-nowrap text-gray-600 hover:text-red-600 transition">
              4. Payments
            </a>
            <a href="#intellectual" className="whitespace-nowrap text-gray-600 hover:text-red-600 transition">
              5. IP Rights
            </a>
            <a href="#prohibited" className="whitespace-nowrap text-gray-600 hover:text-red-600 transition">
              6. Prohibited Use
            </a>
            <a href="#termination" className="whitespace-nowrap text-gray-600 hover:text-red-600 transition">
              7. Termination
            </a>
            <a href="#liability" className="whitespace-nowrap text-gray-600 hover:text-red-600 transition">
              8. Liability
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="mb-12 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Important Notice</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                These Terms and Conditions constitute a legally binding agreement between you and 
                Sabitek (operated by Tek4All Digital Inclusion Initiative). By using our platform, 
                you acknowledge that you have read, understood, and agree to be bound by these terms.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Acceptance of Terms */}
        <section id="acceptance" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">1. Acceptance of Terms</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-4 text-gray-700">
            <p>
              By accessing and using Sabitek ("the Platform", "we", "us", "our"), you accept and 
              agree to be bound by these Terms and Conditions and our Privacy Policy.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">You agree that:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>You are at least 13 years of age (or have parental/guardian consent)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>You have the legal capacity to enter into binding agreements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>All information you provide is accurate and complete</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>You will comply with all applicable laws and regulations</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: User Accounts */}
        <section id="accounts" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">2. User Accounts and Responsibilities</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2.1 Account Registration</h3>
              <p>
                To access certain features, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Ensuring your account information remains accurate and up-to-date</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2.2 Account Types</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">Learner Account</h4>
                  <p className="text-sm text-green-800">
                    Access courses, track progress, earn certificates, and participate in quizzes.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Instructor Account</h4>
                  <p className="text-sm text-blue-800">
                    Create courses, upload content, manage students, and earn revenue.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">Admin Account</h4>
                  <p className="text-sm text-purple-800">
                    Platform management, user oversight, and content moderation.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2.3 Account Security</h3>
              <p>
                You must not share your account with others. Sabitek reserves the right to suspend 
                or terminate accounts that violate security policies or show signs of unauthorized access.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Content and Intellectual Property */}
        <section id="content" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">3. Content and Usage Rights</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">3.1 User-Generated Content</h3>
              <p className="mb-4">
                When you upload, submit, or create content on Sabitek (courses, lessons, quizzes, comments), 
                you grant us a worldwide, non-exclusive, royalty-free license to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Host, store, and display your content</li>
                <li>Make your content available to other users</li>
                <li>Modify or adapt content for technical requirements</li>
                <li>Use your content for promotional purposes (with attribution)</li>
              </ul>
              <p className="mt-4 text-sm bg-yellow-50 p-4 rounded border border-yellow-200">
                <strong className="text-yellow-900">Important:</strong> You retain ownership of your content. 
                This license is solely for platform operation and does not transfer ownership to Sabitek.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">3.2 Instructor Content Rights</h3>
              <p>As an instructor, you represent and warrant that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>You own or have necessary rights to all content you upload</li>
                <li>Your content does not infringe on third-party intellectual property</li>
                <li>Your content complies with applicable laws and regulations</li>
                <li>You have obtained all necessary permissions for any third-party materials</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">3.3 Prohibited Content</h3>
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <p className="font-semibold text-red-900 mb-3">You may not upload content that:</p>
                <ul className="space-y-2 text-sm text-red-800">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✗</span>
                    <span>Infringes on intellectual property rights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✗</span>
                    <span>Contains malware, viruses, or harmful code</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✗</span>
                    <span>Promotes violence, hate speech, or discrimination</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✗</span>
                    <span>Contains explicit sexual content or child exploitation material</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✗</span>
                    <span>Violates privacy rights or contains personal information without consent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✗</span>
                    <span>Promotes illegal activities or fraudulent schemes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Payments and Refunds */}
        <section id="payments" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">4. Payments, Pricing, and Refunds</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4.1 Course Pricing</h3>
              <p>
                Sabitek offers both free and paid courses. Instructors set the prices for their courses, 
                subject to platform guidelines. All prices are displayed in Nigerian Naira (NGN) or US Dollars (USD).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4.2 Payment Processing</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Payments are processed securely through our payment partners</li>
                <li>You authorize us to charge your selected payment method</li>
                <li>All payments are final unless otherwise stated in our refund policy</li>
                <li>We reserve the right to change prices at any time</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4.3 Refund Policy</h3>
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-900 mb-3">30-Day Money-Back Guarantee</p>
                <p className="text-sm text-blue-800 mb-3">
                  If you're not satisfied with a course, you may request a refund within 30 days 
                  of purchase, provided:
                </p>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>You have completed less than 30% of the course content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>You have not downloaded course certificates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>The refund request is made in good faith</span>
                  </li>
                </ul>
                <p className="text-sm text-blue-800 mt-3">
                  <strong>Note:</strong> Refunds are processed within 7-14 business days.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4.4 Instructor Payouts</h3>
              <p>
                Instructors earn revenue from paid course enrollments. Sabitek retains a platform fee 
                (typically 20-30%) to cover hosting, payment processing, and platform maintenance. 
                Detailed payout terms are available in the Instructor Agreement.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Intellectual Property Rights */}
        <section id="intellectual" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">5. Intellectual Property Rights</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">5.1 Platform Ownership</h3>
              <p>
                The Sabitek platform, including its design, logo, branding, code, and original content, 
                is owned by Tek4All Digital Inclusion Initiative and protected by international copyright, 
                trademark, and intellectual property laws.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">5.2 Trademarks</h3>
              <p>
                "Sabitek," the Sabitek logo, "SabiQuiz," "SabiAdvisor," and other platform features 
                are trademarks of Tek4All. You may not use these marks without prior written permission.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">5.3 Copyright Infringement</h3>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="mb-3">
                  If you believe content on Sabitek infringes your copyright, contact us at:
                </p>
                <div className="text-sm space-y-1">
                  <p><strong>Email:</strong> legal@sabitek.app</p>
                  <p><strong>Subject:</strong> Copyright Infringement Notice</p>
                </div>
                <p className="text-sm mt-3">
                  Include: (1) Description of copyrighted work, (2) Location of infringing content, 
                  (3) Your contact information, (4) Statement of good faith belief, (5) Electronic signature.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Prohibited Uses */}
        <section id="prohibited" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">6. Prohibited Uses and Conduct</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-4 text-gray-700">
            <p className="font-semibold">You agree not to:</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2">Platform Misuse</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Attempt to hack or breach security</li>
                  <li>• Use automated tools (bots, scrapers)</li>
                  <li>• Reverse engineer platform code</li>
                  <li>• Overload or disrupt servers</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2">Content Violations</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Share pirated or illegal content</li>
                  <li>• Impersonate others or create fake accounts</li>
                  <li>• Engage in harassment or bullying</li>
                  <li>• Spam or send unsolicited messages</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2">Commercial Misuse</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Resell or redistribute course content</li>
                  <li>• Use platform for competitor analysis</li>
                  <li>• Engage in fraudulent transactions</li>
                  <li>• Manipulate reviews or ratings</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2">Legal Violations</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Violate any applicable laws</li>
                  <li>• Infringe intellectual property rights</li>
                  <li>• Share malicious software</li>
                  <li>• Engage in money laundering</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Termination */}
        <section id="termination" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">7. Account Termination</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">7.1 Termination by You</h3>
              <p>
                You may close your account at any time through your account settings. Upon termination:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Your personal data will be handled per our Privacy Policy</li>
                <li>Your course progress and certificates will be preserved for 90 days</li>
                <li>Active course enrollments will be retained for completion</li>
                <li>Instructor content may be removed after 30-day notice period</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">7.2 Termination by Sabitek</h3>
              <p className="mb-3">We may suspend or terminate your account if:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You violate these Terms and Conditions</li>
                <li>You engage in fraudulent or illegal activities</li>
                <li>Your account shows signs of unauthorized access</li>
                <li>We are required to do so by law or court order</li>
                <li>Your account has been inactive for more than 2 years</li>
              </ul>
              <p className="mt-4 text-sm bg-yellow-50 p-4 rounded border border-yellow-200">
                We will provide notice before termination except in cases of legal requirement or 
                serious violations.
              </p>
            </div>
          </div>
        </section>

        {/* Section 8: Limitation of Liability */}
        <section id="liability" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">8. Disclaimers and Limitation of Liability</h2>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">8.1 Service "As Is"</h3>
              <p>
                Sabitek is provided "as is" and "as available" without warranties of any kind, either 
                express or implied, including but not limited to warranties of merchantability, fitness 
                for a particular purpose, or non-infringement.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">8.2 No Guarantee of Results</h3>
              <p>
                While we strive to provide high-quality educational content, we do not guarantee:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Specific learning outcomes or career advancement</li>
                <li>Uninterrupted or error-free service</li>
                <li>Accuracy or completeness of user-generated content</li>
                <li>That certificates will be recognized by all institutions</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">8.3 Limitation of Liability</h3>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="font-semibold mb-3">
                  To the fullest extent permitted by law, Sabitek and its affiliates shall not be liable for:
                </p>
                <ul className="text-sm space-y-2">
                  <li>• Indirect, incidental, or consequential damages</li>
                  <li>• Loss of profits, revenue, data, or business opportunities</li>
                  <li>• Damages arising from user-generated content</li>
                  <li>• Third-party actions or content</li>
                  <li>• Unauthorized access to your account</li>
                </ul>
                <p className="text-sm mt-4">
                  <strong>Maximum Liability:</strong> Our total liability shall not exceed the amount 
                  you paid to Sabitek in the 12 months preceding the claim.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Sections */}
        <section className="mb-12 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Dispute Resolution</h2>
            <div className="prose prose-gray max-w-none text-gray-700">
              <p>
                Any disputes arising from these Terms shall be resolved through:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4 mt-3">
                <li>Good faith negotiation between parties</li>
                <li>Mediation if negotiation fails (within 60 days)</li>
                <li>Binding arbitration in Abuja, Nigeria under Nigerian law</li>
              </ol>
              <p className="mt-4">
                <strong>Governing Law:</strong> These Terms are governed by the laws of the Federal 
                Republic of Nigeria.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
            <div className="prose prose-gray max-w-none text-gray-700">
              <p>
                We may update these Terms periodically. Changes will be effective upon posting, with 
                notification for material changes. Continued use of Sabitek after changes constitutes 
                acceptance of the updated Terms.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
            <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
              <p className="font-semibold text-gray-900 mb-4">
                Questions about these Terms? Contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> impact@tekforall.org</p>
                <p><strong>Support:</strong> </p>
                <p><strong>Address:</strong> Tek4All Initiative, Abuja, FCT, Nigeria</p>
                <p><strong>Website:</strong> <Link href="/" className="text-red-600 hover:text-red-700">https://sabitek.app</Link></p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link 
              href="/privacy" 
              className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Read our Privacy Policy
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