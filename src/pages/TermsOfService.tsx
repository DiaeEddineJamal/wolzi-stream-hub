import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useSEO } from '@/hooks/useSEO';

const TermsOfService: React.FC = () => {
  useSEO({
    title: 'Terms of Service - WolziFlix',
    description: 'Terms of Service for WolziFlix. Read our rules and regulations.',
    type: 'website'
  });

  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-wolzi-accent">Terms of Service</h1>
        
        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">1. Agreement to Terms</h2>
            <p>
              By accessing our website, you agree to be bound by these Terms of Service and to comply with all applicable laws and regulations. 
              If you do not agree with these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">2. Use License</h2>
            <p>
              Permission is granted to temporarily access the materials (information or software) on WolziFlix's website for personal, 
              non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Modify or copy the materials;</li>
              <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>Attempt to decompile or reverse engineer any software contained on WolziFlix's website;</li>
              <li>Remove any copyright or other proprietary notations from the materials; or</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">3. Disclaimer</h2>
            <p>
              The materials on WolziFlix's website are provided on an 'as is' basis. WolziFlix makes no warranties, expressed or implied, 
              and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, 
              fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">4. Content Liability</h2>
            <p>
              WolziFlix acts as a search engine and aggregator for streaming content. We do not host any files on our servers. 
              All content is provided by non-affiliated third parties. We are not responsible for the content of external sites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">5. Limitations</h2>
            <p>
              In no event shall WolziFlix or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, 
              or due to business interruption) arising out of the use or inability to use the materials on WolziFlix's website.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default TermsOfService;
