import React from "react";
import { Link } from "react-router-dom";
import Contact from "../../pages/ContactUs";

const Footer = () => {
  return (
    <footer className="w-full bg-[#0a0a0a] text-gray-400 font-sans py-8 border-t border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center text-center space-y-4">
        {/* Copyright & Credits Line */}
        <div className="text-sm tracking-wide text-gray-400">
          Copyright © 2026. Created by{" "}
          <span className="text-[#e50914]">❤️</span> vegafilms Team{" "}
          <span className="text-[#e50914]">❤️</span>
        </div>

        {/* Subtle Divider Line */}
        <div className="w-full max-w-3xl border-b border-[#1f1f1f] my-1"></div>

        {/* Navigation Links with Emojis */}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-base font-medium text-white">
          <Link
            to="/ContactUs"
            className="hover:text-red-500 transition-colors flex items-center gap-1.5"
          >
            <span>📮</span> Contact Us
          </Link>
          <span className="text-gray-600">|</span>

          <Link
            to="/request"
            className="hover:text-red-500 transition-colors flex items-center gap-1.5"
          >
            <span>⛽</span> Request Us
          </Link>
          <span className="text-gray-600">|</span>

          <Link
            to="/dmca"
            className="hover:text-red-500 transition-colors flex items-center gap-1.5"
          >
            <span>📔</span> DMCA
          </Link>
          <span className="text-gray-600">|</span>

          <Link
            to="/about"
            className="hover:text-red-500 transition-colors flex items-center gap-1.5"
          >
            <span>🏆</span> About Us
          </Link>
          <span className="text-gray-600">|</span>

          {/* <Link
            to="/sitemap"
            className="hover:text-red-500 transition-colors flex items-center gap-1.5"
          >
            <span>📰</span> Sitemap
          </Link> */}
          {/* <span className="text-gray-600">|</span> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
