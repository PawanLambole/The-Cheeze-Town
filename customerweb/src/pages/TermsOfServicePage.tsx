import { Card } from '../components';

export default function TermsOfServicePage() {
  return (
    <div className="pt-20 pb-20">
      {/* Hero */}
      <div className="bg-gradient-to-b from-brand-dark to-brand-darker py-20">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold font-serif text-white mb-6 animate-fade-in-down">
            Terms of <span className="text-brand-yellow">Service</span>
          </h1>
          <p className="text-lg text-gray-300 animate-fade-in-up animation-delay-200">
            Please read these terms carefully before using The Cheeze Town services.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-10">
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              By accessing or using The Cheeze Town website, placing an order, or visiting our restaurant, you
              agree to be bound by these Terms of Service. If you do not agree with any part of these terms,
              please do not use our services.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Orders & Payments</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
              <li>All prices displayed are inclusive/exclusive of taxes as mentioned on the bill.</li>
              <li>Orders are confirmed only after successful payment or acknowledgement by our staff.</li>
              <li>
                We reserve the right to refuse or cancel any order in case of incorrect pricing, unavailability,
                or suspicious activity.
              </li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. Usage of the Website</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
              <li>You agree not to misuse the website, interfere with its security, or attempt unauthorized access.</li>
              <li>
                You are responsible for ensuring that the information you provide (such as contact details) is
                accurate and up to date.
              </li>
              <li>The content, images, and branding on this site are the property of The Cheeze Town.</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Cancellations & Refunds</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Cancellations and refunds are handled as per our Refund Policy. Please review the Refund Policy page
              for detailed information on eligibility and timelines.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Changes to These Terms</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              We may update these Terms of Service from time to time. Any changes will be effective when posted on
              this page. Continued use of our services after changes indicates your acceptance of the revised terms.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
