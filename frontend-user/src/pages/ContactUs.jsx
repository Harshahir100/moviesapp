import React from "react";

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-[#111111] text-white px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-400 mb-4">
          VegaFilms » <span className="text-white">Contact Us</span>
        </div>

        <div className="border-t border-gray-700 mb-8"></div>

        {/* Title */}
        <h1 className="text-4xl font-bold mb-10">Contact Us</h1>

        {/* Contact Image */}
        <img
          src="/images/contact-us.jpg"
          alt="Contact Us"
          className="w-full max-w-xl rounded mb-8"
        />

        <h2 className="text-3xl font-bold mb-5">
          Feel free to contact us
        </h2>

        <p className="text-gray-300 text-lg leading-8 mb-8">
          Please feel free to contact us regarding any need. We look forward to
          hearing from you. Also, you can post a request regarding new movies or
          TV Series. We will be more than happy to post your favorite movies and
          TV series.
        </p>

        <div className="space-y-3 mb-8">
          <p className="text-xl font-semibold">
            Website:
            <a
              href="https://vegafilms.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-500 hover:underline ml-2"
            >
              https://vegafilms.in
            </a>
          </p>

          <p className="text-xl font-semibold">
            Email:
            <span className="text-red-500 ml-2">
              torboxbox2@gmail.com
            </span>
          </p>
        </div>

        <p className="text-gray-300 text-lg leading-8">
          <strong>NOTE:</strong> VegaFilms is a free movie download website
          where we update content on a daily basis. We provide Bollywood,
          Hollywood, South Indian, Dual Audio, Anime, and TV/Web Series in
          multiple qualities.
          <br />
          <br />
          If you find any broken link on our website, feel free to report it.
          Your contribution is highly appreciated. We usually reply within
          24 working hours.
          <br />
          <br />
          Thank you for supporting <strong>VegaFilms</strong>.
        </p>
      </div>
    </div>
  );
};

export default ContactUs;