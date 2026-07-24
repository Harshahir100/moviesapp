import React from "react";

const Dmca = () => {
  return (
    <div className="min-h-screen bg-[#111111] text-white px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-400 mb-4">
          VegaFilms » <span className="text-white">DMCA</span>
        </div>

        <div className="border-t border-gray-700 mb-8"></div>

        <h1 className="text-4xl font-bold mb-6">Dmca</h1>

        <div className="space-y-5 text-gray-300 text-[17px] leading-8">
          <p>
            It is our policy to respond to clear notices of alleged copyright
            infringement. If you believe that your intellectual property rights
            have been infringed upon by one of our users, we need you to send us
            a proper notification. All notices should comply with the
            notification requirements of the DMCA. You MUST provide the
            following information.
          </p>

          <div>
            <p className="mb-2">1. Identify yourself as either:</p>
            <p>– The owner of a copyrighted work(s), or</p>
            <p>
              – A person “authorized to act on behalf of the owner of an
              exclusive right that is allegedly infringed.”
            </p>
          </div>

          <p>
            2. Identify the copyrighted work claimed to have been infringed.
          </p>

          <p>
            3. Identify the material that is claimed to be infringing or to be
            the subject of the infringing activity and that is to be removed or
            access to which is to be disabled by providing us the exact location
            of the infringing file with the exact interupload.com link.
          </p>

          <p>
            4. Provide us the web address under which the link has been
            published.
          </p>

          <p>
            5. Provide your contact information which includes, your full name,
            address and telephone number.
          </p>

          <p>
            (For more details on the information required for valid
            notification, see 17 U.S.C. 512(c)(3).)
          </p>

          <p>
            You should be aware that, under the DMCA, claimants who make
            misrepresentations concerning copyright infringement may be liable
            for damages incurred as a result of the removal or blocking of the
            material, court costs, and attorneys fees.
          </p>

          <p>
            A proper notification MUST contain the information above, or it may
            be IGNORED.
          </p>

          <p>
            Send notifications to:{" "}
            <span className="text-red-500 font-semibold cursor-pointer hover:underline">
              Contact US Page
            </span>
          </p>

          <p>
            Please allow 2–3 business days for an email response. Note that
            emailing your complaint to other parties such as our Internet
            Service Provider will not expedite your request and may result in a
            delayed response due the complaint not properly being filed.
          </p>

          <h2 className="text-3xl font-bold text-white mt-8">
            Disclaimer
          </h2>

          <p>
            <span className="font-semibold text-white">VegaFilms</span> does not
            host any files on it's servers. All point to content hosted on third
            party websites. <span className="font-semibold text-white">VegaFilms</span> does not
            accept responsibility for content hosted on third party websites and
            does not have any involvement in the same.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dmca;