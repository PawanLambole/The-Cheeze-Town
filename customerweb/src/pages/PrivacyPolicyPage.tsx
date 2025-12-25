import { Card } from '../components';

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-20 pb-20">
      {/* Hero */}
      <div className="bg-gradient-to-b from-brand-dark to-brand-darker py-20">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold font-serif text-white mb-6 animate-fade-in-down">
            Privacy <span className="text-brand-yellow">Policy</span>
          </h1>
          <p className="text-lg text-gray-300 animate-fade-in-up animation-delay-200">
            We respect your privacy and are committed to protecting your personal information.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-10">
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              We may collect the following types of information when you visit our website or place an order:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
              <li>Contact details such as your name, phone number, and email address.</li>
              <li>Order details including items ordered, table number, and payment amount.</li>
              <li>Basic technical information such as browser type and approximate location.</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
              <li>To process and manage your orders and reservations.</li>
              <li>To communicate with you regarding your order or inquiries.</li>
              <li>To improve our menu, services, and customer experience.</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. Data Security</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              We implement reasonable technical and organizational measures to protect your personal information.
              However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Sharing of Information</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              We do not sell your personal information. We may share information only in the following cases:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
              <li>With trusted service providers who help us operate our systems and process payments.</li>
              <li>When required by law, regulation, or legal process.</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Your Choices</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              If you wish to review, update, or request deletion of your personal information, you can contact us
              using the details provided on the Contact page. We will do our best to respond within a reasonable
              timeframe.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Updates to This Policy</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an
              updated date. We encourage you to review this page periodically.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
