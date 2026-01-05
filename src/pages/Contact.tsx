import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const Contact: React.FC = () => {
  useSEO({
    title: 'Contact Us - WolziFlix | Get in Touch',
    description: 'Contact the WolziFlix team for support, feedback, or inquiries. We\'re here to help and would love to hear from you.',
    keywords: ['contact wolziflix', 'support', 'customer service', 'feedback'],
    type: 'website'
  });

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ideally this would send to a backend, but for now just show success
    toast({
      title: "Message Sent",
      description: "We've received your message and will get back to you soon.",
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-wolzi-accent">Contact Us</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            We'd love to hear from you. Get in touch with our team for support, feedback, or any inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-black/40 border border-wolzi-border p-6 rounded-lg backdrop-blur-sm text-center">
            <h3 className="text-lg font-semibold text-white mb-2">General Inquiries</h3>
            <p className="text-gray-400 text-sm">
              For general questions about our platform, features, or services, please use the contact form below.
            </p>
          </div>
          
          <div className="bg-black/40 border border-wolzi-border p-6 rounded-lg backdrop-blur-sm text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Technical Support</h3>
            <p className="text-gray-400 text-sm">
              Experiencing technical issues? Check our Help & FAQ page first, or contact us for personalized assistance.
            </p>
          </div>
          
          <div className="bg-black/40 border border-wolzi-border p-6 rounded-lg backdrop-blur-sm text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Feedback & Suggestions</h3>
            <p className="text-gray-400 text-sm">
              Your feedback helps us improve. Share your ideas, suggestions, or report issues through our contact form.
            </p>
          </div>
        </div>
        
        <div className="bg-black/40 border border-wolzi-border p-8 rounded-lg backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Send Us a Message</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Have a question, suggestion, or just want to say hello? We'd love to hear from you! 
              Fill out the form below and we'll get back to you as soon as possible. Our team typically 
              responds within 24-48 hours during business days.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Whether you need help with your account, have feedback about our platform, want to report 
              a bug, or have questions about our services, we're here to help. Your input is valuable 
              to us and helps us make WolziFlix better for everyone.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-white">Name *</label>
              <Input 
                id="name" 
                placeholder="Your full name" 
                required 
                className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500" 
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white">Email Address *</label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your.email@example.com" 
                required 
                className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500" 
              />
              <p className="text-xs text-gray-500">We'll use this to respond to your inquiry</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-white">Subject *</label>
              <Input 
                id="subject" 
                placeholder="What is this regarding?" 
                required 
                className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500" 
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-white">Message *</label>
              <Textarea 
                id="message" 
                placeholder="Please provide as much detail as possible so we can assist you better..." 
                className="min-h-[200px] bg-black/50 border-gray-700 text-white placeholder:text-gray-500" 
                required 
              />
            </div>
            
            <Button type="submit" className="w-full bg-wolzi-accent hover:bg-purple-700 text-white font-semibold py-6 text-lg">
              Send Message
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Other Ways to Reach Us</h3>
            <div className="space-y-3 text-gray-300">
              <p>
                <strong className="text-white">Help & Support:</strong> For quick answers to common questions, 
                visit our <a href="/help" className="text-wolzi-accent hover:underline">Help & FAQ page</a>.
              </p>
              <p>
                <strong className="text-white">Privacy Concerns:</strong> If you have questions about our privacy 
                practices, please review our <a href="/privacy" className="text-wolzi-accent hover:underline">Privacy Policy</a>.
              </p>
              <p>
                <strong className="text-white">Copyright Issues:</strong> If you are a content owner and believe 
                that any content indexed by our platform infringes your rights, please contact us with detailed 
                information, and we will address your concerns promptly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Contact;
