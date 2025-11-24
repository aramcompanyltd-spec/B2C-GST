
import React, { useState, PropsWithChildren } from 'react';
import AuthScreen from './AuthScreen';

const NavHeader = ({ onSignIn, onSignUp, onGoHome, onNavClick, onShowFaq }: { onSignIn: () => void; onSignUp: () => void; onGoHome: () => void, onNavClick: (id: string) => void; onShowFaq: () => void; }) => (
    <header className="sticky top-0 bg-white/90 backdrop-blur-lg z-40 shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={onGoHome}>
                 <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="h-8 w-auto object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900">
                    NZ GST <span className="text-blue-600">Simple</span>
                </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8 font-medium">
                <button onClick={() => onNavClick('features')} className="text-gray-600 hover:text-blue-600 transition-colors">Features</button>
                <button onClick={() => onNavClick('how-it-works')} className="text-gray-600 hover:text-blue-600 transition-colors">How It Works</button>
                <button onClick={onShowFaq} className="text-gray-600 hover:text-blue-600 transition-colors">FAQ</button>
                <button onClick={() => onNavClick('contact')} className="text-gray-600 hover:text-blue-600 transition-colors">Contact</button>
            </nav>
            <div className="flex items-center space-x-3 md:space-x-4">
                <button onClick={onSignIn} className="text-gray-600 font-bold hover:text-blue-600 text-sm md:text-base whitespace-nowrap px-3 py-2">Sign In</button>
                <button onClick={onSignUp} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm md:text-base whitespace-nowrap">
                    Sign Up
                </button>
            </div>
        </div>
    </header>
);

