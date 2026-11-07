import { useEffect, useMemo, useState } from "react";
import { listProjects, removeProject, saveProject, type StoredProject } from "./lib/projectStorage";
import {
  ArrowUpRight, ArrowRight, Bell, Bot, Check, ChevronDown,
  Compass, FileText, FolderKanban, Gauge, ImagePlus, Layers3,
  Menu, MessageSquareText, MoreHorizontal, Plus, Search, Settings2, ShieldCheck,
  Sparkles, WandSparkles, X, Zap
} from "lucide-react";
import ProviderSettingsPanel from "./components/ProviderSettingsPanel";
import "./styles.css";

type Project = StoredProject;

const navItems = [
  { label: "Dashboard", icon: Compass },
  { label: "My projects", icon: FolderKanban },
  { label: "New iteration", icon: WandSparkles },
  { label: "Prompt studio", icon: FileText },
  { label: "AI providers", icon: Bot }
];

function App() {
  const [active, setActive] = useState("Dashboard");
  const [idea, setIdea] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState("");
  const filtered = useMemo(() => projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase())), [projects, search]);

  useEffect(() => {
    let mounted = true;
    listProjects().then(items => { if (mounted) setProjects(items); }).catch(error => {
      if (mounted) setToast(error instanceof Error ? error.message : "Could not load local projects.");
    }).finally(() => { if (mounted) setProjectsLoading(false); });
    return () => { mounted = false; };
  }, []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function beginNewProject() {
    setEditingProject(null);
    setIdea("");
    setShowNew(true);
  }

  function closeProjectModal() {
    setShowNew(false);
    setEditingProject(null);
    setIdea("");
  }

  function openProject(project: Project) {
    setEditingProject(project);
    setIdea(project.initialIdea);
    setShowNew(true);
  }

  async function deleteCurrentProject() {
    if (!editingProject) return;
    if (!window.confirm(`Delete “${editingProject.name}”? This cannot be undone.`)) return;
    try {
      await removeProject(editingProject.id);
      setProjects(current => current.filter(project => project.id !== editingProject.id));
      setEditingProject(null);
      setShowNew(false);
      setIdea("");
      notify("Project deleted from this device.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not delete this project.");
    }
  }

  async function startIteration() {
    if (!idea.trim()) {
      setToast("Add a few words about your idea to get started.");
      window.setTimeout(() => setToast(""), 2600);
      return;
    }
    const now = Date.now();
    const project: Project = editingProject ? {
      ...editingProject,
      name: idea.trim().replace(/\s+/g, " ").slice(0, 48),
      initialIdea: idea.trim(),
      updated: "Just updated",
      updatedAt: now
    } : {
      id: crypto.randomUUID(),
      name: idea.trim().replace(/\s+/g, " ").slice(0, 48),
      kind: "New idea",
      updated: "Just created",
      status: "Draft",
      icon: "✳",
      initialIdea: idea.trim(),
      createdAt: now,
      updatedAt: now
    };
    try {
      await saveProject(project);
      setProjects(current => [project, ...current.filter(item => item.id !== project.id)].sort((a,b) => b.updatedAt - a.updatedAt));
      setIdea("");
      setShowNew(false);
      setEditingProject(null);
      setActive("My projects");
      notify(editingProject ? "Project updated and saved on this device." : "Project created and saved on this device.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save this project. Please try again.");
    }
  }


  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />
      <div className="app-frame">
        <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
          <div className="brand">
            <svg className="brand-symbol" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><defs><linearGradient id="iterate-mark-main" x1="4" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse"><stop stopColor="#F0C4FF"/><stop offset=".48" stopColor="#B66BFF"/><stop offset="1" stopColor="#7840D8"/></linearGradient><linearGradient id="iterate-mark-facet" x1="8" y1="10" x2="22" y2="27" gradientUnits="userSpaceOnUse"><stop stopColor="#E9B7FF"/><stop offset="1" stopColor="#8C4AE4"/></linearGradient></defs><path d="M16 2.5 30 28H2L16 2.5Z" fill="url(#iterate-mark-main)"/><path d="M16 10.2 25.1 27H6.9L16 10.2Z" fill="url(#iterate-mark-facet)" opacity=".88"/><path d="M16 10.2 16 27H6.9L16 10.2Z" fill="#F3D0FF" opacity=".36"/></svg>
            <span className="brand-name"><span className="brand-initial">i</span>terate<span className="brand-period">.</span></span>
            <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={17}/></button>
          </div>
          <div className="workspace-label">WORKSPACE</div>
          <nav className="main-nav">
            {navItems.map(item => {
              const Icon = item.icon;
              return <button key={item.label} className={`nav-item ${active === item.label ? "active" : ""}`} onClick={() => { setActive(item.label); setSidebarOpen(false); }}>
                <Icon size={17} strokeWidth={1.8}/><span>{item.label}</span>{item.label === "New iteration" && <span className="nav-plus"><Plus size={13}/></span>}
              </button>;
            })}
          </nav>
          <div className="sidebar-divider"/>
          <div className="workspace-label project-label">RECENT PROJECTS <button className="tiny-icon" onClick={beginNewProject} aria-label="Create project"><Plus size={14}/></button></div>
          <div className="sidebar-projects">
            {projects.slice(0, 4).map(p => <button key={p.id} className="side-project" onClick={() => { setActive("My projects"); openProject(p); }}><span className="project-glyph">{p.icon}</span><span>{p.name}</span></button>)}
          </div>
          <div className="sidebar-spacer"/>
          <div className="plan-card">
            <div className="plan-orb"><Sparkles size={20}/></div>
            <div className="plan-title">Your ideas, in orbit.</div>
            <p>Everything starts with a thought. Let's make it clearer.</p>
            <button onClick={beginNewProject}>Start creating <ArrowRight size={14}/></button>
          </div>
          <button className="nav-item settings-link" onClick={() => setActive("Settings")}><Settings2 size={17}/><span>Settings</span></button>
          <div className="profile-row">
            <div className="avatar">I</div><div className="profile-copy"><strong>Local workspace</strong><span>Personal account · On device</span></div><MoreHorizontal size={17} className="muted-icon"/>
          </div>
        </aside>

        <main className="main-area">
          <header className="topbar">
            <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={19}/></button>
            <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{active}</strong></div>
            <div className="top-actions">
              <button className="search-trigger" onClick={() => setShowSearch(v => !v)}><Search size={15}/><span>Search projects</span><kbd>⌘ K</kbd></button>
              <button className="icon-button notification-button" aria-label="Notifications"><Bell size={17}/><i/></button>
              <button className="top-avatar">I</button>
            </div>
          </header>

          <div className="page-content">
            {active === "Dashboard" && <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><span className="eyebrow-dot"/> YOUR IDEAS, REFINED</div>
                  <h1>Make room for <span>big ideas.</span></h1>
                  <p className="welcome-subtitle">A little clarity goes a long way. What are we building today?</p>
                </div>
                <button className="primary-button header-cta" onClick={beginNewProject}><Plus size={16}/> New iteration</button>
              </section>

              <section className="hero-compose glass-card">
                <div className="compose-copy">
                  <div className="section-kicker"><Sparkles size={14}/> THE IDEA STARTS HERE</div>
                  <h2>What's on your mind?</h2>
                  <p>Don't worry about getting it perfect. That's what we're here for.</p>
                </div>
                <div className="idea-input-wrap">
                  <textarea value={idea} onChange={e => setIdea(e.target.value)} onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") startIteration(); }} placeholder="I have an idea for..." rows={3}/>
                  <div className="input-bottom">
                    <span><ImagePlus size={14}/> Images can be added in your project</span>
                    <button className="primary-button" onClick={startIteration}>Start iterating <ArrowRight size={15}/></button>
                  </div>
                </div>
                <div className="compose-footnote"><ShieldCheck size={13}/> Your projects stay on this device. AI requests go directly to your chosen provider.</div>
              </section>

              <section className="metrics-grid">
                <Metric icon={<Layers3/>} label="Active projects" value={String(projects.length).padStart(2,"0")} note="Your ideas in progress" tone="violet" />
                <Metric icon={<MessageSquareText/>} label="Ideas captured" value={String(projects.length).padStart(2,"0")} note="Saved on this device" tone="blue"/>
                <Metric icon={<Gauge/>} label="Specifications" value="00" note="Not generated yet" tone="pink"/>
                <Metric icon={<Zap/>} label="Prompt formats" value="07" note="Available output styles" tone="gold"/>
              </section>

              <section className="content-grid">
                <div className="panel glass-card activity-panel">
                  <div className="panel-heading"><div><div className="section-kicker">YOUR WORKSPACE</div><h3>Recent projects</h3></div><button className="text-button" onClick={() => setActive("My projects")}>View all <ArrowRight size={14}/></button></div>
                  <div className="project-list">
                    {projects.slice(0,3).map((p,i) => <ProjectRow key={p.id} project={p} index={i} onOpen={() => openProject(p)}/>)}
                    {!projectsLoading && projects.length===0 && <div className="empty-state compact-empty"><FolderKanban size={22}/><h3>Your first idea starts here</h3><p>Create a project and it will appear here.</p></div>}
                  </div>
                  <button className="new-project-row" onClick={beginNewProject}><span><Plus size={16}/></span> Start with a new idea</button>
                </div>
                <div className="panel glass-card insight-panel">
                  <div className="panel-heading"><div><div className="section-kicker">A BETTER WAY TO THINK</div><h3>How Iterate works</h3></div><div className="mini-spark"><Sparkles size={16}/></div></div>
                  <div className="flow-steps">
                    <FlowStep number="01" title="Bring the rough idea" text="Start anywhere. A sentence is plenty."/>
                    <FlowStep number="02" title="Explore what matters" text="A thoughtful AI interview fills in the gaps."/>
                    <FlowStep number="03" title="Make it actionable" text="Shape a clear spec and prompts you can use."/>
                  </div>
                  <button className="learn-link" onClick={() => setActive("New iteration")}>Explore the workflow <ArrowRight size={14}/></button>
                </div>
              </section>
              <footer className="dashboard-footer"><span>ITERATE <b>·</b> THINK IT THROUGH.</span><span><ShieldCheck size={13}/> Local-first by design</span></footer>
            </>}

            {active === "My projects" && <section className="subpage">
              <div className="page-heading"><div><div className="eyebrow">YOUR WORK, ALL IN ONE PLACE</div><h1>My <span>projects.</span></h1><p>Every idea has a place to grow.</p></div><button className="primary-button" onClick={beginNewProject}><Plus size={16}/> New project</button></div>
              <div className="filter-row"><div className="search-field"><Search size={16}/><input placeholder="Find a project..." value={search} onChange={e => setSearch(e.target.value)}/></div><button className="filter-button">Recently edited <ChevronDown size={14}/></button></div>
              <div className="projects-grid">{filtered.map((p,i)=><ProjectCard key={p.id} project={p} index={i} onOpen={() => openProject(p)}/>)}</div>
              {!projectsLoading && filtered.length===0 && <div className="empty-state"><FolderKanban size={25}/><h3>{search ? "No projects found" : "Your workspace is ready"}</h3><p>{search ? "Try another search or start a new idea." : "Create your first project to give your idea a home."}</p><button className="primary-button" onClick={beginNewProject}><Plus size={15}/> Create your first project</button></div>}
              {projectsLoading && <div className="empty-state"><p>Loading your local projects…</p></div>}
            </section>}

            {active === "New iteration" && <section className="subpage iteration-page">
              <div className="iteration-intro"><div className="eyebrow"><Sparkles size={13}/> YOUR NEXT BIG THING</div><h1>Let's make it <span>real.</span></h1><p>Start with the messy version. We'll figure out the details together.</p></div>
              <div className="iteration-card glass-card">
                <div className="section-kicker">01 / THE STARTING POINT</div><h2>Tell us what you're thinking.</h2><p className="muted-copy">A rough description, a problem you want to solve, or even a half-formed thought.</p>
                <textarea className="large-idea-input" value={idea} onChange={e=>setIdea(e.target.value)} placeholder="I want to create something that..." rows={6}/>
                <div className="iteration-card-bottom"><span><ShieldCheck size={14}/> Saved locally on this device</span><button className="primary-button" onClick={startIteration}>Begin my iteration <ArrowRight size={15}/></button></div>
              </div>
            </section>}

            {active === "Prompt studio" && <section className="subpage"><div className="page-heading"><div><div className="eyebrow">FROM CLEAR THINKING TO CLEAR OUTPUT</div><h1>Prompt <span>studio.</span></h1><p>Your specifications become prompts ready for the next step.</p></div></div><div className="coming-panel glass-card"><div className="coming-icon"><WandSparkles size={24}/></div><h2>Your prompt studio is taking shape.</h2><p>Once a project has a reviewed specification, its main and task-specific prompts will live here.</p></div></section>}

            {active === "AI providers" && <section className="subpage"><div className="page-heading"><div><div className="eyebrow">YOUR AI, YOUR CHOICE</div><h1>AI <span>providers.</span></h1><p>Connect your own API keys. Requests go directly from this extension to your selected provider.</p></div></div><ProviderSettingsPanel/></section>}

            {active === "Settings" && <section className="subpage"><div className="page-heading"><div><div className="eyebrow">MAKE ITERATE YOURS</div><h1>Your <span>settings.</span></h1><p>Local preferences and data controls.</p></div></div><div className="settings-card glass-card"><div className="settings-line"><div><strong>Workspace storage</strong><span>Projects and images are stored in this browser.</span></div><span className="local-pill"><span/> On device</span></div><div className="settings-line"><div><strong>Analytics and telemetry</strong><span>Disabled in v1. No usage tracking.</span></div><span className="local-pill">Off</span></div><div className="settings-line"><div><strong>Provider fallback</strong><span>Iterate will never switch providers automatically.</span></div><span className="local-pill">Manual</span></div><div className="settings-line"><div><strong>Backup and restore</strong><span>Manual JSON project export and import.</span></div><button className="secondary-button" onClick={()=>setToast("Backup tools are being built next.")}>Manage backups</button></div></div></section>}
          </div>
        </main>
      </div>

      {sidebarOpen && <button className="mobile-scrim" onClick={()=>setSidebarOpen(false)} aria-label="Close navigation"/>}
      {showNew && <div className="modal-scrim" onMouseDown={e=>{if(e.target===e.currentTarget)closeProjectModal();}}><div className="new-modal glass-card"><button className="modal-close icon-button" onClick={closeProjectModal}><X size={18}/></button><div className="modal-icon"><Sparkles size={20}/></div><div className="eyebrow">{editingProject ? "YOUR PROJECT" : "A FRESH START"}</div><h2>{editingProject ? "Edit your idea." : "What’s the idea?"}</h2><p>{editingProject ? "Update the starting point for this project." : "It doesn’t need to be polished. Just get it out of your head."}</p><textarea autoFocus value={idea} onChange={e=>setIdea(e.target.value)} placeholder="I want to build, launch, explore..." rows={4}/><div className="modal-actions">{editingProject && <button className="secondary-button danger-button" onClick={deleteCurrentProject}>Delete</button>}<button className="secondary-button" onClick={closeProjectModal}>Cancel</button><button className="primary-button" onClick={startIteration}>{editingProject ? "Save changes" : "Create project"} <ArrowRight size={15}/></button></div></div></div>}
      {showSearch && <div className="modal-scrim search-scrim" onMouseDown={e=>{if(e.target===e.currentTarget)setShowSearch(false);}}><div className="search-modal glass-card"><Search size={18}/><input autoFocus placeholder="Search your projects..." value={search} onChange={e=>setSearch(e.target.value)}/><kbd>ESC</kbd><div className="search-results">{filtered.map(p=><button key={p.id} onClick={()=>{setActive("My projects");setShowSearch(false);}}><span className="project-glyph">{p.icon}</span>{p.name}<ArrowUpRight size={14}/></button>)}{filtered.length===0&&<p>No matching projects.</p>}</div></div></div>}
      {toast && <div className="toast"><Check size={15}/>{toast}</div>}
    </div>
  );
}

