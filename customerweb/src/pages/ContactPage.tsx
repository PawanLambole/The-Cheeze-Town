import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { Card, Input, Button, Alert } from '../components';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Using Web3Forms API (free service)
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: '0111fc32-5045-4d50-91ad-881408cc7193',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: `Contact Form: ${formData.subject}`,
          message: formData.message,
          to: 'pavanlambole578@gmail.com',
          from_name: 'The Cheeze Town Website',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitted(true);
        setTimeout(() => {
          setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
          setSubmitted(false);
        }, 5000);
      } else {
        setError('Failed to send message. Please try again or email us directly.');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError('Failed to send message. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="bg-gradient-to-b from-brand-dark to-brand-darker py-12 md:py-20">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-3xl md:text-7xl font-bold font-serif text-white mb-4 md:mb-6 animate-fade-in-down">
            Get In <span className="text-brand-yellow">Touch</span>
          </h1>
          <p className="text-base md:text-xl text-gray-300 animate-fade-in-up animation-delay-200">
            We love to hear from our customers. Reach out to us anytime!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8 animate-fade-in-up">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-white mb-6 md:mb-8">Contact Information</h2>
              </div>

              <Card hoverable className="p-6 md:p-8 flex gap-4 md:gap-6">
                <div className="bg-brand-yellow/10 rounded-2xl p-3 md:p-4 h-fit border border-brand-yellow/20">
                  <Phone className="w-6 h-6 md:w-8 md:h-8 text-brand-yellow" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">Phone</h3>
                  <p className="text-gray-400 mb-1 text-sm md:text-base">Call us for immediate assistance</p>
                  <a href="tel:+919766573966" className="text-brand-yellow font-bold hover:text-yellow-300 transition-colors text-base md:text-lg">
                    +91 97665 73966
                  </a>
                </div>
              </Card>

              <Card hoverable className="p-6 md:p-8 flex gap-4 md:gap-6">
                <div className="bg-brand-yellow/10 rounded-2xl p-3 md:p-4 h-fit border border-brand-yellow/20">
                  <Mail className="w-6 h-6 md:w-8 md:h-8 text-brand-yellow" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">Email</h3>
                  <p className="text-gray-400 mb-2 text-sm md:text-base">Send us an email anytime</p>
                  <div className="space-y-1">
                    <a href="mailto:thecheesetown@gmail.com" className="text-brand-yellow font-semibold hover:text-yellow-300 transition-colors block text-sm md:text-base">
                      thecheesetown@gmail.com
                    </a>
                    <div className="pt-1">
                      <p className="text-gray-400 text-xs font-medium">Pavan Vitthal Lambole</p>
                      <a href="mailto:pavanlambole578@gmail.com" className="text-brand-yellow/80 font-medium hover:text-yellow-300 transition-colors block text-xs md:text-sm">
                        pavanlambole578@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </Card>

              <Card hoverable className="p-6 md:p-8 flex gap-4 md:gap-6">
                <div className="bg-brand-yellow/10 rounded-2xl p-3 md:p-4 h-fit border border-brand-yellow/20">
                  <MapPin className="w-6 h-6 md:w-8 md:h-8 text-brand-yellow" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">Location</h3>
                  <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                    45, Prashant Nagar, Biladi Road,<br />
                    Near 12 Feet Hanuman Mandir,<br />
                    Deopur, Dhule, Maharashtra
                  </p>
                </div>
              </Card>

              <Card hoverable className="p-6 md:p-8 flex gap-4 md:gap-6">
                <div className="bg-brand-yellow/10 rounded-2xl p-3 md:p-4 h-fit border border-brand-yellow/20">
                  <Clock className="w-6 h-6 md:w-8 md:h-8 text-brand-yellow" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">Hours</h3>
                  <div className="space-y-1 text-gray-400 text-sm md:text-base">
                    <p>Mon - Fri: 11:00 AM - 10:00 PM</p>
                    <p>Saturday: 10:00 AM - 11:00 PM</p>
                    <p>Sunday: 10:00 AM - 10:00 PM</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="animate-fade-in-up animation-delay-200">
              <Card glowing className="p-8">
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-white mb-6 md:mb-8">Send us a Message</h2>

                {submitted && (
                  <Alert
                    type="success"
                    title="Message Sent!"
                    message="Thank you for reaching out. We will get back to you soon!"
                    dismissible
                    className="mb-6"
                  />
                )}

                {error && (
                  <Alert
                    type="error"
                    title="Sending Failed"
                    message={error}
                    dismissible
                    onClose={() => setError(null)}
                    className="mb-6"
                  />
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    label="Full Name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                  />

                  <Input
                    label="Subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What is this about?"
                    required
                  />

                  <div>
                    <label className="block text-gray-300 font-medium mb-2 text-sm">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more..."
                      rows={6}
                      required
                      className="w-full bg-brand-gray/50 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/50 transition-all placeholder-gray-600 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    icon={<Send className="w-5 h-5" />}
                    iconPosition="right"
                    className="shadow-lg shadow-brand-yellow/20"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </Card>
            </div>
          </div>

          <div className="mt-20 animate-fade-in-up animation-delay-400">
            <Card hoverable className="p-0 overflow-hidden h-96">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d119234.33230623235!2d74.7115848!3d20.900995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdec57803a647d3%3A0x6295551984606f71!2sDhule%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1655000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
