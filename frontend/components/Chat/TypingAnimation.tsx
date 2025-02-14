import React from "react";

const TypingAnimation = ({ colorful = false }) => {
  return (
    <div className="flex items-center h-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            inline-block w-2 h-2 mx-0.5 last:mr-0 rounded-full
            animate-[bounce_1.5s_infinite_ease-in-out]
            ${
              colorful
                ? "bg-gray-100 hover:bg-gray-800 active:bg-black"
                : "bg-white/60 hover:bg-white/80 active:bg-white/40"
            }
          `}
          style={{
            animationDelay: `${(i + 2) * 100}ms`,
          }}
        />
      ))}
    </div>
  );
};

export default TypingAnimation;