function Metric({icon,label,value,note,tone}:{icon:React.ReactNode;label:string;value:string;note:string;tone:string}) {
  return <div className="metric-card glass-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-note">{note}</div><div className={`metric-line ${tone}`}/></div>;
}
function ProjectRow({project,index,onOpen}:{project:Project;index:number;onOpen:()=>void}) {
  return <button className="project-row" onClick={onOpen}><div className={`project-icon project-tone-${index%3}`}>{project.icon}</div><div className="project-details"><strong>{project.name}</strong><span>{project.kind} <i>·</i> {project.updated}</span></div><span className={`status-pill ${project.status==="Prompt ready"?"ready":""}`}>{project.status}</span><ArrowUpRight size={16} className="row-arrow"/></button>;
}
function ProjectCard({project,index,onOpen}:{project:Project;index:number;onOpen:()=>void}) {
  return <button className="project-card glass-card" onClick={onOpen}><div className="project-card-top"><div className={`project-icon project-tone-${index%3}`}>{project.icon}</div><MoreHorizontal size={18}/></div><h3>{project.name}</h3><p>{project.kind}</p><div className="project-card-bottom"><span className="status-pill">{project.status}</span><span>{project.updated}</span></div></button>;
}
function FlowStep({number,title,text}:{number:string;title:string;text:string}) {
  return <div className="flow-step"><span className="flow-number">{number}</span><div><strong>{title}</strong><p>{text}</p></div><Check size={14} className="flow-check"/></div>;
}
export default App;
