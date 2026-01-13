
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const privacyPolicyHTML = `
<p class="mb-6">Last updated: ${new Date().toLocaleDateString()}</p>
<p class="mb-6">VIROS Entrepreneurs ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by VIROS Entrepreneurs.</p>

<h2 class="text-2xl font-bold text-[#06124f] mt-8 mb-4">1. Information We Collect</h2>
<p class="mb-4">We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested (for delivery services), delivery notes, and other information you choose to provide.</p>

<h2 class="text-2xl font-bold text-[#06124f] mt-8 mb-4">2. How We Use Your Information</h2>
<p class="mb-4">We use the information we collect to provide, maintain, and improve our services, such as to:</p>
<ul class="list-disc pl-6 mb-4 space-y-2">
    <li>Process and facilitate payments and operations.</li>
    <li>Send you related information, including confirmations, invoices, technical notices, updates, security alerts, and support and administrative messages.</li>
    <li>Communicate with you about products, services, promotions, news, and events offered by VIROS Entrepreneurs.</li>
    <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities.</li>
</ul>

<h2 class="text-2xl font-bold text-[#06124f] mt-8 mb-4">3. Sharing of Information</h2>
<p class="mb-4">We may share relevant information with third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>

<h2 class="text-2xl font-bold text-[#06124f] mt-8 mb-4">4. Security</h2>
<p class="mb-4">We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration, and destruction.</p>

<h2 class="text-2xl font-bold text-[#06124f] mt-8 mb-4">5. Contact Us</h2>
<p class="mb-4">If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:info@virosentrepreneurs.com" class="text-[#06b6d4] hover:underline">info@virosentrepreneurs.com</a>.</p>
`;

const termsOfServiceHTML = `
<p class="mb-6">Last updated: ${new Date().toLocaleDateString()}</p>
<p class="mb-6">Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the VIROS Entrepreneurs website and services operated by VIROS Entrepreneurs ("us", "we", or "our").</p>

<h2 class="text-2xl font-bold text-[#06124f] mt-8 mb-4">1. Acceptance of Terms</h2>
<p class="mb-4">By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p>

<h2 class="text-2xl font-bold text-[#06124f] mt-8 mb-4">2. Intellectual Property</h2>
<p class="mb-4">The Service and its original content, features, and functionality are and will remain the exclusive property of VIROS Entrepreneurs and its licensors. The Service is protected by copyright, trademark, and other laws of both India and foreign countries.</p>

<h2 class="text-2xl font-bold text-[#06124f] mt-8 mb-4">3. Links To Other Web Sites</h2>
<p class="mb-4">Our Service may contain links to third-party web sites or services that are not owned or controlled by VIROS Entrepreneurs. We has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services.</p>

<h2 class="text-2xl font-bold text-[#06124f] mt-8 mb-4">4. Termination</h2>
<p class="mb-4">We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

<h2 class="text-2xl font-bold text-[#06124f] mt-8 mb-4">5. Limitation of Liability</h2>
<p class="mb-4">In no event shall VIROS Entrepreneurs, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>

<h2 class="text-2xl font-bold text-[#06124f] mt-8 mb-4">6. Changes</h2>
<p class="mb-4">We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.</p>

<h2 class="text-2xl font-bold text-[#06124f] mt-8 mb-4">7. Contact Us</h2>
<p class="mb-4">If you have any questions about these Terms, please contact us at: <a href="mailto:info@virosentrepreneurs.com" class="text-[#06b6d4] hover:underline">info@virosentrepreneurs.com</a>.</p>
`;

async function seedData() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to database.');

        // Update the existing (empty) row or insert if missing
        const [rows] = await connection.execute('SELECT id FROM legal_content LIMIT 1');

        if (rows.length > 0) {
            await connection.execute(
                'UPDATE legal_content SET privacy_policy = ?, terms_of_service = ? WHERE id = ?',
                [privacyPolicyHTML, termsOfServiceHTML, rows[0].id]
            );
            console.log('Updated existing legal content with defaults.');
        } else {
            await connection.execute(
                'INSERT INTO legal_content (privacy_policy, terms_of_service) VALUES (?, ?)',
                [privacyPolicyHTML, termsOfServiceHTML]
            );
            console.log('Inserted default legal content.');
        }

        await connection.end();
        console.log('Done.');
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedData();
