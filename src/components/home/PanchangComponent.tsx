import React from "react";

const PanchangComponent = () => {
  return (
    <div className="w-full  mx-auto rounded-2xl p-6 text-white" style={{ backgroundColor: "rgb(30, 33, 35)" }}>
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="border border-cyan-500 rounded-full px-4 py-1 text-cyan-400 text-sm font-medium">
          Panchang
        </div>
      </div>

      {/* Title */}
      <h2 className="text-white text-xl font-medium mb-6">
        Time to watch out for
      </h2>

      {/* Time Bars */}
      <div className="space-y-4 mb-8">
        {/* Auspicious Time Bar */}
        <div className="relative rounded-xl overflow-hidden" style={{backgroundColor: "rgba(92, 196, 92, 0.3)" /* 30% opacity green */}}>
          <div className="flex justify-between items-center px-4 py-2 font-semibold text-green-500">
            <span>Auspicious time</span>
            <span className="text-gray-300 text-sm">20:00 - 21:27</span>
          </div>
        </div>

        {/* Inauspicious Time Bar */}
        <div className="relative rounded-xl overflow-hidden" style={{backgroundColor: "rgba(192, 58, 58, 0.3)" /* 30% opacity red */}}>
          <div className="flex justify-between items-center px-4 py-2 font-semibold text-red-600">
            <span>Inauspicious time</span>
            <span className="text-gray-300 text-sm">21:27 - 22:27</span>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-700 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-300 text-sm mb-1">
              Plan your full day with vedic calender
            </p>
            <div className="flex items-center text-cyan-400 text-sm font-medium cursor-pointer">
              <span>See full panchang</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanchangComponent;
