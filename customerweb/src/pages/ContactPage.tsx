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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="pt-20 pb-20">
      <div className="bg-gradient-to-b from-brand-dark to-brand-darker py-20">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold font-serif text-white mb-6 animate-fade-in-down">
            Get In <span className="text-brand-yellow">Touch</span>
          </h1>
          <p className="text-xl text-gray-300 animate-fade-in-up animation-delay-200">
            We love to hear from our customers. Reach out to us anytime!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8 animate-fade-in-up">
              <div>
                <h2 className="text-3xl font-bold font-serif text-white mb-8">Contact Information</h2>
              </div>

              <Card hoverable className="p-8 flex gap-6">
                <div className="bg-brand-yellow/10 rounded-2xl p-4 h-fit border border-brand-yellow/20">
                  <Phone className="w-8 h-8 text-brand-yellow" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">Phone</h3>
                  <p className="text-gray-400 mb-1">Call us for immediate assistance</p>
                  <a href="tel:+919876543210" className="text-brand-yellow font-bold hover:text-yellow-300 transition-colors">
                    +91 98765 43210
                  </a>
                </div>
              </Card>

              <Card hoverable className="p-8 flex gap-6">
                <div className="bg-brand-yellow/10 rounded-2xl p-4 h-fit border border-brand-yellow/20">
                  <Mail className="w-8 h-8 text-brand-yellow" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">Email</h3>
                  <p className="text-gray-400 mb-1">Send us an email anytime</p>
                  <a href="mailto:info@cheezetown.com" className="text-brand-yellow font-bold hover:text-yellow-300 transition-colors">
                    info@cheezetown.com
                  </a>
                </div>
              </Card>

              <Card hoverable className="p-8 flex gap-6">
                <div className="bg-brand-yellow/10 rounded-2xl p-4 h-fit border border-brand-yellow/20">
                  <MapPin className="w-8 h-8 text-brand-yellow" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">Location</h3>
                  <p className="text-gray-400">123 Food Street, Cuisine City, CC 12345</p>
                </div>
              </Card>

              <Card hoverable className="p-8 flex gap-6">
                <div className="bg-brand-yellow/10 rounded-2xl p-4 h-fit border border-brand-yellow/20">
                  <Clock className="w-8 h-8 text-brand-yellow" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">Hours</h3>
                  <div className="space-y-1 text-gray-400">
                    <p>Mon - Fri: 11:00 AM - 10:00 PM</p>
                    <p>Saturday: 10:00 AM - 11:00 PM</p>
                    <p>Sunday: 10:00 AM - 10:00 PM</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="animate-fade-in-up animation-delay-200">
              <Card glowing className="p-8">
                <h2 className="text-3xl font-bold font-serif text-white mb-8">Send us a Message</h2>

                {submitted && (
                  <Alert
                    type="success"
                    title="Message Sent!"
                    message="Thank you for reaching out. We will get back to you soon!"
                    dismissible
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
                  >
                    Send Message
                  </Button>
                </form>
              </Card>
            </div>
          </div>

          <div className="mt-20 animate-fade-in-up animation-delay-400">
            <Card hoverable className="p-0 overflow-hidden">
              <div className="bg-brand-gray/30 h-96 flex items-center justify-center border-b border-white/5">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-brand-yellow mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">📍 123 Food Street, Cuisine City, CC 12345</p>
                  <p className="text-gray-500 text-sm mt-2">Open in Google Maps</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
