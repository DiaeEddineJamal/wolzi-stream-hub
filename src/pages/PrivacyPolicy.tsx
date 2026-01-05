import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useSEO } from '@/hooks/useSEO';
import { Shield, Lock, Eye, Globe } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  useSEO({
    title: 'Privacy Policy - WolziFlix | GDPR & CCPA Compliant Privacy Policy',
    description: 'Comprehensive Privacy Policy for WolziFlix. Learn how we collect, use, and protect your data in compliance with GDPR, CCPA, and other privacy laws.',
    keywords: ['privacy policy', 'GDPR', 'data protection', 'CCPA', 'privacy rights'],
    type: 'website'
  });

  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="text-center mb-12">
          <Shield className="h-16 w-16 text-wolzi-accent mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-wolzi-accent">Privacy Policy</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-gray-400 mt-2">
            We are committed to protecting your privacy and complying with GDPR, CCPA, and other applicable privacy laws.
          </p>
        </div>
        
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">1. Introduction and Legal Basis</h2>
            <p className="mb-3">
              Welcome to WolziFlix. We respect your privacy and are committed to protecting your personal data in 
              accordance with applicable data protection laws, including the General Data Protection Regulation (GDPR) 
              in the European Union, the California Consumer Privacy Act (CCPA) in the United States, and other 
              applicable privacy regulations.
            </p>
            <p className="mb-3">
              This Privacy Policy explains how we collect, use, store, and protect your personal information when 
              you visit our website or use our services. It also describes your privacy rights and how you can 
              exercise them.
            </p>
            <p>
              <strong className="text-white">Data Controller:</strong> WolziFlix acts as the data controller for 
              personal data collected through our website. If you have questions about this policy or our data 
              practices, please contact us through our Contact page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">2. Information We Collect</h2>
            <p className="mb-4">
              We collect different types of personal data, which we have organized into the following categories:
            </p>
            
            <div className="space-y-4">
              <div className="bg-black/40 p-4 rounded-lg border border-wolzi-border">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-wolzi-accent" />
                  Identity and Contact Data
                </h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Username or display name (if you create an account)</li>
                  <li>Email address (if you register for an account)</li>
                  <li>Profile information (avatar, preferences) - optional</li>
                </ul>
                <p className="text-xs text-gray-400 mt-2">
                  <strong>Legal Basis (GDPR):</strong> Consent (when you provide it) or legitimate interest (for account management)
                </p>
              </div>

              <div className="bg-black/40 p-4 rounded-lg border border-wolzi-border">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-wolzi-accent" />
                  Technical and Usage Data
                </h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Internet Protocol (IP) address</li>
                  <li>Browser type, version, and language</li>
                  <li>Device information (type, operating system)</li>
                  <li>Time zone and location data (general, not precise)</li>
                  <li>Pages visited and time spent on pages</li>
                  <li>Watch history and preferences (if logged in)</li>
                  <li>Search queries</li>
                </ul>
                <p className="text-xs text-gray-400 mt-2">
                  <strong>Legal Basis (GDPR):</strong> Legitimate interest (website functionality, analytics, security)
                </p>
              </div>

              <div className="bg-black/40 p-4 rounded-lg border border-wolzi-border">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-wolzi-accent" />
                  Cookies and Tracking Technologies
                </h3>
                <p className="text-sm mb-2">
                  We use cookies and similar tracking technologies to enhance your experience. For detailed information, 
                  see our Cookie Policy section below.
                </p>
                <p className="text-xs text-gray-400">
                  <strong>Legal Basis (GDPR):</strong> Consent (for non-essential cookies) or legitimate interest (for essential cookies)
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">3. How We Use Your Data</h2>
            <p className="mb-4">
              We use your personal data only when we have a legal basis to do so. Here's how we use your information:
            </p>
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Service Provision</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>To provide and maintain our website and services</li>
                  <li>To create and manage your account (if you register)</li>
                  <li>To personalize your experience and provide recommendations</li>
                  <li>To track your watch history and preferences (with your consent)</li>
                </ul>
                <p className="text-xs text-gray-400 mt-2">
                  <strong>Legal Basis:</strong> Contract performance, legitimate interest, or consent
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Website Improvement</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>To analyze website usage and improve our services</li>
                  <li>To monitor and prevent technical issues</li>
                  <li>To enhance security and prevent fraud</li>
                </ul>
                <p className="text-xs text-gray-400 mt-2">
                  <strong>Legal Basis:</strong> Legitimate interest (service improvement, security)
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Communication</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>To respond to your inquiries and provide customer support</li>
                  <li>To send important service updates (if applicable)</li>
                </ul>
                <p className="text-xs text-gray-400 mt-2">
                  <strong>Legal Basis:</strong> Legitimate interest (customer support) or consent (marketing communications)
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">4. Legal Basis for Processing (GDPR)</h2>
            <p className="mb-4">
              Under GDPR, we process your personal data based on the following legal bases:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Consent:</strong> When you provide explicit consent (e.g., for cookies, 
                account creation, watch history tracking)
              </li>
              <li>
                <strong className="text-white">Legitimate Interest:</strong> For website functionality, analytics, 
                security, and service improvement
              </li>
              <li>
                <strong className="text-white">Contract Performance:</strong> To provide services you've requested 
                (e.g., account features)
              </li>
              <li>
                <strong className="text-white">Legal Obligation:</strong> To comply with applicable laws and regulations
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">5. Data Sharing and Third Parties</h2>
            <div className="space-y-4">
              <p>
                <strong className="text-white">We Do Not Sell Your Data:</strong> We do not sell, rent, or trade your 
                personal information to third parties for their marketing purposes.
              </p>
              <p>
                <strong className="text-white">Service Providers:</strong> We may share data with trusted service 
                providers who assist us in operating our website, such as:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Hosting and cloud service providers</li>
                <li>Analytics services (anonymized data)</li>
                <li>Customer support tools</li>
              </ul>
              <p className="text-sm text-gray-400 mt-2">
                All service providers are contractually obligated to protect your data and use it only for specified purposes.
              </p>
              <p>
                <strong className="text-white">Legal Requirements:</strong> We may disclose your data if required by law, 
                court order, or government regulation, or to protect our rights, property, or safety.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">6. International Data Transfers</h2>
            <p className="mb-3">
              Your data may be processed and stored in countries outside your country of residence. When we transfer 
              data internationally, we ensure appropriate safeguards are in place, including:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
              <li>Adequacy decisions by the European Commission</li>
              <li>Other legally recognized transfer mechanisms</li>
            </ul>
            <p className="text-sm text-gray-400 mt-3">
              We comply with GDPR requirements for international data transfers to ensure your data is protected 
              regardless of where it is processed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">7. Your Privacy Rights</h2>
            <p className="mb-4">
              Depending on your location, you have the following privacy rights:
            </p>
            
            <div className="space-y-4">
              <div className="bg-black/40 p-4 rounded-lg border border-wolzi-border">
                <h3 className="text-lg font-semibold text-white mb-2">GDPR Rights (EU/EEA Users)</h3>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request deletion of your data</li>
                  <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                  <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                  <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                  <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time (where applicable)</li>
                </ul>
              </div>

              <div className="bg-black/40 p-4 rounded-lg border border-wolzi-border">
                <h3 className="text-lg font-semibold text-white mb-2">CCPA Rights (California Users)</h3>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li><strong>Right to Know:</strong> Know what personal information we collect and how it's used</li>
                  <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
                  <li><strong>Right to Opt-Out:</strong> Opt-out of the sale of personal information (we don't sell data)</li>
                  <li><strong>Right to Non-Discrimination:</strong> We won't discriminate for exercising your rights</li>
                </ul>
              </div>
            </div>

            <p className="mt-4 text-sm">
              To exercise any of these rights, please contact us through our 
              <a href="/contact" className="text-wolzi-accent hover:underline ml-1">Contact page</a>. We will respond 
              to your request within 30 days (or as required by applicable law).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">8. Cookies and Tracking Technologies</h2>
            <div className="space-y-3">
              <p>
                We use cookies and similar technologies to enhance your experience. Cookies are small text files stored 
                on your device. We use the following types:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>
                  <strong className="text-white">Essential Cookies:</strong> Required for website functionality 
                  (cannot be disabled)
                </li>
                <li>
                  <strong className="text-white">Analytics Cookies:</strong> Help us understand how visitors use our 
                  site (you can opt-out)
                </li>
                <li>
                  <strong className="text-white">Preference Cookies:</strong> Remember your settings and preferences 
                  (you can opt-out)
                </li>
              </ul>
              <p className="text-sm">
                You can control cookies through your browser settings. However, disabling certain cookies may affect 
                website functionality. For more information, see your browser's help documentation.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">9. Data Security</h2>
            <p className="mb-3">
              We implement appropriate technical and organizational measures to protect your personal data, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Encryption of data in transit (SSL/TLS)</li>
              <li>Secure server infrastructure</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Data backup and recovery procedures</li>
            </ul>
            <p className="text-sm text-gray-400 mt-3">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your data, 
              we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">10. Data Retention</h2>
            <p className="mb-3">
              We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy, 
              unless a longer retention period is required by law. Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Account Data:</strong> Retained while your account is active, deleted upon account deletion</li>
              <li><strong>Usage Data:</strong> Retained for analytics purposes (typically anonymized after 2 years)</li>
              <li><strong>Technical Data:</strong> Retained for security and legal compliance (as required by law)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">11. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13 years of age (or 16 in the EU). We do not knowingly 
              collect personal information from children. If you are a parent or guardian and believe your child has 
              provided us with personal information, please contact us immediately, and we will delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">12. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites, streaming sources, or services. We are not 
              responsible for the privacy practices of these third parties. We encourage you to read their privacy 
              policies before providing any personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">13. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting 
              the updated policy on this page and updating the "Last updated" date. We encourage you to review this 
              policy periodically.
            </p>
          </section>

          <section className="bg-black/40 border border-wolzi-border rounded-lg p-6 mt-8">
            <h2 className="text-xl font-bold text-white mb-3">Contact Us About Privacy</h2>
            <p className="text-gray-300 mb-3">
              If you have questions, concerns, or wish to exercise your privacy rights, please contact us through our 
              <a href="/contact" className="text-wolzi-accent hover:underline ml-1">Contact page</a>.
            </p>
            <p className="text-gray-300 text-sm">
              For EU users: You also have the right to lodge a complaint with your local data protection authority 
              if you believe we have violated your privacy rights.
            </p>
          </section>

          <section className="text-sm text-gray-400 italic border-t border-gray-700 pt-6">
            <p>
              This Privacy Policy complies with GDPR (EU), CCPA (California), and other applicable privacy laws. 
              We are committed to protecting your privacy and handling your data responsibly.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default PrivacyPolicy;

