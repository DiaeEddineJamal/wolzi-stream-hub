import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useSEO } from '@/hooks/useSEO';
import { AlertTriangle } from 'lucide-react';

const TermsOfService: React.FC = () => {
  useSEO({
    title: 'Terms of Service - WolziFlix | Legal Terms and Conditions',
    description: 'Read the Terms of Service for WolziFlix. Understand your rights and responsibilities when using our platform.',
    keywords: ['terms of service', 'terms and conditions', 'user agreement', 'legal terms'],
    type: 'website'
  });

  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center text-wolzi-accent">Terms of Service</h1>
        <p className="text-center text-gray-400 mb-12">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-yellow-400 mb-2">Important Legal Notice</h2>
              <p className="text-gray-300 leading-relaxed text-sm">
                WolziFlix is a search engine and content aggregator. We do not host, store, or distribute any video content. 
                All content is provided by third-party sources. We comply with DMCA (US) and EU Copyright Directive. 
                By using our service, you agree to use it legally and in compliance with applicable copyright laws.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">1. Agreement to Terms</h2>
            <p className="mb-3">
              By accessing or using WolziFlix ("the Service"), you agree to be bound by these Terms of Service ("Terms") 
              and to comply with all applicable laws and regulations in your jurisdiction, including but not limited to 
              copyright laws, data protection laws (such as GDPR in the EU), and other intellectual property regulations.
            </p>
            <p>
              If you do not agree with any part of these Terms, you are prohibited from using or accessing this Service. 
              These Terms constitute a legally binding agreement between you and WolziFlix.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">2. Description of Service</h2>
            <div className="space-y-3">
              <p>
                <strong className="text-white">WolziFlix is a Search Engine and Content Aggregator:</strong> We provide 
                a platform that indexes and organizes information about movies, TV shows, and anime content. Similar to 
                how search engines index web pages, we index metadata and information about entertainment content available 
                from various sources across the internet.
              </p>
              <p>
                <strong className="text-white">We Do Not Host Content:</strong> WolziFlix does not host, store, transmit, 
                or distribute any video files, streaming content, or media files on our servers. We do not operate streaming 
                servers or content delivery networks. All video content is hosted and served exclusively by third-party 
                providers that are completely independent of WolziFlix.
              </p>
              <p>
                <strong className="text-white">Third-Party Links:</strong> Our platform may provide links to third-party 
                websites or streaming sources. These links are provided for informational and convenience purposes only. 
                We do not control, endorse, or assume responsibility for the content, availability, legality, or terms of 
                service of these third-party websites.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">3. Use License and Restrictions</h2>
            <p className="mb-3">
              Permission is granted to access and use WolziFlix for personal, non-commercial purposes only. This is a 
              limited, non-exclusive, non-transferable license, not a transfer of title. Under this license, you may:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Access and browse the Service for personal entertainment purposes</li>
              <li>Search for and discover information about movies, TV shows, and anime</li>
              <li>Create an account to use personalized features (if available)</li>
            </ul>
            <p className="mb-3">You may NOT:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Use the Service for any commercial purpose without express written permission</li>
              <li>Modify, copy, reproduce, or create derivative works from our website or content</li>
              <li>Attempt to decompile, reverse engineer, or extract source code from our platform</li>
              <li>Remove any copyright, trademark, or proprietary notices from our materials</li>
              <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Use the Service to violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">4. Legal Compliance and User Responsibility</h2>
            <div className="space-y-3">
              <p>
                <strong className="text-white">Compliance with Laws:</strong> You are solely responsible for ensuring that 
                your use of WolziFlix and any content accessed through our platform complies with all applicable laws in 
                your jurisdiction, including copyright laws, intellectual property laws, and content licensing regulations.
              </p>
              <p>
                <strong className="text-white">Copyright Compliance:</strong> You must respect intellectual property rights 
                and copyright laws. Unauthorized downloading, copying, distribution, or public performance of copyrighted 
                content may violate copyright laws and could result in legal consequences. WolziFlix does not encourage, 
                condone, or facilitate copyright infringement.
              </p>
              <p>
                <strong className="text-white">Regional Restrictions:</strong> Some content may be subject to geographic 
                restrictions or licensing agreements. You are responsible for complying with any applicable regional 
                restrictions, licensing requirements, or terms of service of third-party content providers.
              </p>
              <p>
                <strong className="text-white">Age Restrictions:</strong> You must be at least 13 years old (or the age of 
                majority in your jurisdiction) to use this Service. If you are under 18, you represent that you have 
                obtained parental or guardian consent to use the Service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">5. Intellectual Property and DMCA Compliance</h2>
            <div className="space-y-3">
              <p>
                <strong className="text-white">Our Intellectual Property:</strong> The WolziFlix website, including its 
                design, logos, trademarks, and original content, is the property of WolziFlix and is protected by copyright, 
                trademark, and other intellectual property laws.
              </p>
              <p>
                <strong className="text-white">Third-Party Content:</strong> All movies, TV shows, anime, and other 
                entertainment content indexed by our platform are the property of their respective copyright owners. 
                We do not claim ownership of any such content.
              </p>
              <p>
                <strong className="text-white">DMCA Compliance (United States):</strong> WolziFlix complies with the 
                Digital Millennium Copyright Act (DMCA). If you are a copyright owner and believe that content indexed 
                by our platform infringes your rights, you may submit a DMCA takedown notice. We will process valid 
                notices in accordance with DMCA requirements. For more information, see our Legal Disclaimer page.
              </p>
              <p>
                <strong className="text-white">EU Copyright Compliance:</strong> We comply with EU copyright laws, 
                including the EU Copyright Directive. EU-based copyright holders may submit takedown requests in 
                accordance with applicable EU regulations.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">6. Disclaimer of Warranties</h2>
            <p className="mb-3">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
              INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
              <li>Warranties regarding the accuracy, completeness, or reliability of any information on the Service</li>
              <li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
              <li>Warranties regarding the availability, quality, or legality of third-party content or services</li>
            </ul>
            <p>
              We do not guarantee that the Service will meet your requirements or that any content will be available, 
              accessible, or functional at any given time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">7. Limitation of Liability</h2>
            <div className="space-y-3">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WOLZIFLIX AND ITS AFFILIATES, OFFICERS, DIRECTORS, 
                EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR 
                PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Loss of profits, data, or business opportunities</li>
                <li>Damages arising from your use or inability to use the Service</li>
                <li>Damages arising from content accessed through third-party links</li>
                <li>Damages arising from unauthorized access to or alteration of your data</li>
              </ul>
              <p>
                Our total liability to you for all claims arising from or related to the Service shall not exceed the 
                amount you paid to us (if any) in the twelve months preceding the claim, or $100, whichever is greater.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">8. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless WolziFlix and its affiliates, officers, directors, 
              employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses 
              (including reasonable attorneys' fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any applicable laws or regulations</li>
              <li>Your infringement of any intellectual property or other rights of any third party</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">9. Privacy and Data Protection</h2>
            <p>
              Your use of the Service is also governed by our Privacy Policy, which explains how we collect, use, and 
              protect your information. We comply with applicable data protection laws, including GDPR in the European 
              Union. By using the Service, you consent to our data practices as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">10. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of material changes by posting 
              the updated Terms on this page and updating the "Last updated" date. Your continued use of the Service after 
              such modifications constitutes your acceptance of the updated Terms. If you do not agree to the modified Terms, 
              you must stop using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">11. Termination</h2>
            <p>
              We reserve the right to terminate or suspend your access to the Service, with or without cause or notice, 
              for any reason, including if you violate these Terms. Upon termination, your right to use the Service will 
              immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">12. Governing Law and Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws, while respecting 
              international regulations including EU directives and US federal laws. Any disputes arising from these 
              Terms or your use of the Service shall be resolved in accordance with applicable laws and regulations.
            </p>
          </section>

          <section className="bg-black/40 border border-wolzi-border rounded-lg p-6 mt-8">
            <h2 className="text-xl font-bold text-white mb-3">Contact Information</h2>
            <p className="text-gray-300 mb-3">
              If you have questions about these Terms of Service, please contact us through our 
              <a href="/contact" className="text-wolzi-accent hover:underline ml-1">Contact page</a>.
            </p>
            <p className="text-gray-300">
              For legal matters, copyright claims, or DMCA notices, please refer to our 
              <a href="/legal" className="text-wolzi-accent hover:underline ml-1">Legal Disclaimer</a> page.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default TermsOfService;

