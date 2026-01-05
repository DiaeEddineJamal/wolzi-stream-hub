import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useSEO } from '@/hooks/useSEO';
import { HelpCircle, Search, Play, Settings, User, Shield, Download, Share2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Help: React.FC = () => {
  useSEO({
    title: 'Help & FAQ - WolziFlix | Get Support and Answers',
    description: 'Find answers to common questions about WolziFlix. Learn how to use our platform, troubleshoot issues, and get the most out of your streaming experience.',
    keywords: ['wolziflix help', 'faq', 'support', 'how to use wolziflix', 'streaming guide'],
    type: 'website'
  });

  const faqCategories = [
    {
      title: 'Getting Started',
      icon: <Play className="h-5 w-5" />,
      items: [
        {
          question: 'How do I start watching content on WolziFlix?',
          answer: 'Getting started with WolziFlix is simple! Just browse our homepage to discover trending movies, TV shows, and anime. Click on any title to view details, then select a streaming source to begin watching. You can also use our search function to find specific content or browse by category.'
        },
        {
          question: 'Do I need to create an account to watch content?',
          answer: 'No, you can browse and watch content without creating an account. However, creating a free account unlocks additional features like watch history tracking, personalized recommendations, favorites, and the ability to resume watching across devices.'
        },
        {
          question: 'Is WolziFlix free to use?',
          answer: 'Yes, WolziFlix is completely free to use. We provide access to our platform and content discovery features at no cost. Some third-party streaming sources may have their own requirements, but our platform itself is free.'
        },
        {
          question: 'What devices can I use to access WolziFlix?',
          answer: 'WolziFlix is designed to work on all modern devices including desktop computers, laptops, tablets, and smartphones. Our responsive design ensures optimal viewing experience regardless of your device or screen size.'
        }
      ]
    },
    {
      title: 'Content & Streaming',
      icon: <Play className="h-5 w-5" />,
      items: [
        {
          question: 'How do I find specific movies or TV shows?',
          answer: 'Use our powerful search function located in the navigation bar. Simply type the title you\'re looking for, and our system will search through our entire database. You can also browse by category (Movies, TV Series, Anime) or explore trending and popular content sections.'
        },
        {
          question: 'Why is a video not playing or loading slowly?',
          answer: 'If a video isn\'t playing, try selecting a different streaming source from the source selector. Slow loading can be caused by your internet connection speed or high server load. We recommend checking your internet connection and trying again. If issues persist, try a different source or refresh the page.'
        },
        {
          question: 'Can I download content for offline viewing?',
          answer: 'WolziFlix is a streaming platform, and we don\'t provide direct download functionality. However, some content may have download options available through third-party sources. Please note that downloading copyrighted content may be subject to legal restrictions in your region.'
        },
        {
          question: 'How do I change video quality?',
          answer: 'Video quality is typically automatically adjusted based on your internet connection speed. Some streaming sources may offer manual quality selection in their player settings. Look for a settings or quality button in the video player interface.'
        },
        {
          question: 'What should I do if content is not available?',
          answer: 'If specific content isn\'t available, it may be temporarily unavailable from our sources. Try checking back later, as content availability can change. You can also try searching for alternative titles or similar content in the same genre.'
        }
      ]
    },
    {
      title: 'Account & Settings',
      icon: <User className="h-5 w-5" />,
      items: [
        {
          question: 'How do I create an account?',
          answer: 'Click on the "Sign Up" button in the top navigation bar. You can create an account using your email address. The registration process is quick and straightforward, requiring only basic information.'
        },
        {
          question: 'How do I reset my password?',
          answer: 'If you\'ve forgotten your password, click on the "Login" button and look for the "Forgot Password" option. Enter your email address, and we\'ll send you instructions to reset your password.'
        },
        {
          question: 'How do I update my profile information?',
          answer: 'Once logged in, navigate to your Profile page from the user menu. There you can update your username, email, avatar, and other profile settings. Changes are saved automatically.'
        },
        {
          question: 'Can I delete my account?',
          answer: 'Yes, you can delete your account at any time from your Profile settings. Please note that account deletion is permanent and will remove all your data including watch history and preferences.'
        },
        {
          question: 'How do I manage my watch history?',
          answer: 'Your watch history is automatically saved when you\'re logged in. You can view and manage your watch history from the "Watch History" page accessible through your profile menu. You can remove individual items or clear your entire history.'
        }
      ]
    },
    {
      title: 'Technical Support',
      icon: <Settings className="h-5 w-5" />,
      items: [
        {
          question: 'The website is not loading properly. What should I do?',
          answer: 'First, try refreshing the page. If that doesn\'t work, clear your browser cache and cookies, then try again. Make sure you\'re using an updated browser (Chrome, Firefox, Safari, or Edge). If problems persist, try accessing the site from a different browser or device.'
        },
        {
          question: 'Why are ads appearing on the site?',
          answer: 'WolziFlix uses advertising to support the free operation of our platform. These ads help us maintain and improve our services. We work to ensure ads are relevant and non-intrusive. You can use ad-blocking software if you prefer, though this may affect site functionality.'
        },
        {
          question: 'Is my data safe and secure?',
          answer: 'Yes, we take data security seriously. We implement industry-standard security measures to protect your personal information. We never share your data with third parties without your consent, except as outlined in our Privacy Policy. All data transmission is encrypted using SSL/TLS protocols.'
        },
        {
          question: 'What browsers are supported?',
          answer: 'WolziFlix works best with modern browsers including Google Chrome, Mozilla Firefox, Microsoft Edge, and Safari. We recommend using the latest version of your preferred browser for the best experience. Older browsers may have limited functionality.'
        },
        {
          question: 'How do I report a bug or technical issue?',
          answer: 'If you encounter a bug or technical issue, please contact us through our Contact page. Include as much detail as possible about the problem, including your browser, device, and steps to reproduce the issue. This helps us resolve problems more quickly.'
        }
      ]
    },
    {
      title: 'Content & Legal',
      icon: <Shield className="h-5 w-5" />,
      items: [
        {
          question: 'Is the content on WolziFlix legal?',
          answer: 'WolziFlix is a content aggregator and search platform. We do not host any video files on our servers. We provide links to content available from various third-party sources. The legality of accessing content depends on your location and local copyright laws. We encourage users to respect intellectual property rights.'
        },
        {
          question: 'How does WolziFlix handle copyright?',
          answer: 'We respect intellectual property rights and comply with applicable copyright laws. If you are a content owner and believe that any content indexed by our platform infringes your rights, please contact us through our Contact page with details, and we will address your concerns promptly.'
        },
        {
          question: 'Can I request specific content to be added?',
          answer: 'While we don\'t directly control content availability (as we aggregate from third-party sources), we continuously work to improve our content discovery and indexing. If you\'re looking for specific content, try using our search function, as new content is regularly added to our database.'
        },
        {
          question: 'Why is some content region-restricted?',
          answer: 'Content availability can vary by region due to licensing agreements and copyright restrictions. Some streaming sources may implement geographic restrictions. If content isn\'t available in your region, try different sources or check back later, as availability can change.'
        }
      ]
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-wolzi-accent">Help & FAQ</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Find answers to common questions and learn how to get the most out of WolziFlix
          </p>
        </div>

        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-black/40 rounded-lg border border-wolzi-border backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-wolzi-accent">
                  {category.icon}
                </div>
                <h2 className="text-2xl font-bold text-white">{category.title}</h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                {category.items.map((item, itemIndex) => (
                  <AccordionItem 
                    key={itemIndex} 
                    value={`item-${categoryIndex}-${itemIndex}`}
                    className="border-b border-gray-700"
                  >
                    <AccordionTrigger className="text-left text-white hover:text-wolzi-accent py-4">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-300 leading-relaxed pt-2 pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-black/40 rounded-lg border border-wolzi-border backdrop-blur-sm p-8 text-center">
          <HelpCircle className="h-12 w-12 text-wolzi-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our support team is here to help. 
            Get in touch with us through our contact page, and we'll respond as soon as possible.
          </p>
          <a 
            href="/contact" 
            className="inline-block bg-wolzi-accent hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </MainLayout>
  );
};

export default Help;

