'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-black mb-3">Sabitek</h3>
            <p className="text-sm text-gray-600">
             Your AI-powered and future-ready classroom for every learner.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-red-500 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-gray-600 hover:text-red-500 transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-600 hover:text-red-500 transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/support" className="text-gray-600 hover:text-red-500 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <a 
                  href="https://tekforall.org/contact" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-600 hover:text-red-500 transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-red-500 transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/privacy" 
                  className="text-gray-600 hover:text-red-500 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-gray-600 hover:text-red-500 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p className="text-center sm:text-left">
              © 2025 Sabitek by TEK4ALL. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/about" className="hover:text-red-500 transition-colors">
                About
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/privacy" className="hover:text-red-500 transition-colors">
                Privacy
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/terms" className="hover:text-red-500 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}