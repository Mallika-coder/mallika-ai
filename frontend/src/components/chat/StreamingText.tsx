"use client";

export function StreamingText({ text }: { text: string }) {
  return (
    <span>
      {text}
      <span className="streaming-cursor" />
    </span>
  );
}
