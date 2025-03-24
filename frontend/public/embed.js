(function () {
    // Create the container for the chatbot
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.zIndex = "1000";
    document.body.appendChild(container);
  
    // Create the iframe
    const iframe = document.createElement("iframe");
    iframe.src = "https://chatbot-yepp.vercel.app/";
    iframe.style.border = "none";
    iframe.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    iframe.style.transition = "all 0.3s ease";
    iframe.style.background = "transparent"; // Transparent background
    iframe.allowTransparency = true; // Ensure transparency is allowed
  
    // Initial collapsed state
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.pointerEvents = "none"; // Allow clicks to pass through when collapsed
    container.appendChild(iframe);
  
    // Create the toggle button (chat icon)
    const toggleButton = document.createElement("button");
    toggleButton.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#6B48FF"/>
        <path d="M12 5C7.03 5 3 9.03 3 14C3 16.76 4.39 19.19 6.5 20.73C6.19 21.55 5.58 22.54 4.86 23.27C4.72 23.41 4.65 23.6 4.67 23.79C4.69 23.98 4.78 24.15 4.93 24.26C5.08 24.37 5.27 24.41 5.45 24.37C5.63 24.33 5.79 24.22 5.89 24.07C7.55 21.87 8.5 20.5 8.5 20.5C9.66 21.16 10.96 21.5 12 21.5C16.97 21.5 21 17.47 21 12.5C21 7.53 16.97 3.5 12 3.5V5Z" fill="white"/>
        <circle cx="9" cy="12" r="1" fill="#6B48FF"/>
        <circle cx="15" cy="12" r="1" fill="#6B48FF"/>
      </svg>
    `;
    toggleButton.style.background = "none";
    toggleButton.style.border = "none";
    toggleButton.style.cursor = "pointer";
    toggleButton.style.position = "absolute";
    toggleButton.style.bottom = "0";
    toggleButton.style.right = "0";
    container.appendChild(toggleButton);
  
    // Create the close button (visible only when expanded)
    const closeButton = document.createElement("button");
    closeButton.innerHTML = "X";
    closeButton.style.position = "absolute";
    closeButton.style.top = "10px";
    closeButton.style.right = "10px";
    closeButton.style.zIndex = "1001";
    closeButton.style.background = "#ff4444";
    closeButton.style.color = "white";
    closeButton.style.border = "none";
    closeButton.style.borderRadius = "50%";
    closeButton.style.width = "25px";
    closeButton.style.height = "25px";
    closeButton.style.cursor = "pointer";
    closeButton.style.display = "none"; // Hidden by default
    container.appendChild(closeButton);
  
    // Toggle state
    let isExpanded = false;
  
    // Function to toggle the chatbot
    function toggleChatbot() {
      if (isExpanded) {
        // Collapse
        iframe.style.width = "0px";
        iframe.style.height = "0px";
        iframe.style.pointerEvents = "none"; // Allow clicks to pass through
        closeButton.style.display = "none";
      } else {
        // Expand
        iframe.style.width = "350px";
        iframe.style.height = "500px";
        iframe.style.pointerEvents = "auto"; // Allow interaction with the iframe
        closeButton.style.display = "block";
      }
      isExpanded = !isExpanded;
    }
  
    // Add event listeners
    toggleButton.onclick = toggleChatbot;
    closeButton.onclick = toggleChatbot;
  })();