const Hero = ({ onSignUp }: { onSignUp: () => void; }) => (
    <section className="relative text-white py-24 md:py-32 overflow-hidden">
         {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2000&auto=format&fit=crop" alt="Accounting Background" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 to-blue-800/80"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-500/30 border border-blue-300/50 text-blue-100 text-sm font-bold mb-6 tracking-wide uppercase">
                New Zealand's Most Private GST Tool
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
                GST Returns, <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">Simplified & Secure.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10 leading-relaxed">
                Process your bank statements instantly in your browser. 
                <strong> Your financial data never leaves your device.</strong> 
                The safest way to categorize transactions and file your IRD return.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <button onClick={onSignUp} className="w-full sm:w-auto bg-white text-blue-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-transform transform hover:scale-105 shadow-lg">
                    Sign Up Now
                </button>
                <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-colors">
                    See How It Works
                </button>
            </div>
            <div className="mt-12 flex justify-center items-center space-x-8 opacity-80 text-sm font-medium">
                <div className="flex items-center"><span className="text-green-400 mr-2">✓</span> Instant Setup</div>
                <div className="flex items-center"><span className="text-green-400 mr-2">✓</span> Local Data Processing</div>
                <div className="flex items-center"><span className="text-green-400 mr-2">✓</span> Supports All NZ Banks</div>
            </div>
        </div>
    </section>
);

const HowItWorks = () => {
    const steps = [
        { num: 1, title: 'Upload Securely', description: "Drag & drop your CSV/XLSX files. Processing happens 100% in your browser for maximum privacy." },
        { num: 2, title: 'Auto-Categorize', description: "Our smart engine automatically sorts transactions into Sales, Expenses, and more based on NZ tax rules." },
        { num: 3, title: 'File with IRD', description: "Instantly see your GST-to-pay or refund. Download a clean CSV report ready for your accountant or Xero." }
    ];

    return (
        <section id="how-it-works" className="py-24 bg-gray-50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">GST Returns in 3 Simple Steps</h2>
                    <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">We've stripped away the complex accounting jargon. Just upload, review, and you're done.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-12">
                    {steps.map(step => (
                        <div key={step.num} className="relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                                {step.num}
                            </div>
                            <h3 className="text-xl font-bold mb-4 mt-6 text-center text-gray-800">{step.title}</h3>
                            <p className="text-gray-600 text-center leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Features = () => {
    const featuresData = [
        { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>, title: "100% Private & Secure", description: "Your bank transaction rows are processed locally on your computer. We don't store your financial history on our servers." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>, title: "Smart Categorization", description: "Don't waste hours manual entry. Our tool recognizes vendors like Bunnings, BP, and Spark to auto-assign GST codes." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, title: "Instant Calculations", description: "The moment you upload, your GST to pay/refund is calculated. See live updates as you make adjustments." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>, title: "Supports All NZ Banks", description: "Compatible with CSV exports from ASB, BNZ, Westpac, ANZ, Kiwibank, and Co-operative Bank." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>, title: "Bulk Editing Power", description: "Need to change 50 'Uber' transactions to Entertainment? Do it in one click with our bulk edit tool." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, title: "Export for Accountant", description: "Download a professional CSV journal of your GST return to send directly to your accountant or import into Xero." },
    ];
    return (
        <section id="features" className="py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why Businesses Trust Us</h2>
                    <p className="text-gray-600 mt-4 text-lg">Built specifically for New Zealand sole traders and small businesses.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                    {featuresData.map(feature => (
                        <div key={feature.title} className="flex flex-col items-start group">
                            <div className="flex-shrink-0 bg-blue-100 text-blue-600 p-4 rounded-xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

interface LegalPageWrapperProps {
    title: string;
    onBack: () => void;
}

const LegalPageWrapper = ({ title, children, onBack }: PropsWithChildren<LegalPageWrapperProps>) => (
    <section className="py-20 bg-white min-h-screen">
        <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
                 <button onClick={onBack} className="mb-8 text-gray-500 hover:text-blue-600 hover:underline flex items-center transition-colors font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Home
                </button>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">{title}</h2>
                <div className="prose prose-lg prose-blue max-w-none bg-white">
                    {children}
                </div>
            </div>
        </div>
    </section>
);

const TermsPage = ({ onBack }: { onBack: () => void }) => (
    <LegalPageWrapper title="Terms and Conditions" onBack={onBack}>
        <h4><strong>1. Service Overview</strong></h4>
        <p>This service, "NZ GST Simple," provides an automated tool to assist New Zealand businesses in calculating their Goods and Services Tax (GST) returns by processing bank transaction files (CSV/XLSX).</p>
        <h4><strong>2. Privacy & Data Security</strong></h4>
        <p>We operate on a "Local Processing" model. Your bank transaction files are processed within your browser session. We do not store your transaction rows on our database. We only store your user profile, account settings, and usage statistics (e.g., number of files processed).</p>
        <h4><strong>3. Accuracy & Liability</strong></h4>
        <p>You are solely responsible for the accuracy and completeness of the data you upload. "NZ GST Simple" is an accounting aid tool and not a substitute for professional tax advice. The final responsibility for the accuracy and submission of GST returns to the IRD lies with the user.</p>
    </LegalPageWrapper>
);

const PrivacyPage = ({ onBack }: { onBack: () => void }) => (
    <LegalPageWrapper title="Privacy Policy" onBack={onBack}>
        <p className="lead">Your privacy is critical to us. This policy outlines how we handle your data with a focus on security and minimization.</p>
        
        <h4><strong>1. What We Collect</strong></h4>
        <ul>
            <li><strong>Account Info:</strong> Name, Email, and Encrypted Password (managed via Google Firebase Auth).</li>
            <li><strong>Usage Data:</strong> We track <em>how many</em> files you upload, but we do not store the <em>content</em> of those files permanently.</li>
        </ul>

        <h4><strong>2. What We DO NOT Collect</strong></h4>
        <ul>
            <li>We do <strong>not</strong> store your bank transaction history on our servers.</li>
            <li>We do <strong>not</strong> sell your data to third parties.</li>
        </ul>

        <h4><strong>3. How Processing Works</strong></h4>
        <p>When you upload a CSV, our code runs inside your web browser to parse and categorize it. The results are shown to you immediately. Once you close your browser tab or log out, that transaction data is cleared from memory.</p>
    </LegalPageWrapper>
);

const AboutPage = ({ onBack }: { onBack: () => void }) => (
    <LegalPageWrapper title="About Us" onBack={onBack}>
        <h4><strong>Our Mission</strong></h4>
        <p>At NZ GST Simple, our mission is to empower small businesses, freelancers, and sole traders across New Zealand by simplifying the complexities of GST compliance.</p>
        <p>We realized that most accounting software is too expensive and too complex for simple sole traders who just want to file their return every 2 or 6 months.</p>
        
        <h4><strong>The "Local-First" Philosophy</strong></h4>
        <p>We built this tool with a security-first mindset. By processing data locally on your device, we eliminate the risk of mass data breaches involving financial history. You keep control of your data.</p>
        
        <h4><strong>Contact Us</strong></h4>
        <p>Questions? Email us at <a href="mailto:nzgstsimple@gmail.com">nzgstsimple@gmail.com</a></p>
    </LegalPageWrapper>
);

const FaqPage = ({ onBack }: { onBack: () => void }) => (
    <LegalPageWrapper title="Help Center & FAQ" onBack={onBack}>
        <div className="space-y-12">
            <section>
                <h3 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-6">1. Getting Started</h3>
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-lg text-blue-700">How do I start using the app?</h4>
                        <p className="text-gray-600 mt-1">Simply click the "Sign Up" button, create an account with your email, and you're ready to go. Once logged in, click "New Task" to start your first GST return.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-blue-700">Can I save my progress and finish later?</h4>
                        <p className="text-gray-600 mt-1">No. To protect your privacy, we <strong>do not save your bank transactions</strong> to our database. The application works in "Session Mode". This means you should upload your files, categorize them, and download your results in one sitting. If you close the browser tab, the transaction data is wiped for security.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-blue-700">Can I manage multiple companies?</h4>
                        <p className="text-gray-600 mt-1">Yes. If you are an Accountant or Bookkeeper, you can request "Agent" status which allows you to save separate client profiles (Name & IRD Number) under one login.</p>
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-6">2. Uploading & Files</h3>
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-lg text-blue-700">Which file formats are supported?</h4>
                        <p className="text-gray-600 mt-1">We currently support <strong>.CSV</strong> (Comma Separated Values) files. Most New Zealand banks (ASB, ANZ, BNZ, Westpac, Kiwibank) allow you to export your transaction history in this format via internet banking.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-blue-700">What columns must be in my CSV file?</h4>
                        <p className="text-gray-600 mt-1">The system looks for standard headers like <code>Date</code>, <code>Amount</code>, and description fields (<code>Payee</code>, <code>Memo</code>, <code>Details</code>). You don't usually need to edit the bank's file; our system is trained to read the default exports from major NZ banks.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-blue-700">Can I upload multiple files at once?</h4>
                        <p className="text-gray-600 mt-1">Yes! You can upload up to 10 files in a single session. This is useful if you have multiple bank accounts (e.g., a Cheque account and a Credit Card) that need to be combined into one GST return.</p>
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-6">3. Categorization & Editing</h3>
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-lg text-blue-700">How does the auto-categorization work?</h4>
                        <p className="text-gray-600 mt-1">We scan the description of each transaction for keywords. For example, "Z Energy" is automatically tagged as "Motor Vehicle Expenses" and "Countdown" as "Purchases".</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-blue-700">What if a transaction is categorized incorrectly?</h4>
                        <p className="text-gray-600 mt-1">You can manually change any category by clicking the Edit (pencil) icon on the transaction row. If you change a category, the system will remember this mapping for future uploads associated with your account.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-blue-700">How do I change categories for many items at once?</h4>
                        <p className="text-gray-600 mt-1">Use the checkboxes on the left side of the transaction table to select multiple items. A "Bulk Action" bar will appear at the top, allowing you to assign a single category to all selected items instantly.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-blue-700">Can I add my own custom account categories?</h4>
                        <p className="text-gray-600 mt-1">Yes. Click the "Account Table" button in the top menu. You can add new expense or income categories, set their GST ratio (e.g., 50% claimable), and assign accounting codes.</p>
                    </div>
                </div>
            </section>
        </div>
    </LegalPageWrapper>
);

const Footer = ({ onShowTerms, onShowPrivacy, onShowAbout, onShowFaq }: { onShowTerms: () => void; onShowPrivacy: () => void; onShowAbout: () => void; onShowFaq: () => void; }) => (
    <footer id="contact" className="bg-gray-900 text-gray-300 py-16 border-t border-gray-800">
        <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-12">
                <div>
                    <h3 className="text-white text-lg font-bold mb-4">NZ GST Simple</h3>
                    <p className="text-sm leading-relaxed">
                        The secure, pay-as-you-go alternative to expensive accounting software. Made with ❤️ in New Zealand.
                    </p>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Company</h4>
                    <ul className="space-y-2 text-sm">
                        <li><button onClick={onShowAbout} className="hover:text-white transition-colors text-left">About Us</button></li>
                        <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors text-left">Features</button></li>
                        <li><button onClick={onShowFaq} className="hover:text-white transition-colors text-left">Help Center & FAQ</button></li>
                    </ul>
                </div>
                 <div>
                    <h4 className="text-white font-semibold mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm">
                        <li><button onClick={onShowTerms} className="hover:text-white transition-colors text-left">Terms and Conditions</button></li>
                        <li><button onClick={onShowPrivacy} className="hover:text-white transition-colors text-left">Privacy Policy</button></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Contact</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="mailto:nzgstsimple@gmail.com" className="hover:text-white transition-colors">nzgstsimple@gmail.com</a></li>
                        <li className="pt-2">022-678-5500</li>
                    </ul>
                </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
                &copy; {new Date().getFullYear()} NZ GST Simple. All rights reserved.
            </div>
        </div>
    </footer>
);

export default function LandingPage() {
    const [showAuth, setShowAuth] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [activeView, setActiveView] = useState<'main' | 'terms' | 'privacy' | 'about' | 'faq'>('main');

    const openAuth = (loginMode: boolean) => {
        setIsLogin(loginMode);
        setShowAuth(true);
    };

    const handleGoHome = () => {
        setActiveView('main');
        window.scrollTo(0, 0);
    };
    
    const handleShowInfoPage = (view: 'terms' | 'privacy' | 'about' | 'faq') => {
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
            case 'faq':
                return <FaqPage onBack={handleGoHome} />;
            default:
                return (
                    <>
                        <Hero onSignUp={() => openAuth(false)} />
                        <HowItWorks />
                        <Features />
                    </>
                );
        }
    };

    return (
        <div className="bg-white text-gray-800 antialiased font-sans">
            {showAuth && <AuthScreen initialIsLogin={isLogin} onClose={() => setShowAuth(false)} />}
            
            <NavHeader 
                onSignIn={() => openAuth(true)} 
                onSignUp={() => openAuth(false)}
                onGoHome={handleGoHome}
                onNavClick={handleNavClick}
                onShowFaq={() => handleShowInfoPage('faq')}
            />
            
            <main className="min-h-screen">
                {renderContent()}
            </main>

            <Footer 
                onShowTerms={() => handleShowInfoPage('terms')} 
                onShowPrivacy={() => handleShowInfoPage('privacy')}
                onShowAbout={() => handleShowInfoPage('about')}
                onShowFaq={() => handleShowInfoPage('faq')}
            />
        </div>
    );
}
