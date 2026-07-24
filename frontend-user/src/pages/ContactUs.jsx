import React from 'react';
import { Link } from 'react-router-dom';

const ContactUs = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                        Vegamovies<span className="text-[#e50914]">ContactUs</span>
                    </h1>
                    <div className="flex justify-center items-center gap-2 text-sm text-gray-400">
                        <Link to="/" className="hover:text-[#e50914] transition-colors">Home</Link>
                        <span>»</span>
                        <span className="text-[#e50914]">ContactUs</span>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-[#141414] rounded-lg border border-[#1f1f1f] p-6 md:p-8">
                    {/* Contact Us Title */}
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-6">
                        Contact Us
                    </h2>

                    {/* Description */}
                    <p className="text-gray-300 text-base leading-relaxed mb-6 text-center">
                        Feel free to contact us
                    </p>
                    
                    <p className="text-gray-300 text-base leading-relaxed mb-6">
                        Please feel free to contact us regarding any need. We look forward to hearing from you. Also, you can post a request regarding new movies or TV Series. We will be more than happy to post your favorite movies and TV series.
                    </p>

                    {/* Website URL */}
                    <p className="text-gray-300 text-base leading-relaxed mb-2">
                        <span className="font-semibold">www.</span>
                        <a 
                            href="https://vegafilms.in/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#e50914] hover:underline"
                        >
                            Vegafilms.in
                        </a>
                    </p>

                    {/* Email */}
                    <p className="text-gray-300 text-base leading-relaxed mb-6">
                        <span className="font-semibold">email:</span>{' '}
                        <a 
                            href="mailto:torboxbox2@gmail.com" 
                            className="text-[#e50914] hover:underline"
                        >
                            torboxbox2@gmail.com
                        </a>
                    </p>

                    {/* Note Section */}
                    <div className="mt-6 pt-6 border-t border-[#1f1f1f]">
                        <p className="text-gray-300 text-sm leading-relaxed">
                            <span className="font-bold text-white">NOTE:</span> Vegafilms.in is a free movie download site where we update to cento on a daily basis. We update Bollywood, Hollywood movies and webseries in dual audio full HD quality. Feel free to read the download instruction and follow it. By following you will be able to watch and download the latest movies and webseries. If you find any broken link on our site feel free to report it. Your contribution will be highly appreciated. You can always get back to us via email and call. You will get the appropriate reply to your question within 24 working hours. Don't forget to subscribe for news later services. Also, follow us on all social media platforms.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;