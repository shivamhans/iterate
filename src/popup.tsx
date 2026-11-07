import React from "react";
import ReactDOM from "react-dom/client";
import { ArrowUpRight, Sparkles } from "lucide-react";
import "./styles.css";

function Popup() {
  const [idea, setIdea] = React.useState("");
  const openWorkspace = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
    }
  };
  return <main className="popup-shell">
    <div className="popup-glow"/>
    <div className="popup-brand"><svg className="brand-symbol" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><defs><linearGradient id="iterate-mark-main" x1="4" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse"><stop stopColor="#F0C4FF"/><stop offset=".48" stopColor="#B66BFF"/><stop offset="1" stopColor="#7840D8"/></linearGradient><linearGradient id="iterate-mark-facet" x1="8" y1="10" x2="22" y2="27" gradientUnits="userSpaceOnUse"><stop stopColor="#E9B7FF"/><stop offset="1" stopColor="#8C4AE4"/></linearGradient></defs><path d="M16 2.5 30 28H2L16 2.5Z" fill="url(#iterate-mark-main)"/><path d="M16 10.2 25.1 27H6.9L16 10.2Z" fill="url(#iterate-mark-facet)" opacity=".88"/><path d="M16 10.2 16 27H6.9L16 10.2Z" fill="#F3D0FF" opacity=".36"/></svg><b><span className="brand-initial">i</span>terate<span className="brand-period">.</span></b></div>
    <div className="eyebrow"><Sparkles size={12}/> A LITTLE CLARITY GOES A LONG WAY</div>
    <h1>What's your <span>big idea?</span></h1>
    <p>Start rough. We'll help you find the shape of it.</p>
    <textarea rows={4} value={idea} onChange={e=>setIdea(e.target.value)} placeholder="I want to create..."/>
    <button className="primary-button popup-start" onClick={openWorkspace}>Open workspace <ArrowUpRight size={15}/></button>
    <button className="popup-open" onClick={openWorkspace}>View your projects <ArrowUpRight size={13}/></button>
    <div className="popup-privacy">Your projects stay on this device.</div>
  </main>;
}
const root=document.getElementById("popup-root");
if(!root) throw new Error("Missing popup root");
ReactDOM.createRoot(root).render(<React.StrictMode><Popup/></React.StrictMode>);