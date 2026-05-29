"use client";

import { useState } from "react";
import type { User } from "firebase/auth";

interface Props {
  user: User;
}

export default function Chat({ user }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [loading, setLoading] = useState(false);

  // ── all original logic untouched ──────────────────────────────────────────
  const sendMessage = async () => {
    console.log("SEND CLICKED", input);
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages(prev => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: trimmed }]
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: full };
          return updated;
        });
      }
    } catch (err) {
      console.error("Error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Error occurred." }]);
    } finally {
      setLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  // Lightweight markdown → HTML (no external deps)
  const renderMarkdown = (text: string): string => {
    return text
      // Code blocks (``` ... ```)
      .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, _lang, code) =>
        `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()}</code></pre>`)
      // Inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // H1–H3
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm,  "<h2>$1</h2>")
      .replace(/^# (.+)$/gm,   "<h1>$1</h1>")
      // Bold + italic  ***text***
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      // Bold  **text**
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // Italic  *text*
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Horizontal rule
      .replace(/^---$/gm, "<hr/>")
      // Unordered list items
      .replace(/^\s*[-•]\s+(.+)$/gm, "<li>$1</li>")
      // Ordered list items
      .replace(/^\s*\d+\.\s+(.+)$/gm, "<li>$1</li>")
      // Wrap consecutive <li> in <ul>
      .replace(/(<li>[\s\S]*?<\/li>)(\n<li>[\s\S]*?<\/li>)*/g, m => `<ul>${m}</ul>`)
      // Paragraphs: blank lines → <br/><br/>
      .replace(/\n{2,}/g, "<br/><br/>")
      // Single newlines → <br/>
      .replace(/\n/g, "<br/>");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .chat-root {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          background: #050508;
          font-family: 'Sora', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Ambient orbs */
        .chat-root::before, .chat-root::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .chat-root::before {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
          top: -80px; left: -80px;
        }
        .chat-root::after {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
          bottom: 60px; right: -60px;
        }

        /* ── Header ── */
        .chat-header {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(12px);
        }
        .chat-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .chat-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; color: white;
          flex-shrink: 0;
          box-shadow: 0 0 12px rgba(99,102,241,0.4);
        }
        .chat-header-title {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          letter-spacing: -0.01em;
        }
        .chat-header-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          font-family: 'JetBrains Mono', monospace;
          margin-top: 1px;
        }
        .status-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px rgba(34,197,94,0.7);
          flex-shrink: 0;
        }

        /* ── Messages area ── */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          z-index: 1;
          scrollbar-width: thin;
          scrollbar-color: rgba(99,102,241,0.3) transparent;
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(99,102,241,0.3);
          border-radius: 4px;
        }

        /* Empty state */
        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          opacity: 0.35;
          pointer-events: none;
        }
        .chat-empty-icon {
          font-size: 36px;
          filter: grayscale(0.4);
        }
        .chat-empty-text {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          font-weight: 300;
          letter-spacing: 0.04em;
        }

        /* Bubble row */
        .bubble-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          animation: bubbleIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .bubble-row.user { flex-direction: row-reverse; }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .bubble-icon {
          width: 26px; height: 26px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600;
        }
        .bubble-icon.ai {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(99,102,241,0.35);
        }
        .bubble-icon.user-icon {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .bubble {
          max-width: 72%;
          padding: 11px 15px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 400;
          word-break: break-word;
        }
        .bubble.user {
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: #fff;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 20px rgba(99,102,241,0.3);
        }
        .bubble.assistant {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.85);
          border: 1px solid rgba(255,255,255,0.08);
          border-bottom-left-radius: 4px;
          backdrop-filter: blur(8px);
        }

        /* Typing dots */
        .typing-dots {
          display: flex; gap: 4px; align-items: center; padding: 4px 0;
        }
        .typing-dots span {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          animation: dot 1.2s infinite ease-in-out;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dot {
          0%,80%,100% { transform: scale(0.7); opacity:0.4; }
          40%          { transform: scale(1);   opacity:1;   }
        }

        /* ── Input bar ── */
        .chat-inputbar {
          position: relative;
          z-index: 10;
          padding: 12px 16px 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(16px);
        }
        .chat-inputwrap {
          display: flex;
          gap: 8px;
          align-items: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 6px 6px 6px 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .chat-inputwrap:focus-within {
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: rgba(255,255,255,0.9);
          font-size: 14px;
          font-family: 'Sora', sans-serif;
          font-weight: 400;
          padding: 8px 0;
          caret-color: #6366f1;
        }
        .chat-input::placeholder { color: rgba(255,255,255,0.25); }

        .send-btn {
          flex-shrink: 0;
          width: 40px; height: 40px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          font-size: 16px;
        }
        .send-btn.active {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          box-shadow: 0 4px 14px rgba(99,102,241,0.4);
        }
        .send-btn.active:hover {
          transform: scale(1.06);
          box-shadow: 0 6px 20px rgba(99,102,241,0.55);
        }
        .send-btn.active:active { transform: scale(0.95); }
        .send-btn.inactive {
          background: rgba(255,255,255,0.06);
          cursor: not-allowed;
        }
        .send-btn svg { pointer-events: none; }

        /* ── Markdown rendering ── */
        .bubble.assistant h1,
        .bubble.assistant h2,
        .bubble.assistant h3 {
          font-family: 'Sora', sans-serif;
          font-weight: 600;
          color: rgba(255,255,255,0.95);
          margin: 10px 0 4px;
          line-height: 1.3;
        }
        .bubble.assistant h1 { font-size: 17px; }
        .bubble.assistant h2 { font-size: 15px; }
        .bubble.assistant h3 { font-size: 14px; color: rgba(255,255,255,0.8); }
        .bubble.assistant strong { color: #fff; font-weight: 600; }
        .bubble.assistant em { color: rgba(255,255,255,0.75); font-style: italic; }
        .bubble.assistant code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          background: rgba(99,102,241,0.2);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 4px;
          padding: 1px 5px;
          color: #a5b4fc;
        }
        .bubble.assistant pre {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 12px 14px;
          overflow-x: auto;
          margin: 8px 0;
        }
        .bubble.assistant pre code {
          background: none;
          border: none;
          padding: 0;
          font-size: 12px;
          color: #e2e8f0;
        }
        .bubble.assistant ul {
          padding-left: 18px;
          margin: 6px 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .bubble.assistant li { list-style: disc; }
        .bubble.assistant hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.1);
          margin: 10px 0;
        }
      `}</style>

      <div className="chat-root">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            <div className="chat-avatar">AI</div>
            <div>
              <div className="chat-header-title">Assistant</div>
              <div className="chat-header-sub">{user.email}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className="status-dot" />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>online</span>
          </div>
        </header>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <div className="chat-empty-text">Start a conversation…</div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`bubble-row ${m.role === "user" ? "user" : ""}`}>
              <div className={`bubble-icon ${m.role === "user" ? "user-icon" : "ai"}`}>
                {m.role === "user" ? "U" : "AI"}
              </div>
              <div className={`bubble ${m.role === "user" ? "user" : "assistant"}`}>
                {m.role === "user"
                  ? (m.content || <div className="typing-dots"><span/><span/><span/></div>)
                  : m.content
                    ? <span dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                    : <div className="typing-dots"><span/><span/><span/></div>
                }
              </div>
            </div>
          ))}
        </div>

        {/* Input bar */}
        <div className="chat-inputbar">
          <div className="chat-inputwrap">
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Type a message…"
            />
            <button
              className={`send-btn ${input.trim() && !loading ? "active" : "inactive"}`}
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              {loading
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9" strokeDasharray="28" strokeDashoffset="0"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></circle></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
