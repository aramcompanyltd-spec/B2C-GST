

import React, { useState, PropsWithChildren } from 'react';
import AuthScreen from './AuthScreen';

const NavHeader = ({ onSignIn, onSignUp, onGoHome, onNavClick }: { onSignIn: () => void; onSignUp: () => void; onGoHome: () => void, onNavClick: (id: string) => void; }) => (
    <header className="sticky top-0 bg-white/80 backdrop-blur-lg z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-800 cursor-pointer whitespace-nowrap" onClick={onGoHome}>
                NZ GST <span className="text-blue-600">Simple</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
                <button onClick={() => onNavClick('features')} className="text-gray-600 hover:text-blue-600">Features</button>
                <button onClick={() => onNavClick('how-it-works')} className="text-gray-600 hover:text-blue-600">How It Works</button>
                <button onClick={() => onNavClick('faq')} className="text-gray-600 hover:text-blue-600">FAQ</button>
                <button onClick={() => onNavClick('contact')} className="text-gray-600 hover:text-blue-600">Contact</button>
            </nav>
            <div className="flex items-center space-x-2 md:space-x-4">
                <button onClick={onSignIn} className="text-gray-600 font-medium hover:text-blue-600 text-sm md:text-base whitespace-nowrap">Sign In</button>
                <button onClick={onSignUp} className="bg-blue-600 text-white px-3 md:px-5 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors text-sm md:text-base whitespace-nowrap">Sign up</button>
            </div>
        </div>
    </header>
);

const Hero = ({ onSignUp }: { onSignUp: () => void; }) => (
    <section className="relative text-white py-20 md:py-32" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2684&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="relative container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">Simplify Your Complex NZ GST Filing.</h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-8">
                The smartest automated GST calculation solution. Save valuable time by uploading your bank transaction CSV file just once.
            </p>
            <button onClick={onSignUp} className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-transform transform hover:scale-105">
                Get Started Now
            </button>
        </div>
    </section>
);

