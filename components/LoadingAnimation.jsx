"use client";

import React from "react";

export default function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="relative w-24 h-24">
        {/* Outer animated gradient ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-rotate"></div>
        {/* Inner solid circle to create a ring effect */}
        <div className="absolute inset-2 rounded-full bg-white"></div>
      </div>
      <p className="mt-4 text-gray-600 text-xl animate-pulse">
        Loading, please wait...
      </p>
      <style jsx>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-rotate {
          animation: rotate 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
