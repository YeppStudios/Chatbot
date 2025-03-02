"use client";

import React, { useLayoutEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

// Speed in ms between characters
const TYPING_SPEED = 20;

function Typewriter({ text }: { text: string }) {
  const [typed, setTyped] = useState("");

  useLayoutEffect(() => {
    let i = 0;
    // Clear typed on re-run
    setTyped("");
    const timer = setInterval(() => {
      i++;
      setTyped(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
      }
    }, TYPING_SPEED);

    return () => clearInterval(timer);
  }, [text]);

  return <ReactMarkdown>{typed}</ReactMarkdown>;
}

export default Typewriter;
