import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SegmentedControl from '../components/SegmentedControl';
import Breadcrumb from '../components/Breadcrumb';
import {
  HelpCircle,
  BookOpen,
  Layers,
  Award,
  AlertTriangle,
  Flame,
  Shield,
  ShieldAlert,
  Terminal,
  Zap,
  Users,
  Search,
  CheckCircle2,
  FileText,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function AboutPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('story');
  const [activeFeature, setActiveFeature] = useState('fire');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const features = ['fire', 'jata', 'circle', 'q'];
    const interval = setInterval(() => {
      setActiveFeature((prev) => {
        const currentIndex = features.indexOf(prev);
        const nextIndex = (currentIndex + 1) % features.length;
        return features[nextIndex];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const tabOptions = [
    { value: 'story', label: 'Sage Pippalāda & Origins' },
    { value: 'symbolism', label: 'Logo Symbolism' },
    { value: 'features', label: 'Platform Features' },
    { value: 'economy', label: 'Reputation Economy' },
  ];

  return (
    <div className="page-container max-w-4xl">
      <Breadcrumb items={[{ label: 'About' }]} />

      {/* Hero Header */}
      <div className="text-center mb-8 relative">
        <div className="blob-accent w-64 h-64 -top-10 left-1/2 -translate-x-1/2 opacity-10" />
        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto mb-4 animate-float">
            <img
              src="/PippaQ1.webp"
              alt="PippaQ Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(99,102,241,0.25)]"
            />
          </div>
          <h1 className="font-brand text-4xl font-extrabold tracking-tight">
            About <span className="text-gradient">PippaQ</span>
          </h1>
          <p className="text-muted text-sm mt-2 max-w-md mx-auto">
            The fusion of ancient sage wisdom, structured verification, and modern AI intelligence.
          </p>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex justify-center mb-8">
        <SegmentedControl
          options={tabOptions}
          value={activeTab}
          onChange={setActiveTab}
          className="w-full max-w-2xl"
        />
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {activeTab === 'story' && (
          <div className="card shadow-premium p-6 sm:p-8 space-y-6 bg-white/80 backdrop-blur-sm animate-scaleIn">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-primary">🧠 PippaQ — The Wisdom of Sage Pippalāda</h2>
            </div>
            
            <p className="text-sm text-primary leading-relaxed">
              <strong>PippaQ</strong> is inspired by the ancient <strong>Sage Pippalāda</strong>, a legendary philosopher and scholar in Indian history. He is a symbol of deep wisdom, clarity, and the ultimate ability to answer profound questions about existence, knowledge, and truth.
            </p>

            <blockquote className="border-l-4 border-accent pl-4 py-1.5 bg-accent-50/20 rounded-r-lg italic text-sm text-slate-700">
              "Just like Sage Pippalāda guided seekers with precise answers to complex questions, PippaQ is a modern AI-powered FAQ and Query Resolution system designed to structure, validate, and sustain community knowledge."
            </blockquote>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-border/50 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Answer Intelligently</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Leverages state-of-the-art semantic searches to resolve user queries with pre-approved knowledge.
                </p>
              </div>
              
              <div className="p-4 rounded-xl border border-border/50 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Validate Logic</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Applies structured, hierarchical validation flows from peers, moderators, and admins.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/50 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                  <Search className="w-3.5 h-3.5" />
                  <span>Filter Duplicates</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Uses RAG decision systems to keep the database tidy and penalize redundant submissions.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/50 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Evolving Knowledge</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Promotes highly upvoted real-time queries into permanent structured FAQ articles.
                </p>
              </div>
            </div>

            <div className="pt-4 text-center border-t border-border/40 text-xs font-bold text-slate-500">
              👉 PippaQ represents the perfect fusion of ancient wisdom and modern AI-driven FAQ systems.
            </div>
          </div>
        )}

        {activeTab === 'symbolism' && (
          <div className="card shadow-premium p-6 sm:p-8 bg-white/80 backdrop-blur-sm animate-scaleIn space-y-6">
            <style>{`
              @keyframes flowDash {
                to {
                  stroke-dashoffset: -20;
                }
              }
              @keyframes flameFlicker {
                0%, 100% {
                  opacity: 0.25;
                  transform: scale(1) translate(0, 0);
                  filter: blur(8px) brightness(1);
                }
                33% {
                  opacity: 0.55;
                  transform: scale(1.1) translate(-1px, -2px);
                  filter: blur(10px) brightness(1.2);
                }
                66% {
                  opacity: 0.4;
                  transform: scale(0.95) translate(1px, -1px);
                  filter: blur(7px) brightness(0.95);
                }
              }
              @keyframes jataFlow {
                0%, 100% {
                  opacity: 0.2;
                  transform: translateY(-4px) scaleY(0.95);
                  filter: blur(8px);
                }
                50% {
                  opacity: 0.55;
                  transform: translateY(4px) scaleY(1.05);
                  filter: blur(10px);
                }
              }
              .animate-flow-dash {
                stroke-dasharray: 6, 4;
                animation: flowDash 1.2s linear infinite;
              }
              @keyframes hotspotPulseBlue {
                0% {
                  transform: scale(0.6);
                  opacity: 0.9;
                }
                100% {
                  transform: scale(2.2);
                  opacity: 0;
                }
              }
              @keyframes hotspotPulseGreen {
                0% {
                  transform: scale(0.6);
                  opacity: 0.9;
                }
                100% {
                  transform: scale(2.2);
                  opacity: 0;
                }
              }
              @keyframes hotspotPulseOrange {
                0% {
                  transform: scale(0.6);
                  opacity: 0.9;
                }
                100% {
                  transform: scale(2.2);
                  opacity: 0;
                }
              }
              @keyframes releaseBlue {
                0% {
                  transform: translate(0, 0) scale(0.5);
                  opacity: 0.8;
                }
                100% {
                  transform: translate(-180px, -100px) scale(1.3);
                  opacity: 0;
                }
              }
              @keyframes releaseGreen {
                0% {
                  transform: translate(0, 0) scale(0.5);
                  opacity: 0.8;
                }
                100% {
                  transform: translate(180px, -100px) scale(1.3);
                  opacity: 0;
                }
              }
              @keyframes releaseOrange {
                0% {
                  transform: translate(0, 0) scale(0.5);
                  opacity: 0.8;
                }
                100% {
                  transform: translate(0, 120px) scale(1.3);
                  opacity: 0;
                }
              }
              .animate-release-blue {
                animation: releaseBlue 1.6s cubic-bezier(0.25, 1, 0.5, 1) infinite;
              }
              .animate-release-green {
                animation: releaseGreen 1.6s cubic-bezier(0.25, 1, 0.5, 1) infinite;
              }
              .animate-release-orange {
                animation: releaseOrange 1.6s cubic-bezier(0.25, 1, 0.5, 1) infinite;
              }
            `}</style>

            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-primary">🎨 Logo Meaning & Symbolism</h2>
            </div>

            {/* Desktop / Large Screen: Interactive Diagram */}
            <div className="hidden md:block relative w-full h-[530px] bg-slate-50/60 rounded-2xl border border-slate-200/50 overflow-hidden select-none">
              {/* Dot grid pattern overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-70 pointer-events-none" />

              <svg viewBox="0 0 800 520" className="w-full h-full relative z-10">
                {/* SVG Connection Lines */}
                <g>
                  {/* Vṛtta connection line */}
                  <path
                    d="M 270,90 C 300,90 310,120 330,120"
                    fill="none"
                    stroke={activeFeature === 'circle' ? '#3b82f6' : '#cbd5e1'}
                    strokeWidth={activeFeature === 'circle' ? '2.5' : '1.5'}
                    className={`transition-all duration-300 ${activeFeature === 'circle' ? 'animate-flow-dash' : ''}`}
                  />
                  
                  {/* Jaṭā connection line */}
                  <path
                    d="M 530,90 C 500,90 490,120 470,120"
                    fill="none"
                    stroke={activeFeature === 'jata' ? '#10b981' : '#cbd5e1'}
                    strokeWidth={activeFeature === 'jata' ? '2.5' : '1.5'}
                    className={`transition-all duration-300 ${activeFeature === 'jata' ? 'animate-flow-dash' : ''}`}
                  />
                  
                  {/* Jvālā connection line */}
                  <path
                    d="M 400,310 L 400,270"
                    fill="none"
                    stroke={activeFeature === 'fire' ? '#d97706' : '#cbd5e1'}
                    strokeWidth={activeFeature === 'fire' ? '2.5' : '1.5'}
                    className={`transition-all duration-300 ${activeFeature === 'fire' ? 'animate-flow-dash' : ''}`}
                  />
                </g>

                {/* Hotspots */}
                <g>
                  {/* Vṛtta Hotspot */}
                  <circle
                    cx="330"
                    cy="120"
                    r={activeFeature === 'circle' ? '7' : '4'}
                    className="transition-all duration-300 fill-blue-500 stroke-white stroke-2 shadow"
                  />
                  {activeFeature === 'circle' && (
                    <circle
                      cx="330"
                      cy="120"
                      r="8"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      style={{
                        transformOrigin: '330px 120px',
                        animation: 'hotspotPulseBlue 1.5s ease-out infinite'
                      }}
                    />
                  )}

                  {/* Jaṭā Hotspot */}
                  <circle
                    cx="470"
                    cy="120"
                    r={activeFeature === 'jata' ? '7' : '4'}
                    className="transition-all duration-300 fill-emerald-500 stroke-white stroke-2 shadow"
                  />
                  {activeFeature === 'jata' && (
                    <circle
                      cx="470"
                      cy="120"
                      r="8"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      style={{
                        transformOrigin: '470px 120px',
                        animation: 'hotspotPulseGreen 1.5s ease-out infinite'
                      }}
                    />
                  )}

                  {/* Jvālā Hotspot */}
                  <circle
                    cx="400"
                    cy="270"
                    r={activeFeature === 'fire' ? '7' : '4'}
                    className="transition-all duration-300 fill-amber-500 stroke-white stroke-2 shadow"
                  />
                  {activeFeature === 'fire' && (
                    <circle
                      cx="400"
                      cy="270"
                      r="8"
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="2"
                      style={{
                        transformOrigin: '400px 270px',
                        animation: 'hotspotPulseOrange 1.5s ease-out infinite'
                      }}
                    />
                  )}
                </g>

                {/* Released Flowing Circles */}
                <g className="pointer-events-none">
                  {activeFeature === 'circle' && (
                    <g transform="translate(400, 190)">
                      <circle cx="0" cy="0" r="5" fill="#3b82f6" className="animate-release-blue" />
                      <circle cx="0" cy="0" r="5" fill="#3b82f6" className="animate-release-blue" style={{ animationDelay: '0.8s' }} />
                    </g>
                  )}
                  {activeFeature === 'jata' && (
                    <g transform="translate(400, 190)">
                      <circle cx="0" cy="0" r="5" fill="#10b981" className="animate-release-green" />
                      <circle cx="0" cy="0" r="5" fill="#10b981" className="animate-release-green" style={{ animationDelay: '0.8s' }} />
                    </g>
                  )}
                  {activeFeature === 'fire' && (
                    <g transform="translate(400, 190)">
                      <circle cx="0" cy="0" r="5" fill="#d97706" className="animate-release-orange" />
                      <circle cx="0" cy="0" r="5" fill="#d97706" className="animate-release-orange" style={{ animationDelay: '0.8s' }} />
                    </g>
                  )}
                </g>

                {/* Vṛtta Card (Top Left) */}
                <foreignObject x="-12" y="-7" width="310" height="180">
                  <div 
                    className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer w-[250px] h-[130px] flex flex-col justify-between ${
                      activeFeature === 'circle' 
                        ? 'border-blue-500 bg-blue-50/5 shadow-[0_0_15px_rgba(59,130,246,0.15)] translate-x-1.5 scale-[1.01]' 
                        : 'border-slate-200/60 bg-white/95 hover:border-blue-300 hover:bg-white'
                    }`}
                    style={{ margin: '25px 30px' }}
                    onMouseEnter={() => { setActiveFeature('circle'); setIsHovered(true); }}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200/50">
                          <svg className="w-2.5 h-2.5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        </div>
                        <h3 className="text-xs font-bold text-slate-800">Vṛtta</h3>
                      </div>
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/40">Circle</span>
                    </div>
                    <ul className="text-[10px] text-slate-500 space-y-1 mt-1 font-medium">
                      <li className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">→</span>
                        <span>Control layer of knowledge</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">→</span>
                        <span>Stability and validation system</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">→</span>
                        <span>Ensures structured flow while maintaining order</span>
                      </li>
                    </ul>
                  </div>
                </foreignObject>

                {/* Jaṭā Card (Top Right) */}
                <foreignObject x="488" y="-7" width="310" height="180">
                  <div 
                    className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer w-[250px] h-[130px] flex flex-col justify-between ${
                      activeFeature === 'jata' 
                        ? 'border-emerald-500 bg-emerald-50/5 shadow-[0_0_15px_rgba(16,185,129,0.15)] -translate-x-1.5 scale-[1.01]' 
                        : 'border-slate-200/60 bg-white/95 hover:border-emerald-300 hover:bg-white'
                    }`}
                    style={{ margin: '25px 30px' }}
                    onMouseEnter={() => { setActiveFeature('jata'); setIsHovered(true); }}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-200/50">
                          <svg className="w-3 h-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M6 3c1 3 3 5 3 9s-2 6 -2 9" />
                            <path d="M12 3c1 3 3 5 3 9s-2 6 -2 9" />
                            <path d="M18 3c1 3 3 5 3 9s-2 6 -2 9" />
                          </svg>
                        </div>
                        <h3 className="text-xs font-bold text-slate-800">Jaṭā</h3>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/40">Matted Hair</span>
                    </div>
                    <ul className="text-[10px] text-slate-500 space-y-1 mt-1 font-medium">
                      <li className="flex items-start gap-1">
                        <span className="text-emerald-500 mt-0.5">→</span>
                        <span>Knowledge base</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-emerald-500 mt-0.5">→</span>
                        <span>Continuous structured growth</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-emerald-500 mt-0.5">→</span>
                        <span>Expansion of knowledge flow</span>
                      </li>
                    </ul>
                  </div>
                </foreignObject>

                {/* Centerpiece Logo (Perfect Circle Boundary focus) */}
                <foreignObject x="280" y="70" width="240" height="240">
                  <div 
                    className="w-full h-full flex items-center justify-center relative group cursor-pointer"
                    onMouseEnter={() => { setActiveFeature('q'); setIsHovered(true); }}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    {/* Radial Spotlight Overlay */}
                    <div className={`absolute w-[180px] h-[180px] rounded-full blur-xl transition-all duration-700 opacity-20 ${
                      activeFeature === 'fire' ? 'bg-amber-500 scale-110' :
                      activeFeature === 'jata' ? 'bg-emerald-500 scale-110' :
                      activeFeature === 'circle' ? 'bg-blue-500 scale-110' :
                      activeFeature === 'q' ? 'bg-indigo-500 scale-120 opacity-30' :
                      'bg-indigo-500 opacity-10'
                    }`} />
                    
                    {/* perfectly circular logo container */}
                    <div className={`w-[170px] h-[170px] rounded-full bg-white border border-slate-200/60 flex items-center justify-center relative overflow-hidden transition-all duration-300 shadow-inner ${
                      activeFeature === 'q' ? 'scale-105 border-indigo-400/50 shadow-md' : 'group-hover:scale-105'
                    }`}>
                      <img
                        src="/PippaQ1.webp"
                        alt="PippaQ Logo"
                        className="w-28 h-28 object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative z-20"
                      />

                      {/* Jvālā (Flame) Glow Highlight: Bottom section glow */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none transition-opacity duration-300 z-10 bg-gradient-to-t from-amber-500/40 to-transparent blur-sm"
                        style={{
                          animation: activeFeature === 'fire' ? 'flameFlicker 1.8s ease-in-out infinite' : 'none',
                          opacity: activeFeature === 'fire' ? 1 : 0
                        }}
                      />

                      {/* Jaṭā Glow Highlight: Top-right region glow */}
                      <div 
                        className="absolute top-0 right-0 w-16 h-16 pointer-events-none transition-opacity duration-300 z-10 bg-emerald-500/30 blur-md rounded-full"
                        style={{
                          animation: activeFeature === 'jata' ? 'jataFlow 2s ease-in-out infinite' : 'none',
                          opacity: activeFeature === 'jata' ? 1 : 0
                        }}
                      />

                      {/* Vṛtta Glow Highlight: Glowing outer ring around entire logo inside */}
                      <div 
                        className={`absolute inset-1 rounded-full pointer-events-none border transition-all duration-500 z-10 ${
                          activeFeature === 'circle' 
                            ? 'border-blue-500/70 border-2 scale-105 shadow-[0_0_15px_rgba(59,130,246,0.35)]' 
                            : 'border-transparent'
                        }`}
                        style={{
                          animation: activeFeature === 'circle' ? 'spin 12s linear infinite' : 'none'
                        }}
                      />
                    </div>
                  </div>
                </foreignObject>

                {/* Jvālā Card (Bottom) */}
                <foreignObject x="240" y="273" width="320" height="180">
                  <div 
                    className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer w-[260px] h-[120px] flex flex-col justify-between ${
                      activeFeature === 'fire' 
                        ? 'border-amber-500 bg-amber-50/5 shadow-[0_0_15px_rgba(245,158,11,0.15)] scale-[1.01]' 
                        : 'border-slate-200/60 bg-white/95 hover:border-amber-300 hover:bg-white'
                    }`}
                    style={{ margin: '30px' }}
                    onMouseEnter={() => { setActiveFeature('fire'); setIsHovered(true); }}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-200/50">
                          <Flame className="w-3 h-3 text-amber-600" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-800">Jvālā</h3>
                      </div>
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/40">Flame</span>
                    </div>
                    <ul className="text-[10px] text-slate-500 space-y-1 mt-1 font-medium">
                      <li className="flex items-start gap-1">
                        <span className="text-amber-500 mt-0.5">→</span>
                        <span><strong>Tapa:</strong> Knowledge Discipline</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-amber-500 mt-0.5">→</span>
                        <span>Continuous learning</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-amber-500 mt-0.5">→</span>
                        <span>Knowledge generation through effort</span>
                      </li>
                    </ul>
                  </div>
                </foreignObject>

                {/* Q Highlight Statement (Center Bottom) */}
                <foreignObject x="150" y="405" width="500" height="135">
                  <div 
                    className={`p-3 rounded-xl border text-center transition-all duration-300 cursor-pointer w-[440px] ${
                      activeFeature === 'q' 
                        ? 'border-indigo-500 bg-indigo-50/10 shadow-[0_0_15px_rgba(99,102,241,0.15)] scale-[1.02]' 
                        : 'border-slate-200/60 bg-white/95 hover:border-indigo-200/60'
                    }`}
                    style={{ height: '92px', margin: '20px 30px' }}
                    onMouseEnter={() => { setActiveFeature('q'); setIsHovered(true); }}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <h4 className="text-xs font-bold text-indigo-700 flex items-center justify-center gap-1 font-brand">
                      <span>✳️</span> The Unified Symbol of Q
                    </h4>
                    <p className="text-[10px] text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                      The complete structure forms a stylized <strong>“Q”</strong>, representing a modern Query Intelligence System where knowledge is continuously created (Jvālā), structured (Jaṭā), and validated (Vṛtta).
                    </p>
                  </div>
                </foreignObject>
              </svg>
            </div>

            {/* Mobile Screen: Responsive Tabs & Cards */}
            <div className="md:hidden space-y-6">
              {/* Centerpiece logo with spotlight */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-2xl border border-slate-200/40 relative overflow-hidden">
                <div className={`absolute w-36 h-36 rounded-full blur-xl transition-all duration-500 opacity-25 ${
                  activeFeature === 'fire' ? 'bg-amber-500' :
                  activeFeature === 'jata' ? 'bg-emerald-500' :
                  activeFeature === 'circle' ? 'bg-blue-500' :
                  'bg-indigo-500'
                }`} />
                <div className="w-32 h-32 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner relative">
                  <img
                    src="/PippaQ1.webp"
                    alt="PippaQ Logo"
                    className="w-20 h-20 object-contain relative z-20"
                  />
                  {/* Jvālā Mobile Glow (Bottom section of circle) */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none transition-opacity duration-300 z-10 bg-gradient-to-t from-amber-500/40 to-transparent blur-sm"
                    style={{
                      animation: activeFeature === 'fire' ? 'flameFlicker 1.8s ease-in-out infinite' : 'none',
                      opacity: activeFeature === 'fire' ? 1 : 0
                    }}
                  />
                  {/* Jaṭā Mobile Glow (Top-right region) */}
                  <div 
                    className="absolute top-0 right-0 w-12 h-12 pointer-events-none transition-opacity duration-300 z-10 bg-emerald-500/30 blur-md rounded-full"
                    style={{
                      animation: activeFeature === 'jata' ? 'jataFlow 2s ease-in-out infinite' : 'none',
                      opacity: activeFeature === 'jata' ? 1 : 0
                    }}
                  />
                  {/* Vṛtta Mobile Glow (Outer ring border) */}
                  <div 
                    className={`absolute inset-1 rounded-full pointer-events-none border transition-all duration-500 z-10 ${
                      activeFeature === 'circle' 
                        ? 'border-blue-500/70 border-2 scale-105 shadow-[0_0_10px_rgba(59,130,246,0.35)]' 
                        : 'border-transparent'
                    }`}
                    style={{
                      animation: activeFeature === 'circle' ? 'spin 12s linear infinite' : 'none'
                    }}
                  />
                </div>
              </div>

              {/* Tabs list */}
              <div className="flex justify-between gap-1 p-1 bg-slate-100/80 rounded-xl overflow-x-auto">
                <button
                  onClick={() => setActiveFeature('circle')}
                  className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${
                    activeFeature === 'circle' 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  ⚪ Vṛtta
                </button>
                <button
                  onClick={() => setActiveFeature('jata')}
                  className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${
                    activeFeature === 'jata' 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  🦱 Jaṭā
                </button>
                <button
                  onClick={() => setActiveFeature('fire')}
                  className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${
                    activeFeature === 'fire' 
                      ? 'bg-amber-500 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  🔥 Jvālā
                </button>
                <button
                  onClick={() => setActiveFeature('q')}
                  className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${
                    activeFeature === 'q' 
                      ? 'bg-indigo-500 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  🔷 Q Symbol
                </button>
              </div>

              {/* Information Cards */}
              <div className="transition-all duration-300">
                {activeFeature === 'fire' && (
                  <div className="p-5 rounded-2xl border border-amber-200/70 bg-amber-50/20 shadow-sm space-y-3 animate-scaleIn">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-200/50">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">Jvālā</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Represents knowledge and continuous learning. It symbolizes <strong>Tapa (Knowledge Discipline)</strong>—the continuous effort required to gain and maintain wisdom, reflected as effort and persistence.
                    </p>
                    <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-amber-200/30 font-medium">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Tapa: Knowledge Discipline</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Continuous learning</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Knowledge generation through effort</span>
                      </li>
                    </ul>
                  </div>
                )}

                {activeFeature === 'jata' && (
                  <div className="p-5 rounded-2xl border border-emerald-200/70 bg-emerald-50/20 shadow-sm space-y-3 animate-scaleIn">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-200/50">
                        <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M6 3c1 3 3 5 3 9s-2 6 -2 9" />
                          <path d="M12 3c1 3 3 5 3 9s-2 6 -2 9" />
                          <path d="M18 3c1 3 3 5 3 9s-2 6 -2 9" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">Jaṭā</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Represents the expanding knowledge base of the platform. Matted hair-like structure representing the continuous flow and growth of structured intelligence.
                    </p>
                    <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-emerald-200/30 font-medium">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Knowledge base</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Continuous structured growth</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Expansion of knowledge flow</span>
                      </li>
                    </ul>
                  </div>
                )}

                {activeFeature === 'circle' && (
                  <div className="p-5 rounded-2xl border border-blue-200/70 bg-blue-50/20 shadow-sm space-y-3 animate-scaleIn">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200/50">
                        <svg className="w-3 h-3 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">Vṛtta</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      The circular boundary represents the control layer of knowledge. It functions as a stability and validation system, ensuring a structured flow while maintaining order.
                    </p>
                    <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-blue-200/30 font-medium">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>Control layer of knowledge</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>Stability and validation system</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>Ensures structured flow while maintaining order</span>
                      </li>
                    </ul>
                  </div>
                )}

                {activeFeature === 'q' && (
                  <div className="p-5 rounded-2xl border border-indigo-200/70 bg-indigo-50/20 shadow-sm space-y-3 animate-scaleIn">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔷</span>
                      <h3 className="text-sm font-bold text-slate-800">The Unified Symbol of Q</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      The complete structure forms a stylized <strong>“Q”</strong>, representing a modern Query Intelligence System where knowledge is continuously created (Jvālā), structured (Jaṭā), and validated (Vṛtta).
                    </p>
                    <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-indigo-200/30 font-medium">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>Query Intelligence System</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>Fusion of Jvālā, Jaṭā, and Vṛtta</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Core Interpretation final block */}
            <div className="mt-8 p-5 bg-slate-50/50 rounded-2xl border border-slate-200/40 text-left space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <span>🧠</span> Core Interpretation
              </h4>
              <div className="space-y-2 text-xs text-slate-600 leading-relaxed font-medium">
                <p>
                  <strong>Jvālā (Flame)</strong> represents knowledge and continuous <strong>Tapa</strong> required to gain and maintain wisdom.
                </p>
                <p>
                  <strong>Jaṭā (Matted Hair)</strong> represents the knowledge base — the continuous flow and growth of structured intelligence.
                </p>
                <p>
                  <strong>Vṛtta (Circle)</strong> represents control and stability, ensuring knowledge remains validated and structured while allowing flow beyond boundaries.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/40 text-center text-xs font-bold text-indigo-600">
                👉 Together, they form a unified “Q” symbol, representing a modern Query-based intelligence system.
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-border/40 text-center text-xs font-bold text-slate-500">
              👉 The logo is a perfect blend of Ancient Wisdom + Structured Intelligence + Modern Query Systems.
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="card shadow-premium p-6 sm:p-8 bg-white/80 backdrop-blur-sm animate-scaleIn">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-violet-600" />
              </div>
              <h2 className="text-xl font-bold text-primary">⚙️ Platform Architecture & Pages</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-l-4 border-l-emerald-500 border-border/50 bg-emerald-50/5 space-y-1">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  FAQ PAGE (Verified Base)
                </span>
                <p className="text-xs text-muted leading-relaxed">
                  Houses verified, permanent, and category-organized questions. Features snap-scrolling categories, upvoting, and instant search.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-l-4 border-l-blue-500 border-border/50 bg-blue-50/5 space-y-1">
                <span className="text-xs font-bold text-blue-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  RTQ PAGE (Real-Time Queries)
                </span>
                <p className="text-xs text-muted leading-relaxed">
                  Live forum where students raise unresolved questions, submit multiple answers, and vote on peer feedback under Moderator and Senior supervision.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-l-4 border-l-amber-500 border-border/50 bg-amber-50/5 space-y-1">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  TRACK MY ISSUES
                </span>
                <p className="text-xs text-muted leading-relaxed">
                  A dedicated dashboard for tracking submitted questions. Updates status in real-time (Green for resolved, Lite Blue for partially resolved, Red for unresolved).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-l-4 border-l-rose-500 border-border/50 bg-rose-50/5 space-y-1">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  RAISE QUESTION & RAG SCAN
                </span>
                <p className="text-xs text-muted leading-relaxed">
                  Allows students to submit questions. Uses semantic evaluation to verify duplicates, applying QP penalties for lazy submissions.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-l-4 border-l-purple-500 border-border/50 bg-purple-50/5 space-y-1 sm:col-span-2">
                <span className="text-xs font-bold text-purple-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  USER & ADMIN MANAGEMENT
                </span>
                <p className="text-xs text-muted leading-relaxed">
                  Enables Seniors and Admins to govern the platform, assign roles, monitor Quality Point balances, and approve FAQ conversion requests.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'economy' && (
          <div className="card shadow-premium p-6 sm:p-8 bg-white/80 backdrop-blur-sm animate-scaleIn space-y-6">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-rose-600" />
              </div>
              <h2 className="text-xl font-bold text-primary">👥 Roles & Quality Point (QP) System</h2>
            </div>

            {/* Roles Descriptions */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border/50 bg-white shadow-sm space-y-2">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>Student</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Can raise questions, submit answers on RTQ forum, upvote content, and track submitted queries.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/50 bg-white shadow-sm space-y-2">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>Moderator</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Has student abilities plus the power to accept/reject questions and approve/reject answers.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/50 bg-white shadow-sm space-y-2">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Senior / Admin</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Highest authority. Can add FAQs, toggle reviews, and convert forum discussions into permanent FAQs.
                </p>
              </div>
            </div>

            {/* QP Tables */}
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border/40">
              {/* Student Rules */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-500" />
                  Student QP Ledger
                </h3>
                <div className="overflow-x-auto border border-border/40 rounded-xl">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-border/40">
                      <tr>
                        <th className="px-3 py-2">Action</th>
                        <th className="px-3 py-2 text-right">QP Effect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="px-3 py-2">Raise Question - Rejected</td>
                        <td className="px-3 py-2 text-right text-red-600">-5 QP</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">Raise Question - Accepted</td>
                        <td className="px-3 py-2 text-right text-emerald-600">+5 QP</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">Raise Question - Added to FAQ</td>
                        <td className="px-3 py-2 text-right text-emerald-600">+20 QP</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">Post RTQ Answer</td>
                        <td className="px-3 py-2 text-right text-emerald-600">+2 QP</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">Answer Approved by Mod/Senior</td>
                        <td className="px-3 py-2 text-right text-emerald-600">+5 QP</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">Answer Removed</td>
                        <td className="px-3 py-2 text-right text-red-600">-3 QP</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">Answer Selected for FAQ</td>
                        <td className="px-3 py-2 text-right text-emerald-600">+10 QP</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">Every 10 upvotes on content</td>
                        <td className="px-3 py-2 text-right text-emerald-600">+1 QP</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Seniors & Mods Rules */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-500" />
                  Staff QP Ledger
                </h3>
                <div className="overflow-x-auto border border-border/40 rounded-xl">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-border/40">
                      <tr>
                        <th className="px-3 py-2">Action</th>
                        <th className="px-3 py-2 text-right">QP Effect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="px-3 py-2">Moderator Approval / Rejection</td>
                        <td className="px-3 py-2 text-right text-emerald-600">+3 QP</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">Senior Approve / Remove Content</td>
                        <td className="px-3 py-2 text-right text-emerald-600">+5 QP</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">Senior Answer Posted</td>
                        <td className="px-3 py-2 text-right text-emerald-600">+5 QP</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">RTQ to FAQ Conversion</td>
                        <td className="px-3 py-2 text-right text-emerald-600">+10 QP</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">Manual FAQ Creation</td>
                        <td className="px-3 py-2 text-right text-emerald-600">+15 QP</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Restriction Rules */}
            <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl border border-red-200/60 bg-red-50/20 text-red-800 text-sm mt-4">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-red-900 leading-tight">⚠️ Global System Restrictions</p>
                <ul className="list-disc list-inside text-xs text-red-700 space-y-1 pt-1.5">
                  <li>Every user starts with a base balance of <strong>100 QP</strong>.</li>
                  <li>If your Quality Point balance falls <strong>below 50 QP</strong>, you will be restricted from raising new questions.</li>
                  <li>If your Quality Point balance drops into the <strong>negative (QP &lt; 0)</strong>, your account enters <strong>Restriction Mode (Read-Only)</strong>. You will be unable to raise questions, resolve queries, or post answers.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footervision */}
      <div className="mt-12 text-center p-6 border-t border-border/50">
        <h3 className="font-brand text-lg font-bold text-primary">🚀 Final Vision</h3>
        <p className="text-xs text-muted max-w-lg mx-auto mt-2 italic leading-relaxed">
          “PippaQ is not just a FAQ system. It is a knowledge intelligence ecosystem inspired by ancient wisdom and powered by modern AI: Where every question is validated, every answer is refined, and knowledge continuously evolves.”
        </p>
        {!user && (
          <div className="mt-4">
            <Link to="/login" className="btn-gradient-sm inline-flex items-center gap-1">
              Access the Platform <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
