import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useSEO } from '@/hooks/useSEO';
import { Shield, FileText, Globe, AlertTriangle } from 'lucide-react';

const LegalDisclaimer: React.FC = () => {
  useSEO({
    title: 'Legal Disclaimer - WolziFlix | Terms and Legal Information',
    description: 'Legal disclaimer and terms of use for WolziFlix. Understand our role as a content aggregator and search platform.',
    keywords: ['legal disclaimer', 'terms of use', 'content aggregator', 'DMCA', 'copyright'],
    type: 'website'
  });

  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="text-center mb-12">
          <Shield className="h-16 w-16 text-wolzi-accent mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-wolzi-accent">Legal Disclaimer</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Important legal information about WolziFlix and our services
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300">
          <section className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-yellow-400 mb-2">Important Notice</h2>
                <p className="text-gray-300 leading-relaxed">
                  WolziFlix operates as a search engine and content aggregator. We do not host, store, distribute, 
                  or transmit any video content on our servers. All content is provided by third-party sources that 
                  are not affiliated with WolziFlix. We comply with all applicable laws including the Digital Millennium 
                  Copyright Act (DMCA) in the United States and the EU Copyright Directive.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-white mb-4">1. Nature of Our Service</h2>
            <div className="space-y-4 leading-relaxed">
              <p>
                <strong className="text-white">WolziFlix is a Search Engine and Content Aggregator:</strong> We provide 
                a search and discovery platform that indexes and organizes information about movies, TV shows, and anime 
                content available from various third-party sources across the internet. Similar to how Google Search 
                indexes web pages, we index information about entertainment content.
              </p>
              <p>
                <strong className="text-white">We Do Not Host Content:</strong> WolziFlix does not host, store, or 
                maintain any video files, streaming content, or media files on our servers. We do not operate any 
                streaming servers or content delivery networks. All video content is hosted and served by third-party 
                providers that are completely independent of WolziFlix.
              </p>
              <p>
                <strong className="text-white">We Do Not Control Third-Party Content:</strong> The streaming sources 
                and content providers linked through our platform are operated by independent third parties. We have 
                no control over, and are not responsible for, the content, availability, legality, or terms of service 
                of these third-party websites.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-white mb-4">2. Legal Compliance</h2>
            <div className="space-y-4 leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">United States Law Compliance</h3>
                <p className="mb-3">
                  WolziFlix complies with United States federal laws, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>
                    <strong className="text-white">Digital Millennium Copyright Act (DMCA):</strong> We fully comply 
                    with the DMCA and have established procedures for handling copyright infringement claims. We respond 
                    promptly to valid DMCA takedown notices and remove or disable access to infringing content as required by law.
                  </li>
                  <li>
                    <strong className="text-white">Section 512 Safe Harbor:</strong> As a search engine and information 
                    location tool, we qualify for protection under Section 512(d) of the DMCA, which provides safe harbor 
                    for services that provide links to online locations containing infringing material, provided we meet 
                    certain requirements including implementing a notice-and-takedown procedure.
                  </li>
                  <li>
                    <strong className="text-white">Communications Decency Act (CDA):</strong> As an interactive computer 
                    service, we are protected under Section 230 of the CDA, which provides immunity from liability for 
                    content provided by third parties.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">European Union Law Compliance</h3>
                <p className="mb-3">
                  WolziFlix complies with European Union regulations, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>
                    <strong className="text-white">EU Copyright Directive (Directive 2019/790):</strong> We comply with 
                    EU copyright laws and respect intellectual property rights. We operate as an information society 
                    service provider and follow applicable EU regulations regarding online content.
                  </li>
                  <li>
                    <strong className="text-white">General Data Protection Regulation (GDPR):</strong> We fully comply 
                    with GDPR requirements regarding data protection and privacy. Our Privacy Policy outlines how we 
                    collect, process, and protect user data in accordance with GDPR standards.
                  </li>
                  <li>
                    <strong className="text-white">E-Commerce Directive (2000/31/EC):</strong> As an information 
                    society service, we comply with the E-Commerce Directive, which provides liability exemptions for 
                    intermediary service providers under certain conditions.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-white mb-4">3. Intellectual Property Rights</h2>
            <div className="space-y-4 leading-relaxed">
              <p>
                <strong className="text-white">Respect for Copyright:</strong> WolziFlix respects intellectual property 
                rights and copyright laws. We do not claim ownership of any content indexed or linked through our platform. 
                All trademarks, service marks, and copyrighted material belong to their respective owners.
              </p>
              <p>
                <strong className="text-white">DMCA Compliance:</strong> If you are a copyright owner and believe that 
                content indexed by our platform infringes your rights, you may submit a DMCA takedown notice. We will 
                process valid notices in accordance with DMCA requirements. Please include:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Identification of the copyrighted work claimed to have been infringed</li>
                <li>Identification of the material that is claimed to be infringing</li>
                <li>Your contact information</li>
                <li>A statement of good faith belief that the use is not authorized</li>
                <li>A statement that the information is accurate and you are authorized to act on behalf of the copyright owner</li>
                <li>Your physical or electronic signature</li>
              </ul>
              <p>
                <strong className="text-white">EU Copyright Claims:</strong> For EU-based copyright holders, we accept 
                takedown requests in accordance with EU copyright law. Please contact us through our Contact page with 
                detailed information about the alleged infringement.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-white mb-4">4. User Responsibility</h2>
            <div className="space-y-4 leading-relaxed">
              <p>
                <strong className="text-white">Legal Use Only:</strong> Users are responsible for ensuring that their 
                use of our platform and any linked content complies with applicable laws in their jurisdiction. The 
                legality of accessing certain content may vary by country and region.
              </p>
              <p>
                <strong className="text-white">Copyright Compliance:</strong> Users must respect copyright laws and 
                intellectual property rights. Unauthorized downloading, copying, or distribution of copyrighted content 
                may violate copyright laws and could result in legal consequences.
              </p>
              <p>
                <strong className="text-white">Regional Restrictions:</strong> Some content may be subject to geographic 
                restrictions due to licensing agreements. Users are responsible for complying with any applicable regional 
                restrictions or licensing requirements.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-white mb-4">5. Limitation of Liability</h2>
            <div className="space-y-4 leading-relaxed">
              <p>
                <strong className="text-white">No Warranty:</strong> WolziFlix is provided "as is" without warranties 
                of any kind, either express or implied. We do not guarantee the accuracy, completeness, or availability 
                of any content or information on our platform.
              </p>
              <p>
                <strong className="text-white">Third-Party Content:</strong> We are not responsible for the content, 
                availability, legality, or terms of service of third-party websites or streaming sources. Users access 
                third-party content at their own risk.
              </p>
              <p>
                <strong className="text-white">No Endorsement:</strong> The inclusion of links to third-party websites 
                or content does not constitute an endorsement, recommendation, or approval by WolziFlix. We do not 
                endorse or promote any specific content, service, or provider.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-white mb-4">6. Jurisdiction and Governing Law</h2>
            <div className="space-y-4 leading-relaxed">
              <p>
                <strong className="text-white">Applicable Law:</strong> These terms are governed by applicable laws in 
                the jurisdiction where WolziFlix operates, while also respecting international laws including EU 
                regulations and US federal laws.
              </p>
              <p>
                <strong className="text-white">International Compliance:</strong> We strive to comply with applicable 
                laws in all jurisdictions where our services are accessible, including but not limited to the United States 
                and European Union member states.
              </p>
            </div>
          </section>

          <section className="bg-black/40 border border-wolzi-border rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Contact for Legal Matters</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              For legal inquiries, copyright claims, or DMCA takedown requests, please contact us through our 
              <a href="/contact" className="text-wolzi-accent hover:underline ml-1">Contact page</a>. We respond 
              to all legitimate legal inquiries promptly and in accordance with applicable laws.
            </p>
            <p className="text-gray-300 leading-relaxed">
              For detailed information about our data practices, please review our 
              <a href="/privacy" className="text-wolzi-accent hover:underline ml-1">Privacy Policy</a>. For terms 
              of service, please see our <a href="/terms" className="text-wolzi-accent hover:underline ml-1">Terms of Service</a>.
            </p>
          </section>

          <section className="text-sm text-gray-400 italic border-t border-gray-700 pt-6">
            <p>
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="mt-2">
              This legal disclaimer is subject to change. We recommend reviewing this page periodically for updates.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default LegalDisclaimer;

