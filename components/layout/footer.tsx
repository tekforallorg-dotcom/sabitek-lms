'use client'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-black mb-3">Sabitek LMS</h3>
            <p className="text-sm text-gray-600">
              Empowering African education through technology
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/courses" className="text-gray-600 hover:text-red-500 cursor-pointer">Courses</a></li>
              <li><a href="/dashboard" className="text-gray-600 hover:text-red-500 cursor-pointer">Dashboard</a></li>
              <li><span className="text-gray-400 cursor-not-allowed">About</span></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-400 cursor-not-allowed">Help Center</span></li>
              <li><a href="https://tekforall.org/contact" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-red-500 cursor-pointer">Contact Us</a></li>
              <li><span className="text-gray-400 cursor-not-allowed">FAQs</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-400 cursor-not-allowed">Privacy Policy</span></li>
              <li><span className="text-gray-400 cursor-not-allowed">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            © 2025 Sabitek LMS by TEK4ALL. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}