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
    <div className="popup-brand"><span className="brand-mark"><span/><span/><span/></span><b>iterate<span className="brand-period">.</span></b></div>
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