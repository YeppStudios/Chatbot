const AiThinking = () => {
  return (
    <div className="flex items-center">
      <div className="flex ml-1">
        <div>
          <div
            className="h-2 w-2 rounded-full mr-1"
            style={{
              animation: "customBounce 1.2s infinite, colorChange 1.2s infinite",
              animationDelay: "0ms",
              backgroundColor: "rgba(147, 51, 234, 0.6)" // purple-chat/60 initial color
            }}
          />
        </div>
        <div>
          <div
            className="h-2 w-2 rounded-full mr-1"
            style={{
              animation: "customBounce 1.2s infinite, colorChange 1.2s infinite",
              animationDelay: "200ms",
              backgroundColor: "rgba(147, 51, 234, 0.2)" // purple-chat/20 initial color
            }}
          />
        </div>
        <div>
          <div
            className="h-2 w-2 rounded-full"
            style={{
              animation: "customBounce 1.2s infinite, colorChange 1.2s infinite",
              animationDelay: "400ms",
              backgroundColor: "rgba(147, 51, 234, 0.9)" // purple-chat/90 initial color
            }}
          />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes customBounce {
          0%, 100% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(-4px);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        
        @keyframes colorChange {
          0% {
            background-color: rgba(147, 51, 234, 0.3);
          }
          50% {
            background-color: rgba(147, 51, 234, 0.9);
          }
          100% {
            background-color: rgba(147, 51, 234, 0.3);
          }
        }
      `}</style>
    </div>
  );
};

export default AiThinking;