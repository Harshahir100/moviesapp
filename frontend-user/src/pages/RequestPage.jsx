import React from "react";

const RequestPage = () => {
  return (
    <div className="min-h-screen bg-[#111111] text-white px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-xs text-gray-400 mb-4">
          vegafilms » <span className="text-white">Movie Request Page</span>
        </div>

        <div className="border-t border-gray-700 mb-8"></div>

        <h1 className="text-4xl font-bold mb-2">Movie Request Page</h1>

        <p className="text-green-400 text-2xl">
          Kindly search on our site before making a request.
        </p>

        <p className="text-red-500 text-2xl font-bold mt-1 mb-5">
          Make Request at Telegram Group !!!
        </p>

        <h2 className="text-2xl font-bold mb-4">#RULES</h2>

        <div className="space-y-3 text-lg text-gray-200">
          <p>1- Don't ask for specific host or size (i will give you the best)</p>
          <p>2- You are free to tell me about the Quality you need</p>
          <p>3- Don't ask for another request before your first request was finished</p>
          <p>4- Don't ask twice for the same request</p>
          <p>5- All requests will processed respectively</p>
          <p>6- Give me IMDB link for movies to make it easy</p>
          <p>7- No more TV Shows in request page</p>
          <p>8- I am not a robot so give me some rest</p>
          <p>9- Please Mention Your request with Quality And Size Its Important</p>
        </div>
      </div>
    </div>
  );
};

export default RequestPage;