const HowItWorks = () => {
    const steps = [
        { num: 1, title: 'Upload', description: "Easily upload your bank transaction CSV or Excel files with a simple drag and drop." },
        { num: 2, title: 'Review', description: "NZ GST Simple automatically categorizes all transactions and calculates the GST. Review the results on our intuitive dashboard and make adjustments as needed." },
        { num: 3, title: 'Download', description: "Download your completed GST report as a CSV or Excel file to prepare for your IRD filing. For your privacy, your data is never stored on our servers." }
    ];

    return (
        <section id="how-it-works" className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Prepare Your GST Return in 3 Simple Steps</h2>
                    <p className="text-gray-600 mt-2">Effortless and accurate, from start to finish.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-10 text-center">
                    {steps.map(step => (
                        <div key={step.num} className="bg-white p-8 rounded-lg shadow-md">
                            <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">{step.num}</div>
                            <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                            <p className="text-gray-600">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Features = () => {
    const featuresData = [
        { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, title: "Automatic Bank CSV Analysis", description: "Supports major NZ banks including ASB, BNZ, ANZ, Westpac, and Kiwibank, and automatically recognizes file formats." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>, title: "AI-Powered Auto-Categorization", description: "Intelligent rules instantly classify hundreds of transactions into income, purchase, and expense categories." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>, title: "Convenient Bulk Editing", description: "Select multiple items at once to change categories or GST rates, dramatically reducing manual correction time." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>, title: "Real-Time GST Calculation", description: "The GST amount to pay or be refunded is instantly recalculated and displayed on the dashboard whenever changes are made." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>, title: "Visual Dashboard", description: "Clearly understand your income, purchases, and expense details at a glance with color-coded cards and charts." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, title: "Secure Cloud Management", description: "All data is securely managed on the Google Firebase platform with SSL encryption, and only you can access your information." },
    ];
    return (
        <section id="features" className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Powerful & Smart Features</h2>
                    <p className="text-gray-600 mt-2">Everything you need for a stress-free GST return.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuresData.map(feature => (
                        <div key={feature.title} className="flex items-start space-x-4">
                            <div className="flex-shrink-0 bg-blue-100 text-blue-600 p-3 rounded-full">{feature.icon}</div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FaqItem = ({ q, a }: { q: string, a: string }) => (
    <details className="border-b last:border-b-0 py-4">
        <summary className="font-semibold text-lg cursor-pointer hover:text-blue-600">{q}</summary>
        <p className="mt-2 text-gray-600 leading-relaxed">{a}</p>
    </details>
);


const FAQ = () => (
    <section id="faq" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Frequently Asked Questions</h2>
            </div>
            <div className="max-w-3xl mx-auto">
                <FaqItem
                    q="Is my financial data secure?"
                    a="Your privacy is our top priority. NZ GST Simple processes all files directly in your web browser. We do not upload or store your financial transaction data on our servers. When you close the browser tab, the data is gone. This design ensures the highest level of security and confidentiality."
                />
                 <FaqItem
                    q="What happens to my uploaded files after processing?"
                    a="Files are never uploaded to our servers. All processes—reading files, categorizing transactions, and calculating GST—happen locally within your computer's browser. This means your sensitive financial information never leaves your device, ensuring complete privacy."
                />
                <FaqItem
                    q="What is GST in New Zealand, and who needs to register?"
                    a="GST (Goods and Services Tax) is a 15% tax on most goods and services in New Zealand. Businesses with an annual turnover that exceeds or is expected to exceed $60,000 must register for GST with the IRD. You can also register voluntarily to claim GST back on your business expenses."
                />
                <FaqItem
                    q="How often do I need to file a GST return?"
                    a="The filing frequency (monthly, two-monthly, or six-monthly) depends on your annual turnover. Most small businesses file every two months. If your turnover is less than $500,000, you can opt for a six-monthly cycle. NZ GST Simple makes it easy to generate a report for any period."
                />
                <FaqItem
                    q="Can I correct transactions that are automatically miscategorized?"
                    a="Absolutely. While our system is highly accurate, you can easily correct any classification. Click the 'Edit' button on an individual transaction or use the 'Bulk Edit' feature to change multiple transactions at once."
                />
                <FaqItem
                    q="Why are the GST claim rates different for motor vehicle and entertainment expenses?"
                    a="Under New Zealand tax law, some expenses have limitations on GST claims. For example, entertainment expenses are generally limited to a 50% claim, and specific adjustment rules apply to motor vehicle expenses used for both business and private purposes. Our system automatically applies these standard rates to ensure accuracy."
                />
                <FaqItem
                    q="How accurate is the automatic categorization?"
                    a="Our AI-powered classification engine boasts high accuracy, using sophisticated rules based on common New Zealand business transactions. However, we always recommend reviewing the categorized transactions. Our easy-to-use individual and bulk editing tools make it simple to make any adjustments needed for a perfect GST return."
                />
                <FaqItem
                    q="What if my bank isn't listed or my file format is different?"
                    a="Our system is designed to be flexible and currently supports standard CSV/XLSX formats from all major New Zealand banks. If you encounter an issue with a specific file, please contact our customer support. We are continuously working to improve compatibility and support a wider range of bank formats."
                />
            </div>
        </div>
    </section>
);

// FIX: Used PropsWithChildren to correctly type the component, resolving errors with the children prop.
// FIX: Refactored `LegalPageWrapper` to use a named interface for props to resolve TypeScript error.
interface LegalPageWrapperProps {
    title: string;
    onBack: () => void;
}

const LegalPageWrapper = ({ title, children, onBack }: PropsWithChildren<LegalPageWrapperProps>) => (
    <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
                 <button onClick={onBack} className="mb-8 text-blue-600 hover:underline flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Return to Home
                </button>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-12">{title}</h2>
                <div className="prose max-w-none bg-gray-50 p-8 rounded-lg shadow-md">
                    {children}
                </div>
            </div>
        </div>
    </section>
);

const TermsPage = ({ onBack }: { onBack: () => void }) => (
    <LegalPageWrapper title="Terms and Conditions" onBack={onBack}>
        <h4><strong>Service Overview</strong></h4>
        <p>This service, "NZ GST Simple," provides an automated tool to assist New Zealand businesses in calculating their Goods and Services Tax (GST) returns by processing bank transaction files (CSV/XLSX).</p>
        <h4><strong>User Account</strong></h4>
        <p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account or password. You must ensure that the details you provide us are correct and complete.</p>
        <h4><strong>Payment and Credits</strong></h4>
        <p>The service may be offered under various subscription plans or a credit system. Payment must be made for any subscription plan or credit purchase you make. Due to the nature of digital services, we do not offer refunds on purchases once the service has been utilized.</p>
        <h4><strong>User Responsibilities</strong></h4>
        <p>You are solely responsible for the accuracy and completeness of the data you upload. "NZ GST Simple" is an accounting aid tool and not a substitute for professional tax advice. The final responsibility for the accuracy and submission of GST returns to the IRD lies with the user.</p>
        <h4><strong>Service Limitation and Suspension</strong></h4>
        <p>We may need to suspend the service from time to time for maintenance or other operational reasons. We also reserve the right to suspend or terminate your account if we determine that you have violated these terms.</p>
        <h4><strong>Disclaimer of Liability</strong></h4>
        <p>While we make every effort to ensure the accuracy of the calculations and information provided, "NZ GST Simple" is provided "as is" without any warranty. We are not liable for any financial loss or damages that may arise from the use of our service.</p>
        <h4><strong>Governing Law</strong></h4>
        <p>These terms and conditions are governed by and construed in accordance with the laws of New Zealand.</p>
    </LegalPageWrapper>
);

const PrivacyPage = ({ onBack }: { onBack: () => void }) => (
    <LegalPageWrapper title="Privacy Policy" onBack={onBack}>
        <h4><strong>Information We Collect</strong></h4>
        <ul>
            <li><strong>At Sign-up:</strong> Your name and email address.</li>
            <li><strong>Profile Information (Optional):</strong> Your address and phone number.</li>
            <li><strong>During Service Use:</strong> Transaction data from your uploaded files (we strive to de-identify this data where possible), your IP address, and browser type.</li>
        </ul>
        <h4><strong>Use of Information</strong></h4>
        <p>We use the information collected to provide and improve our service, offer customer support, and for marketing communications (which you can opt out of).</p>
        <h4><strong>Information Sharing</strong></h4>
        <p>We do not share personally identifiable information with third parties except as required by law or with trusted partners who assist us in operating our service, such as Google Firebase. These partners are bound by confidentiality obligations.</p>
        <h4><strong>Data Security</strong></h4>
        <p>We are committed to protecting your data. We leverage the security features of the Google Firebase platform and implement our own access controls to safeguard your information.</p>
        <h4><strong>User Rights</strong></h4>
        <p>Under New Zealand's Privacy Act 2020, you have the right to request access to, correction of, or deletion of your personal information.</p>
        <h4><strong>Cookie Policy</strong></h4>
        <p>We use cookies to operate and administer the site, and to improve your experience on it. A cookie is a piece of information sent to your browser from a website.</p>
        <h4><strong>Contact Information</strong></h4>
        <p>If you have any questions or concerns about your privacy, please contact us at <a href="mailto:contact@gstsimple.co.nz">contact@gstsimple.co.nz</a>.</p>
    </LegalPageWrapper>
);

const AboutPage = ({ onBack }: { onBack: () => void }) => (
    <LegalPageWrapper title="About Us" onBack={onBack}>
        <h4><strong>Our Mission</strong></h4>
        <p>At NZ GST Simple, our mission is to empower small businesses, freelancers, and sole traders across New Zealand by simplifying the complexities of GST compliance. We believe that managing taxes shouldn't be a barrier to success. By providing an intuitive, accurate, and secure tool that saves time and reduces stress, we are dedicated to helping you focus on what you do best: running your business.</p>
        <h4><strong>About the Company</strong></h4>
        <p>We are a passionate team of developers and finance professionals based in New Zealand. Frustrated by the lack of simple, modern tools for GST filing, we decided to build the solution we wanted for ourselves. We combine cutting-edge technology with a deep understanding of the New Zealand tax system to create a product that is both powerful and surprisingly easy to use.</p>
        <h4><strong>Core Values</strong></h4>
        <ul>
            <li><strong>Simplicity:</strong> We design our software to be straightforward and user-friendly. No accounting jargon or complicated setups.</li>
            <li><strong>Accuracy:</strong> Our system is built on the latest New Zealand tax rules to ensure your calculations are reliable.</li>
            <li><strong>Security:</strong> Your financial data is sensitive. We use industry-leading security practices, leveraging Google's secure Firebase platform, to keep your information safe and private.</li>
            <li><strong>Customer-Centric:</strong> We are constantly listening to feedback from users like you to improve our service and add features that matter.</li>
        </ul>
        <h4><strong>Contact Us</strong></h4>
        <p>We are excited to have you on this journey. If you have any questions, feedback, or suggestions, please don't hesitate to reach out. Your input helps us build a better tool for everyone.</p>
    </LegalPageWrapper>
);

const Footer = ({ onShowTerms, onShowPrivacy, onShowAbout }: { onShowTerms: () => void; onShowPrivacy: () => void; onShowAbout: () => void; }) => (
    <footer id="contact" className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8">
                <div>
                    <h3 className="text-lg font-bold mb-2">NZ GST Simple</h3>
                    <p className="text-gray-400">Making GST filing easier.</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Links</h4>
                    <ul className="space-y-2">
                        <li><button onClick={onShowAbout} className="text-gray-400 hover:text-white text-left">About Us</button></li>
                    </ul>
                </div>
                 <div>
                    <h4 className="font-semibold mb-3">Legal</h4>
                    <ul className="space-y-2">
                        <li><button onClick={onShowTerms} className="text-gray-400 hover:text-white text-left">Terms and Conditions</button></li>
                        <li><button onClick={onShowPrivacy} className="text-gray-400 hover:text-white text-left">Privacy Policy</button></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Contact</h4>
                    <ul className="space-y-2 text-gray-400">
                        <li><a href="mailto:info@webpole.co.nz" className="hover:text-white">info@webpole.co.nz</a></li>
                    </ul>
                </div>
            </div>
            <div className="mt-10 pt-8 border-t border-gray-700 text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} NZ GST Simple. All rights reserved.
            </div>
        </div>
    </footer>
);

export default function LandingPage() {
    const [showAuth, setShowAuth] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [activeView, setActiveView] = useState<'main' | 'terms' | 'privacy' | 'about'>('main');

    const openAuth = (loginMode: boolean) => {
        setIsLogin(loginMode);
        setShowAuth(true);
    };

    const handleGoHome = () => {
        setActiveView('main');
        window.scrollTo(0, 0);
    };
    
    const handleShowInfoPage = (view: 'terms' | 'privacy' | 'about') => {
        setActiveView(view);
        window.scrollTo(0, 0);
    };

    const handleNavClick = (targetId: string) => {
        if (activeView !== 'main') {
            setActiveView('main');
            // Wait for the main view to render before scrolling
            setTimeout(() => {
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        } else {
             document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    const renderContent = () => {
        switch (activeView) {
            case 'terms':
                return <TermsPage onBack={handleGoHome} />;
            case 'privacy':
                return <PrivacyPage onBack={handleGoHome} />;
            case 'about':
                return <AboutPage onBack={handleGoHome} />;
            default:
                return (
                    <>
                        <Hero onSignUp={() => openAuth(false)} />
                        <HowItWorks />
                        <Features />
                        <FAQ />
                    </>
                );
        }
    };

    return (
        <div className="bg-white text-gray-800 antialiased">
            {showAuth && <AuthScreen initialIsLogin={isLogin} onClose={() => setShowAuth(false)} />}
            
            <NavHeader 
                onSignIn={() => openAuth(true)} 
                onSignUp={() => openAuth(false)}
                onGoHome={handleGoHome}
                onNavClick={handleNavClick}
            />
            
            <main>
                {renderContent()}
            </main>

            <Footer 
                onShowTerms={() => handleShowInfoPage('terms')} 
                onShowPrivacy={() => handleShowInfoPage('privacy')}
                onShowAbout={() => handleShowInfoPage('about')}
            />
        </div>
    );
}