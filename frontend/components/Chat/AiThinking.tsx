const AiThinking = () => {
  return (
    <div className="flex items-center">
      <div className="flex ml-1 ">
        <div className="animate-pulse">
          <div
            className="h-2 w-2 bg-purple-chat/60 rounded-full mr-1 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
        </div>
        <div className="animate-pulse">
          <div
            className="h-2 w-2 bg-purple-chat/20 rounded-full mr-1 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
        </div>
        <div className="animate-pulse">
          <div
            className="h-2 w-2 bg-purple-chat/90 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
};
export default AiThinking;
