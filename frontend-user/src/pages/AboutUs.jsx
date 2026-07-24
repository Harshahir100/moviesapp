import React from "react";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-[#111111] text-white px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-400 mb-4">
          VegaFilms » <span className="text-white">About Us</span>
        </div>

        <div className="border-t border-gray-700 mb-8"></div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-10">
          About Us
        </h1>

        <div className="space-y-5 text-gray-300 text-[17px] leading-8">
          <ul className="list-disc pl-6 space-y-3">
            <li>
              <strong className="text-white">VegaFilms</strong> is the best
              website/platform for downloading Bollywood and Hollywood 720p HD
              movies.
            </li>

            <li>
              We share direct download links without any irritating ads or
              pop-ups.
            </li>

            <li>
              Here we share various file-sharing sites links for one movie in
              many quality like BluRay, HDRip, BRRip, Web-DL etc.
            </li>

            <li className="text-yellow-400 font-bold text-xl">
              VegaFilms – Download Hindi Movies, 300Mb Movies, 480p Movies,
              720p Movies, 1080p Movies.
            </li>

            <li>
              Download dual/multi audio high-quality movies and TV/Web Series
              directly without any popup ads. We are providing English Movies,
              Hollywood Dual Audio Movies, Bollywood Movies, TV/Web Series, TV
              Shows, Anime, and many more.
            </li>
          </ul>

          <div className="pt-3">
            <p className="text-yellow-400 font-bold">
              Our Official Website:
            </p>

            <a
              href="https://vegafilms.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:underline font-semibold"
            >
              https://vegafilms.in/
            </a>
          </div>

          <div>
            <p>
              <span className="text-red-500 font-bold">Disclaimer:</span>{" "}
              All my posts are freely available on the internet and were posted
              by somebody else.
            </p>

            <p>
              I'm NOT violating any copyrighted material. If anything is
              against the law, please notify me at{" "}
              <span className="text-yellow-400 font-semibold">
                torboxbox2@gmail.com
              </span>
            </p>
          </div>

          <ul className="list-disc pl-6">
            <li>
              If you think we shared your content or product without your
              permission, then you can submit a claim using our DMCA Contact
              Form page. We never host any files on our server. All content is
              hosted on third-party websites.
            </li>
          </ul>

          <p>
            <span className="text-red-500 font-bold">Note:</span>{" "}
            <strong>VegaFilms</strong> is a complete independent entity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;