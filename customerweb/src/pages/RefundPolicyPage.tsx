import { Card } from '../components';

export default function RefundPolicyPage() {
  return (
    <div className="pt-20 pb-20">
      {/* Hero */}
      <div className="bg-gradient-to-b from-brand-dark to-brand-darker py-20">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold font-serif text-white mb-6 animate-fade-in-down">
            Refund <span className="text-brand-yellow">Policy</span>
          </h1>
          <p className="text-lg text-gray-300 animate-fade-in-up animation-delay-200">
            Our goal is to make sure you are happy with every order at The Cheeze Town.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-10">
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Eligibility for Refunds</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              Refunds or replacements may be considered in the following situations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
              <li>You received the wrong item compared to your order.</li>
              <li>The order was significantly delayed due to an issue on our side.</li>
              <li>There is a valid quality concern with the food delivered to you.</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Non-Refundable Situations</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm leading-relaxed">
              <li>Change of mind after the order has been prepared.</li>
              <li>
                Issues arising from incorrect information provided by the customer (such as wrong table number or
                contact details).
              </li>
              <li>Complaints made several hours after the food has been served or delivered.</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. How to Request a Refund</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              To request a refund or raise a concern, please contact our staff or reach out using the details on
              the Contact page as soon as possible, preferably within the same visit or within a short time after
              your order.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              Our team will review your request and may ask for additional details such as order number, bill copy,
              or photos where applicable.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Refund Method & Timeline</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              If a refund is approved, it will be processed using the original method of payment wherever possible.
              Depending on your bank or payment provider, it may take a few business days for the amount to reflect
              in your account.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Policy Updates</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              We may revise this Refund Policy from time to time. Any updates will be posted on this page. We
              encourage you to review it periodically when placing new orders.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
