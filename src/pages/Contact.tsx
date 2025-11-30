import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const Contact: React.FC = () => {
  useSEO({
    title: 'Contact Us - WolziFlix',
    description: 'Get in touch with the WolziFlix team.',
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
      <div className="container mx-auto py-12 px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-wolzi-accent">Contact Us</h1>
        
        <div className="bg-black/40 border border-wolzi-border p-6 rounded-lg backdrop-blur-sm">
          <p className="mb-6 text-gray-300">
            Have a question, suggestion, or just want to say hello? We'd love to hear from you!
            Fill out the form below and we'll get back to you as soon as possible.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-white">Name</label>
              <Input id="name" placeholder="Your Name" required className="bg-black/50 border-gray-700" />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white">Email</label>
              <Input id="email" type="email" placeholder="your.email@example.com" required className="bg-black/50 border-gray-700" />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-white">Subject</label>
              <Input id="subject" placeholder="What is this regarding?" required className="bg-black/50 border-gray-700" />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-white">Message</label>
              <Textarea 
                id="message" 
                placeholder="Your message here..." 
                className="min-h-[150px] bg-black/50 border-gray-700" 
                required 
              />
            </div>
            
            <Button type="submit" className="w-full bg-wolzi-accent hover:bg-purple-700 text-white">
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default Contact;
