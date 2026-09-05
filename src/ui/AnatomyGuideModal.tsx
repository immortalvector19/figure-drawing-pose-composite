import React, { useState, useEffect } from 'react';
import { X, BookOpen, Layers, Compass, GitCommit, CheckCircle2, Box, Activity, Anchor } from 'lucide-react';

interface AnatomyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideTab = 'okabayashi' | 'brokendraw' | 'woodward' | 'tiner' | 'proportions' | 'loomis' | 'bridgman' | 'hampton';

export const AnatomyGuideModal: React.FC<AnatomyGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('okabayashi');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-studio-900 border border-studio-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-studio-800 flex items-center justify-between bg-studio-850">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-accent/40 flex items-center justify-center text-brand-accent shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide">
                Figure Drawing & Form Construction Master Guide
              </h2>
              <p className="text-xs text-studio-400">
                Classical master anatomy methods synthesized into 3D-informed algorithmic primitives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-studio-400 hover:text-white hover:bg-studio-800 transition"
            title="Close Guide (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-studio-800 px-6 bg-studio-900/60 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('okabayashi')}
            className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'okabayashi'
                ? 'border-brand-500 text-brand-accent font-semibold'
                : 'border-transparent text-studio-400 hover:text-studio-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kensuke Okabayashi (Mannequin)</span>
          </button>

          <button
            onClick={() => setActiveTab('brokendraw')}
            className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'brokendraw'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-studio-400 hover:text-studio-200'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>BrokenDraw (3 Big Boxes)</span>
          </button>

          <button
            onClick={() => setActiveTab('woodward')}
            className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'woodward'
                ? 'border-rose-500 text-rose-400 font-semibold'
                : 'border-transparent text-studio-400 hover:text-studio-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Ryan Woodward (Conté Rhythms)</span>
          </button>

          <button
            onClick={() => setActiveTab('tiner')}
            className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'tiner'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-studio-400 hover:text-studio-200'
            }`}
          >
            <Anchor className="w-4 h-4" />
            <span>Ron Tiner (Action & Balance)</span>
          </button>

          <button
            onClick={() => setActiveTab('proportions')}
            className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'proportions'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-studio-400 hover:text-studio-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>8-Head Canon</span>
          </button>

          <button
            onClick={() => setActiveTab('loomis')}
            className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'loomis'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-studio-400 hover:text-studio-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Andrew Loomis</span>
          </button>

          <button
            onClick={() => setActiveTab('bridgman')}
            className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'bridgman'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-studio-400 hover:text-studio-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>George Bridgman</span>
          </button>

          <button
            onClick={() => setActiveTab('hampton')}
            className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'hampton'
                ? 'border-rose-500 text-rose-400 font-semibold'
                : 'border-transparent text-studio-400 hover:text-studio-200'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            <span>Michael Hampton</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-studio-300 text-xs leading-relaxed">
          {activeTab === 'okabayashi' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Illustrated Diagram */}
              <div className="bg-studio-950 p-4 rounded-xl border border-studio-800 flex flex-col items-center justify-center">
                <svg viewBox="0 0 280 440" className="w-full max-w-[250px] h-auto">
                  {/* Spine Axis / Line of Action */}
                  <line x1="140" y1="35" x2="140" y2="225" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />

                  {/* 1. Head Cranium Sphere & Crosshairs */}
                  <circle cx="140" cy="52" r="22" fill="#0284c7" fillOpacity="0.22" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="120" y1="52" x2="160" y2="52" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
                  <line x1="140" y1="32" x2="140" y2="72" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />

                  {/* Jaw Wedge */}
                  <polygon points="123,58 157,58 150,78 130,78" fill="#0284c7" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="1.8" />

                  {/* Neck Cylinder */}
                  <rect x="131" y="76" width="18" height="22" rx="8" fill="#0284c7" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="2" />

                  {/* Shoulder Clavicle Axis */}
                  <line x1="98" y1="104" x2="182" y2="104" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 2" />

                  {/* Shoulder Ball Joints */}
                  <circle cx="98" cy="104" r="8" fill="#fbbf24" fillOpacity="0.4" stroke="#d97706" strokeWidth="2" />
                  <circle cx="182" cy="104" r="8" fill="#fbbf24" fillOpacity="0.4" stroke="#d97706" strokeWidth="2" />

                  {/* Ribcage Barrel / Egg */}
                  <ellipse cx="140" cy="132" rx="35" ry="30" fill="#e11d48" fillOpacity="0.2" stroke="#f43f5e" strokeWidth="2.2" />

                  {/* Upper Arms */}
                  <rect x="89" y="112" width="16" height="52" rx="8" fill="#ca8a04" fillOpacity="0.22" stroke="#eab308" strokeWidth="2" />
                  <rect x="175" y="112" width="16" height="52" rx="8" fill="#ca8a04" fillOpacity="0.22" stroke="#eab308" strokeWidth="2" />

                  {/* Elbow Ball Joints */}
                  <circle cx="97" cy="170" r="7" fill="#fbbf24" fillOpacity="0.4" stroke="#d97706" strokeWidth="2" />
                  <circle cx="183" cy="170" r="7" fill="#fbbf24" fillOpacity="0.4" stroke="#d97706" strokeWidth="2" />

                  {/* Forearms */}
                  <rect x="90" y="177" width="14" height="48" rx="7" fill="#ca8a04" fillOpacity="0.22" stroke="#eab308" strokeWidth="2" />
                  <rect x="176" y="177" width="14" height="48" rx="7" fill="#ca8a04" fillOpacity="0.22" stroke="#eab308" strokeWidth="2" />

                  {/* Hand Wedges */}
                  <polygon points="87,228 107,228 103,246 91,246" fill="#ea580c" fillOpacity="0.3" stroke="#f97316" strokeWidth="1.8" />
                  <polygon points="173,228 193,228 189,246 177,246" fill="#ea580c" fillOpacity="0.3" stroke="#f97316" strokeWidth="1.8" />

                  {/* Stomach / Abdomen Waist Column */}
                  <rect x="123" y="158" width="34" height="26" rx="10" fill="#e11d48" fillOpacity="0.18" stroke="#f43f5e" strokeWidth="2" />

                  {/* Pelvic Wedge / Underwear Shape */}
                  <polygon points="112,184 168,184 156,220 124,220" fill="#9333ea" fillOpacity="0.25" stroke="#a855f7" strokeWidth="2.2" />

                  {/* Hip Ball Joints */}
                  <circle cx="118" cy="222" r="9" fill="#fbbf24" fillOpacity="0.4" stroke="#d97706" strokeWidth="2" />
                  <circle cx="162" cy="222" r="9" fill="#fbbf24" fillOpacity="0.4" stroke="#d97706" strokeWidth="2" />

                  {/* Thighs */}
                  <rect x="108" y="231" width="20" height="74" rx="10" fill="#16a34a" fillOpacity="0.22" stroke="#22c55e" strokeWidth="2" />
                  <rect x="152" y="231" width="20" height="74" rx="10" fill="#16a34a" fillOpacity="0.22" stroke="#22c55e" strokeWidth="2" />

                  {/* Knee Ball Joints */}
                  <circle cx="118" cy="312" r="8" fill="#fbbf24" fillOpacity="0.4" stroke="#d97706" strokeWidth="2" />
                  <circle cx="162" cy="312" r="8" fill="#fbbf24" fillOpacity="0.4" stroke="#d97706" strokeWidth="2" />

                  {/* Calves / Lower Legs */}
                  <rect x="110" y="320" width="16" height="70" rx="8" fill="#16a34a" fillOpacity="0.22" stroke="#22c55e" strokeWidth="2" />
                  <rect x="154" y="320" width="16" height="70" rx="8" fill="#16a34a" fillOpacity="0.22" stroke="#22c55e" strokeWidth="2" />

                  {/* Ankle Ball Joints */}
                  <circle cx="118" cy="395" r="6" fill="#fbbf24" fillOpacity="0.4" stroke="#d97706" strokeWidth="1.8" />
                  <circle cx="162" cy="395" r="6" fill="#fbbf24" fillOpacity="0.4" stroke="#d97706" strokeWidth="1.8" />

                  {/* Feet Wedges */}
                  <polygon points="107,402 129,402 133,418 103,418" fill="#ea580c" fillOpacity="0.3" stroke="#f97316" strokeWidth="1.8" />
                  <polygon points="151,402 173,402 177,418 147,418" fill="#ea580c" fillOpacity="0.3" stroke="#f97316" strokeWidth="1.8" />

                  {/* Labels / Callouts */}
                  <text x="180" y="70" fill="#38bdf8" fontSize="8" fontFamily="monospace">1. Head & Neck</text>
                  <text x="185" y="132" fill="#fb7185" fontSize="8" fontFamily="monospace">2. Ribcage Barrel</text>
                  <text x="175" y="168" fill="#fbbf24" fontSize="8" fontFamily="monospace">Joint Spheres</text>
                  <text x="172" y="180" fill="#fb7185" fontSize="8" fontFamily="monospace">3. Stomach Mass</text>
                  <text x="182" y="210" fill="#c084fc" fontSize="8" fontFamily="monospace">4. Pelvic Wedge</text>
                </svg>
                <span className="text-[10px] text-studio-400 mt-2 font-mono">
                  Figure 1.0: Kensuke Okabayashi Connected Mannequin System
                </span>
              </div>

              {/* Theory & Breakdown Notes */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Kensuke Okabayashi's Figure Drawing For Dummies Method
                  </h3>
                  <p className="text-studio-400 mt-1">
                    Okabayashi emphasizes that human figure drawing succeeds when artists transition from a flat stick figure to a volumetric 3D mannequin built from the <em>center out</em>. Every form connects logically:
                  </p>
                </div>

                <div className="space-y-2 bg-studio-850 p-3 rounded-xl border border-studio-800">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Head & Cervical Neck:</strong> The cranium is an egg/sphere with a facial crosshair (centerline and eyeline) establishing gaze and tilt. The jaw wedge attaches below, and a <em>sturdy cylindrical neck</em> anchors the head firmly into the ribcage opening.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">The Three Core Torso Masses:</strong> Torso is never drawn as a single blob. It consists of the <em>ribcage barrel</em> (large thoracic egg), the flexible <em>stomach/abdominal column</em> ("keeping the stomach simple"), and the sturdy <em>pelvic wedge</em> ("getting hip").
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Articulated Ball Joints:</strong> Limbs are not floating logs. Spherical ball joints at shoulders, elbows, hips, knees, and ankles physically anchor the segments and allow realistic rotational posing.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Connecting Cylinders & Wedge Blocks:</strong> Arms and legs are tapered cylinders bridging joint to joint. Hands and feet are simplified into directional 3D wedge blocks.
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-studio-400 bg-studio-950 p-2.5 rounded-lg border border-studio-800">
                  <span className="text-brand-accent font-semibold">FormMaster Implementation:</span> Selecting <span className="text-white font-mono">Okabayashi</span> mode generates this fully connected mannequin with cervical neck cylinder, abdominal column, and spherical ball joints on every detected pose.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'proportions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Illustrated Diagram */}
              <div className="bg-studio-950 p-4 rounded-xl border border-studio-800 flex flex-col items-center justify-center">
                <svg viewBox="0 0 280 440" className="w-full max-w-[240px] h-auto">
                  {/* Vertical baseline ruler */}
                  <line x1="45" y1="30" x2="45" y2="410" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" />
                  
                  {/* Figure silhouette abstraction */}
                  {/* Head */}
                  <circle cx="140" cy="55" r="22" fill="#0284c7" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2" />
                  {/* Neck */}
                  <line x1="140" y1="77" x2="140" y2="90" stroke="#94a3b8" strokeWidth="3" />
                  {/* Torso */}
                  <path d="M 115 90 L 165 90 L 155 170 L 125 170 Z" fill="#0284c7" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="2" />
                  {/* Pelvis */}
                  <path d="M 120 175 L 160 175 L 150 220 L 130 220 Z" fill="#f43f5e" fillOpacity="0.25" stroke="#f43f5e" strokeWidth="2" />
                  {/* Upper legs */}
                  <line x1="130" y1="220" x2="128" y2="315" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
                  <line x1="150" y1="220" x2="152" y2="315" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
                  {/* Knee joints */}
                  <circle cx="128" cy="315" r="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
                  <circle cx="152" cy="315" r="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
                  {/* Lower legs */}
                  <line x1="128" y1="319" x2="126" y2="395" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="152" y1="319" x2="154" y2="395" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
                  {/* Feet */}
                  <line x1="120" y1="410" x2="132" y2="410" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                  <line x1="148" y1="410" x2="160" y2="410" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />

                  {/* 8-Head Divisions */}
                  {[
                    { u: 0, y: 30, text: '0: Crown' },
                    { u: 1, y: 77.5, text: '1: Chin' },
                    { u: 2, y: 125, text: '2: Nipples' },
                    { u: 3, y: 172.5, text: '3: Navel' },
                    { u: 4, y: 220, text: '4: Crotch (1/2)' },
                    { u: 5, y: 267.5, text: '5: Mid-Thigh' },
                    { u: 6, y: 315, text: '6: Knee Base' },
                    { u: 7, y: 362.5, text: '7: Calf Base' },
                    { u: 8, y: 410, text: '8: Soles' },
                  ].map((div) => (
                    <g key={div.u}>
                      <line x1="38" y1={div.y} x2="250" y2={div.y} stroke={div.u === 4 ? '#f43f5e' : '#475569'} strokeWidth={div.u === 4 ? 1.5 : 0.8} strokeDasharray={div.u === 4 ? undefined : '2 2'} />
                      <line x1="38" y1={div.y} x2="52" y2={div.y} stroke={div.u === 4 ? '#f43f5e' : '#38bdf8'} strokeWidth={div.u === 4 ? 2.5 : 1.5} />
                      <text x="32" y={div.y + 3} textAnchor="end" fill={div.u === 4 ? '#fb7185' : '#94a3b8'} fontSize="9" fontFamily="monospace">
                        {div.u}
                      </text>
                      <text x="180" y={div.y - 3} fill={div.u === 4 ? '#fb7185' : '#64748b'} fontSize="8" fontFamily="monospace">
                        {div.text}
                      </text>
                    </g>
                  ))}
                </svg>
                <span className="text-[10px] text-studio-400 mt-2 font-mono">Figure 1.1: Academic 8-Head Proportional Ruler</span>
              </div>

              {/* Explanatory Text */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">The 8-Head Ideal Canon</h3>
                  <p className="text-studio-300">
                    Established by the classical masters and codified by Andrew Loomis, using the vertical height of the head as the fundamental unit of measurement is the golden standard for life drawing.
                  </p>
                </div>

                <div className="space-y-2 bg-studio-850 p-3 rounded-xl border border-studio-800">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Unit 4 is the Golden Midpoint:</strong> The pubic arch (crotch) perfectly bisects the standing figure into two equal halves (head-to-crotch = crotch-to-feet).
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Navel & Elbows Align:</strong> At Unit 3, the bent elbow crease sits level with the navel.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Fingertips Reach Mid-Thigh:</strong> At Unit 5, relaxed fingertips terminate halfway down the femur.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Real Life vs. Ideal vs. Heroic:</strong> Natural everyday people measure ~7.5 heads; classical academic models measure 8 heads; superhero and fashion illustrations extend to 8.5–9 heads for grace and authority.
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-studio-400 bg-studio-950 p-2.5 rounded-lg border border-studio-800">
                  <span className="text-brand-accent font-semibold">FormMaster Automation:</span> When you toggle the <span className="text-white font-mono">8-Head Ruler</span> button, FormMaster calculates the bounding height from the cranium to the ground plane, computing proportional divisions dynamically regardless of figure pose or scale.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'loomis' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Illustrated Diagram */}
              <div className="bg-studio-950 p-4 rounded-xl border border-studio-800 flex flex-col items-center justify-center">
                <svg viewBox="0 0 260 260" className="w-full max-w-[220px] h-auto">
                  {/* Sphere of Cranium */}
                  <circle cx="130" cy="115" r="70" fill="#0284c7" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="2.5" />
                  
                  {/* Sliced Side Plane Oval */}
                  <ellipse cx="100" cy="115" rx="32" ry="48" fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 2" />
                  
                  {/* Cross on Side Plane (Ear axis) */}
                  <line x1="100" y1="70" x2="100" y2="160" stroke="#f43f5e" strokeWidth="1.5" />
                  <line x1="70" y1="115" x2="130" y2="115" stroke="#f43f5e" strokeWidth="1.5" />
                  <circle cx="100" cy="120" r="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
                  
                  {/* Facial Thirds Horizontal Guides */}
                  {/* 1. Hairline */}
                  <line x1="100" y1="65" x2="200" y2="65" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="2 2" />
                  <text x="205" y="68" fill="#c4b5fd" fontSize="8" fontFamily="monospace">Hairline</text>

                  {/* 2. Brow line */}
                  <line x1="100" y1="115" x2="200" y2="115" stroke="#38bdf8" strokeWidth="2" />
                  <text x="205" y="118" fill="#38bdf8" fontSize="8" fontFamily="monospace">Brow Line</text>

                  {/* 3. Nose base */}
                  <line x1="100" y1="165" x2="200" y2="165" stroke="#38bdf8" strokeWidth="2" />
                  <text x="205" y="168" fill="#38bdf8" fontSize="8" fontFamily="monospace">Nose Base</text>

                  {/* 4. Chin */}
                  <line x1="90" y1="215" x2="200" y2="215" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="2 2" />
                  <text x="205" y="218" fill="#c4b5fd" fontSize="8" fontFamily="monospace">Chin</text>

                  {/* Jaw Plane Line */}
                  <path d="M 100 160 L 145 215 L 175 215 L 185 165" fill="none" stroke="#38bdf8" strokeWidth="2" />
                </svg>
                <span className="text-[10px] text-studio-400 mt-2 font-mono">Figure 1.2: Andrew Loomis Cranial Ball & Facial Thirds</span>
              </div>

              {/* Explanatory Text */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">The Loomis Head & Facial Thirds</h3>
                  <p className="text-studio-300">
                    Andrew Loomis revolutionized head drawing by demonstrating that the cranium is an almost perfect ball flattened on both sides by slices at the temporal bones.
                  </p>
                </div>

                <div className="space-y-2 bg-studio-850 p-3 rounded-xl border border-studio-800">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Ball Sliced at the Sides:</strong> Slicing ~1/6th off both sides of the cranium ball defines the temporal plane oval, whose vertical axis anchors the ear canal.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Rule of Facial Thirds:</strong> The face is partitioned into three identical intervals:
                      <ul className="list-disc list-inside mt-1 text-studio-400 pl-1 space-y-0.5">
                        <li>Hairline to Brow Line</li>
                        <li>Brow Line to Base of Nose</li>
                        <li>Base of Nose to Bottom of Chin</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Perspective Tilt:</strong> When the head tilts up or down, the brow and nose lines curve along the sphere's contour like latitude rings on a globe.
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-studio-400 bg-studio-950 p-2.5 rounded-lg border border-studio-800">
                  <span className="text-sky-400 font-semibold">FormMaster Automation:</span> When you select <span className="text-white font-mono">Loomis</span> style, the detector fits the 2/3 cranium sphere, constructs the temporal oval based on head yaw/pitch, and generates the brow and nose base guide planes across the face.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'bridgman' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Illustrated Diagram */}
              <div className="bg-studio-950 p-4 rounded-xl border border-studio-800 flex flex-col items-center justify-center">
                <svg viewBox="0 0 260 280" className="w-full max-w-[220px] h-auto">
                  {/* Ribcage Box (tilted back) */}
                  <polygon points="60,40 180,30 200,110 80,125" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2.5" />
                  <polygon points="180,30 210,50 225,125 200,110" fill="#d97706" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="2" />
                  <text x="130" y="80" textAnchor="middle" fill="#fde68a" fontSize="10" fontFamily="sans-serif" fontWeight="bold">Thorax Block</text>

                  {/* Waist Wedge (Mortise Interlock) */}
                  <path d="M 80 125 Q 65 155 75 180 L 195 160 Q 215 135 200 110 Z" fill="#ec4899" fillOpacity="0.15" stroke="#ec4899" strokeWidth="2" strokeDasharray="3 2" />
                  {/* Arrows showing stretch and compression */}
                  <text x="50" y="155" fill="#f43f5e" fontSize="9" fontWeight="bold">Stretch</text>
                  <text x="210" y="145" fill="#38bdf8" fontSize="9" fontWeight="bold">Compress</text>

                  {/* Pelvis Block (tilted forward) */}
                  <polygon points="75,180 195,160 210,240 90,255" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="2.5" />
                  <polygon points="195,160 225,180 235,255 210,240" fill="#059669" fillOpacity="0.3" stroke="#10b981" strokeWidth="2" />
                  <text x="145" y="215" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontFamily="sans-serif" fontWeight="bold">Pelvis Block</text>
                </svg>
                <span className="text-[10px] text-studio-400 mt-2 font-mono">Figure 1.3: George Bridgman Interlocking Masses & Waist Mortise</span>
              </div>

              {/* Explanatory Text */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Bridgman’s Interlocking Masses</h3>
                  <p className="text-studio-300">
                    George Bridgman, legendary anatomy instructor at the Art Students League of New York, taught that the human body is an architectural system of interlocking solid blocks.
                  </p>
                </div>

                <div className="space-y-2 bg-studio-850 p-3 rounded-xl border border-studio-800">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Three Major Solid Masses:</strong> The Head, the Thorax (ribcage), and the Pelvis are rigid skeletal boxes that never bend internally.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">The Waist Mortise (Wedging):</strong> All bending, twisting, and tilting occurs in the flexible waist wedge between the thorax and pelvis. When one side stretches, the opposite side compresses into creases.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Contrapposto Opposition:</strong> In dynamic poses, the tilt of the shoulders opposes the tilt of the hips, creating dynamic balance and weight distribution.
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-studio-400 bg-studio-950 p-2.5 rounded-lg border border-studio-800">
                  <span className="text-amber-400 font-semibold">FormMaster Automation:</span> When you select <span className="text-white font-mono">Bridgman</span> style, the torso separates into distinct ribcage and pelvis blocks with mortise wedges showing abdominal extension and compression.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'hampton' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Illustrated Diagram */}
              <div className="bg-studio-950 p-4 rounded-xl border border-studio-800 flex flex-col items-center justify-center">
                <svg viewBox="0 0 260 280" className="w-full max-w-[220px] h-auto">
                  {/* Dynamic Line of Action S-curve */}
                  <path d="M 130 30 Q 170 100 120 160 T 135 250" fill="none" stroke="#f43f5e" strokeWidth="3.5" />
                  <text x="175" y="110" fill="#fb7185" fontSize="9" fontWeight="bold">Line of Action</text>

                  {/* Clavicle-to-deltoid flow path */}
                  <path d="M 80 80 Q 130 65 180 80 Q 210 105 200 135" fill="none" stroke="#a78bfa" strokeWidth="2.5" />
                  <text x="180" y="60" fill="#c4b5fd" fontSize="8" fontWeight="bold">Shoulder Rhythm</text>

                  {/* Cylinder with cross-contour rings */}
                  <g transform="translate(60, 110) rotate(-15)">
                    <rect x="0" y="0" width="36" height="85" rx="10" fill="#38bdf8" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="2" />
                    {/* Cross-contour ellipses showing 3D orientation */}
                    <ellipse cx="18" cy="20" rx="18" ry="7" fill="none" stroke="#fbbf24" strokeWidth="2" />
                    <ellipse cx="18" cy="45" rx="18" ry="7" fill="none" stroke="#fbbf24" strokeWidth="2" />
                    <ellipse cx="18" cy="70" rx="18" ry="7" fill="none" stroke="#fbbf24" strokeWidth="2" />
                  </g>
                  <text x="25" y="195" fill="#fde68a" fontSize="8" fontWeight="bold">Cross-Contours (3D)</text>
                </svg>
                <span className="text-[10px] text-studio-400 mt-2 font-mono">Figure 1.4: Michael Hampton Gesture Flow & Cylindrical Cross-Contours</span>
              </div>

              {/* Explanatory Text */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Michael Hampton’s Gesture & Flow</h3>
                  <p className="text-studio-300">
                    Michael Hampton (author of <em>Figure Drawing: Design and Invention</em>) emphasizes rhythm, gesture lines, and wrapping cross-contours before adding superficial muscle contours.
                  </p>
                </div>

                <div className="space-y-2 bg-studio-850 p-3 rounded-xl border border-studio-800">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Gesture Precedes Form:</strong> Never draw static outlines. Establish the unified spine "Line of Action" that captures the energy, balance, and trajectory of the pose.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">S-Curves & Tapered Cylinders:</strong> Human limbs are never straight pipes; they are tapered cylinders connected by sweeping rhythm paths (e.g. clavicle sweeps continuously into the deltoid and bicep).
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Cross-Contours Reveal 3D Space:</strong> Elliptical wrapping lines immediately communicate to the viewer whether a limb is pointing towards the camera or receding away.
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-studio-400 bg-studio-950 p-2.5 rounded-lg border border-studio-800">
                  <span className="text-rose-400 font-semibold">FormMaster Automation:</span> When you select <span className="text-white font-mono">Hampton</span> style, FormMaster accentuates the gesture spine, deltoid flow paths, and limb wrapping cross-contours computed from depth-Z.
                </p>
              </div>
            </div>
          )}

          {/* BrokenDraw / Tieran Tab (25 Drawing Exercises: 3 Big Boxes) */}
          {activeTab === 'brokendraw' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Illustrated Diagram */}
              <div className="bg-studio-950 p-4 rounded-xl border border-studio-800 flex flex-col items-center justify-center">
                <svg viewBox="0 0 280 320" className="w-full max-w-[260px] h-auto text-studio-400">
                  {/* Horizon line */}
                  <line x1="10" y1="160" x2="270" y2="160" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="15" y="155" fill="#64748b" fontSize="7" fontFamily="monospace">HORIZON (EYE LEVEL)</text>

                  {/* 1. Cranium Perspective Box */}
                  <g transform="translate(100, 20)">
                    {/* Front face */}
                    <polygon points="20,10 60,10 60,55 20,55" fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="1.8" />
                    {/* Side face */}
                    <polygon points="60,10 80,0 80,45 60,55" fill="#818cf8" fillOpacity="0.25" stroke="#818cf8" strokeWidth="1.8" />
                    {/* Top face */}
                    <polygon points="20,10 40,0 80,0 60,10" fill="#c084fc" fillOpacity="0.3" stroke="#c084fc" strokeWidth="1.8" />
                    {/* Ear circle centered on side plane */}
                    <ellipse cx="70" cy="25" rx="5" ry="7" fill="#fbbf24" fillOpacity="0.8" stroke="#ffffff" strokeWidth="1" />
                    {/* Cross line on front face */}
                    <line x1="20" y1="32" x2="60" y2="32" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="40" y1="10" x2="40" y2="55" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                  </g>
                  <text x="185" y="45" fill="#fbbf24" fontSize="8" fontWeight="bold">Ear in Center of Side Plane</text>
                  <line x1="182" y1="45" x2="173" y2="45" stroke="#fbbf24" strokeWidth="1" />

                  {/* Neck column */}
                  <line x1="130" y1="75" x2="130" y2="92" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="3 2" />

                  {/* 2. Thorax (Ribcage) Box */}
                  <g transform="translate(85, 92)">
                    {/* Front face */}
                    <polygon points="15,10 75,10 70,85 20,85" fill="#0284c7" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="2" />
                    {/* Side face */}
                    <polygon points="75,10 102,0 95,75 70,85" fill="#6366f1" fillOpacity="0.28" stroke="#818cf8" strokeWidth="2" />
                    {/* Top plane */}
                    <polygon points="15,10 42,0 102,0 75,10" fill="#a855f7" fillOpacity="0.25" stroke="#c084fc" strokeWidth="1.5" />
                    
                    {/* Sternum "Tie Shape" landmark */}
                    <polygon points="45,15 48,15 50,45 45,55 40,45 42,15" fill="#f59e0b" fillOpacity="0.75" stroke="#fbbf24" strokeWidth="1.5" />
                    <text x="40" y="35" fill="#ffffff" fontSize="6" fontWeight="bold">TIE</text>
                    {/* Infrasternal rib arch */}
                    <path d="M 30 80 Q 45 60 60 80" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
                  </g>
                  <text x="5" y="125" fill="#f59e0b" fontSize="8" fontWeight="bold">Sternum "Tie Shape"</text>
                  <line x1="75" y1="123" x2="128" y2="123" stroke="#f59e0b" strokeWidth="1" />

                  {/* Waist column */}
                  <line x1="130" y1="177" x2="130" y2="195" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="3 2" />

                  {/* 3. Pelvis Box */}
                  <g transform="translate(88, 195)">
                    {/* Front face */}
                    <polygon points="18,5 72,5 65,65 25,65" fill="#3b82f6" fillOpacity="0.2" stroke="#60a5fa" strokeWidth="2" />
                    {/* Side face */}
                    <polygon points="72,5 98,-5 90,55 65,65" fill="#4f46e5" fillOpacity="0.28" stroke="#818cf8" strokeWidth="2" />
                    {/* Top plane */}
                    <polygon points="18,5 44,-5 98,-5 72,5" fill="#9333ea" fillOpacity="0.25" stroke="#c084fc" strokeWidth="1.5" />
                    
                    {/* Sacral Inverted Triangle landmark */}
                    <polygon points="40,10 50,10 45,28" fill="#f43f5e" fillOpacity="0.8" stroke="#fb7185" strokeWidth="1.5" />
                    {/* Pubic arch */}
                    <path d="M 33 60 Q 45 45 57 60" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="2 2" />
                  </g>
                  <text x="5" y="225" fill="#fb7185" fontSize="8" fontWeight="bold">Sacral Triangle</text>
                  <line x1="68" y1="223" x2="125" y2="215" stroke="#fb7185" strokeWidth="1" />

                  {/* Limbs indicated as boxes */}
                  <rect x="55" y="105" width="22" height="60" rx="3" fill="#a855f7" fillOpacity="0.15" stroke="#c084fc" strokeWidth="1.2" transform="rotate(8 55 105)" />
                  <rect x="195" y="105" width="22" height="60" rx="3" fill="#a855f7" fillOpacity="0.15" stroke="#c084fc" strokeWidth="1.2" transform="rotate(-8 195 105)" />
                  <rect x="95" y="262" width="25" height="52" rx="3" fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="1.2" />
                  <rect x="150" y="262" width="25" height="52" rx="3" fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="1.2" />
                </svg>
                <span className="text-[10px] text-studio-400 mt-2 font-mono">Figure 1.5: BrokenDraw Level 4 Box Figures & Vital Landmarks</span>
              </div>

              {/* Explanatory Text */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">BrokenDraw: 25 Drawing Exercises</h3>
                  <p className="text-studio-300">
                    BrokenDraw (Tieran), inspired by Kim Jung Gi and Dynamic Sketching, stresses that to draw figures freely from imagination without reference, you must master <strong>Level 4: Box Figures</strong>.
                  </p>
                </div>

                <div className="space-y-2 bg-studio-850 p-3 rounded-xl border border-studio-800">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">3 Foundational Masses into 3 Big Boxes:</strong> The human figure consists of three solid masses (Skull, Ribcage, Pelvis) connected by flexible columns (Neck, Waist). Converting these 3 masses into simple perspective boxes eliminates anatomical overwhelm and establishes immediate 3D spatial depth.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">The Ear is Center of the Skull Side-Plane:</strong> On the cranial box, finding the intersection of diagonals on the side plane pinpoints exactly where the ear sits, which also anchors the jaw hinge and neck connection.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">The Sternum Tie & Sacral Triangle:</strong> On the front of the ribcage box, draw the sternum like a necktie to place pecs and collarbones. On the pelvis, the sacral triangle anchors the gluteal crease and spine origin.
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-studio-400 bg-studio-950 p-2.5 rounded-lg border border-studio-800">
                  <span className="text-purple-400 font-semibold">FormMaster Automation:</span> Selecting <span className="text-white font-mono">BrokenDraw</span> style constructs 3 distinct perspective boxes for cranium, thorax, and pelvis with automated side-plane ear landmark, sternum tie, and sacral triangle orientation.
                </p>
              </div>
            </div>
          )}

          {/* Ryan Woodward Tab (Gesture Drawing & Conté Crayon Rhythms) */}
          {activeTab === 'woodward' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Illustrated Diagram */}
              <div className="bg-studio-950 p-4 rounded-xl border border-studio-800 flex flex-col items-center justify-center">
                <svg viewBox="0 0 280 320" className="w-full max-w-[260px] h-auto text-studio-400">
                  {/* Shaded Conté Crayon Mass Block-in in background */}
                  <path d="M 125 40 Q 155 70 145 130 Q 135 180 160 250" fill="none" stroke="#451a1a" strokeWidth="24" strokeLinecap="round" opacity="0.6" />

                  {/* Primary Head-to-Supporting-Ankle Conté Line */}
                  <path
                    d="M 135 25 Q 110 70 135 120 Q 160 170 135 210 Q 120 250 125 295"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  <text x="145" y="295" fill="#f87171" fontSize="9" fontWeight="bold">Supporting Ankle Contact</text>

                  {/* Counter-Rhythm Shoulder-to-Opposite-Hip */}
                  <path
                    d="M 85 85 Q 130 110 165 175"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3"
                    strokeDasharray="4 3"
                  />
                  <text x="12" y="80" fill="#fb923c" fontSize="8" fontWeight="bold">Cross-Torso Contrapposto</text>
                  <line x1="75" y1="83" x2="85" y2="85" stroke="#fb923c" strokeWidth="1" />

                  {/* Clavicle-to-Palm Sweeping Arm Vector */}
                  <path
                    d="M 130 75 Q 185 85 240 60"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <text x="175" y="50" fill="#fde68a" fontSize="8" fontWeight="bold">Clavicle-to-Palm Vector</text>

                  {/* Non-weight bearing free leg rhythm */}
                  <path
                    d="M 145 200 Q 185 230 195 270"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeDasharray="3 3"
                    opacity="0.8"
                  />

                  {/* Cranium gesture bead */}
                  <ellipse cx="135" cy="35" rx="14" ry="18" fill="#7f1d1d" fillOpacity="0.4" stroke="#ef4444" strokeWidth="2" />
                  
                  {/* Ground Line */}
                  <line x1="30" y1="300" x2="250" y2="300" stroke="#64748b" strokeWidth="1.5" />
                </svg>
                <span className="text-[10px] text-studio-400 mt-2 font-mono">Figure 1.6: Ryan Woodward Conté Rhythm Line & Gravity Trajectory</span>
              </div>

              {/* Explanatory Text */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Ryan Woodward: Gesture Drawing</h3>
                  <p className="text-studio-300">
                    Ryan Woodward (<em>Gesture Drawing: The Unreachable Goal</em> & <em>Conte Drawing</em>) teaches that great draftsmanship stems from capturing raw movement, emotion, and kinetic trajectory within 1 to 2 minutes using bold Conté crayon strokes.
                  </p>
                </div>

                <div className="space-y-2 bg-studio-850 p-3 rounded-xl border border-studio-800">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Head-to-Supporting-Ankle Trajectory:</strong> Instead of drawing body outlines, find the dominant gravitational sweep that travels uninterrupted from the crown of the head through the spine and directly anchors down into the weight-bearing ankle.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">The Three Exaggerations:</strong>
                      <ul className="list-disc list-inside mt-1 text-studio-300 space-y-0.5">
                        <li><strong>Gesture Exaggeration:</strong> Push the curve beyond reality to inject dynamic life.</li>
                        <li><strong>Proportional Exaggeration:</strong> Contrast compressed forms against elongated limbs.</li>
                        <li><strong>Style Exaggeration:</strong> Crisp thrust lines juxtaposed against soft core shadows.</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Broad Edge & Point:</strong> Woodward draws with the broad edge of the Conté crayon for fast mass tone, then sharpens focal beats with the point.
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-studio-400 bg-studio-950 p-2.5 rounded-lg border border-studio-800">
                  <span className="text-rose-400 font-semibold">FormMaster Automation:</span> Selecting <span className="text-white font-mono">Woodward</span> style renders the bold 4.5px red Conté rhythm line linking head to weight-bearing ankle, alongside transverse contrapposto flow paths.
                </p>
              </div>
            </div>
          )}

          {/* Ron Tiner Tab (Figure Without a Model: Action & Gravity Balance) */}
          {activeTab === 'tiner' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Illustrated Diagram */}
              <div className="bg-studio-950 p-4 rounded-xl border border-studio-800 flex flex-col items-center justify-center">
                <svg viewBox="0 0 280 320" className="w-full max-w-[260px] h-auto text-studio-400">
                  {/* Ground line */}
                  <line x1="20" y1="290" x2="260" y2="290" stroke="#334155" strokeWidth="2" />

                  {/* Base of Support Bracket on Ground */}
                  <line x1="90" y1="290" x2="190" y2="290" stroke="#10b981" strokeWidth="3.5" />
                  <line x1="90" y1="284" x2="90" y2="296" stroke="#10b981" strokeWidth="2" />
                  <line x1="190" y1="284" x2="190" y2="296" stroke="#10b981" strokeWidth="2" />
                  <rect x="95" y="298" width="90" height="15" rx="3" fill="#0f172a" stroke="#059669" strokeWidth="1" />
                  <text x="100" y="309" fill="#34d399" fontSize="7" fontFamily="monospace">BASE OF SUPPORT</text>

                  {/* Figure silhouette & masses */}
                  {/* Head */}
                  <ellipse cx="138" cy="40" rx="14" ry="18" fill="#38bdf8" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="1.5" />
                  
                  {/* Suprasternal Notch Marker */}
                  <circle cx="138" cy="72" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                  <rect x="25" y="62" width="105" height="18" rx="3" fill="#0f172a" stroke="#d97706" strokeWidth="1" />
                  <text x="29" y="74" fill="#fbbf24" fontSize="7" fontFamily="monospace">SUPRASTERNAL NOTCH</text>
                  <line x1="130" y1="72" x2="133" y2="72" stroke="#f59e0b" strokeWidth="1" />

                  {/* Gravitational Vertical Plumb Line */}
                  <line x1="138" y1="72" x2="138" y2="290" stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 3" />
                  
                  {/* Plumb Bob Weight at bottom */}
                  <circle cx="138" cy="290" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                  <polygon points="134,290 142,290 138,295" fill="#10b981" />

                  {/* Reciprocal Shoulder Tilt Line */}
                  <line x1="80" y1="85" x2="195" y2="98" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                  <text x="198" y="98" fill="#38bdf8" fontSize="8" fontWeight="bold">Shoulders: -6°</text>

                  {/* Reciprocal Pelvic Tilt Line (Opposing Slope!) */}
                  <line x1="90" y1="180" x2="185" y2="165" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />
                  <text x="188" y="168" fill="#fb7185" fontSize="8" fontWeight="bold">Pelvis: +8°</text>

                  {/* Weight-bearing right leg (solid pillar directly under hip) */}
                  <path d="M 165 170 L 160 225 L 165 285" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <text x="175" y="240" fill="#94a3b8" fontSize="7">Weight-Bearing</text>

                  {/* Free relaxed leg */}
                  <path d="M 110 180 Q 95 230 110 285" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="3 3" />
                  <text x="65" y="240" fill="#64748b" fontSize="7">Free / Relaxed</text>

                  {/* Balance Result Badge */}
                  <rect x="35" y="15" width="210" height="20" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
                  <text x="42" y="29" fill="#34d399" fontSize="9" fontWeight="bold" fontFamily="monospace">⚖️ STATIC BALANCE: Plumb in Base</text>
                </svg>
                <span className="text-[10px] text-studio-400 mt-2 font-mono">Figure 1.7: Ron Tiner Center of Gravity Plumb Line & Reciprocal Axes</span>
              </div>

              {/* Explanatory Text */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Ron Tiner: Figure Drawing Without a Model</h3>
                  <p className="text-studio-300">
                    In Chapter 4 (<em>The Figure in Action</em>), Ron Tiner details the inviolable laws of earthly gravity and bodily equilibrium that allow artists to draw authentic poses from memory and imagination.
                  </p>
                </div>

                <div className="space-y-2 bg-studio-850 p-3 rounded-xl border border-studio-800">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">The Suprasternal Notch Plumb Line:</strong> Drop an imaginary vertical line straight down from the hollow pit between the collarbones (the suprasternal notch). In any standing figure at rest, this plumb line must fall within the <strong>Base of Support</strong> bounded by the feet.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Reciprocal Counterpoise (Contrapposto):</strong> When weight shifts to one leg, that hip tilts UP to support the weight. To prevent the torso and head from toppling over, the shoulders must tilt DOWN on that same side. The shoulder and pelvic axes always slope in opposite directions.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Controlled Imbalance in Action:</strong> In walking, sprinting, lunging, or throwing, the center of gravity is deliberately thrown <em>outside</em> the base of support. Action poses are depictions of controlled falling arrested by the next foot contact!
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-studio-400 bg-studio-950 p-2.5 rounded-lg border border-studio-800">
                  <span className="text-emerald-400 font-semibold">FormMaster Automation:</span> Toggle the <span className="text-white font-mono">Plumb Line</span> button to display the live gravitational plumb line from suprasternal notch to ground base of support, and view live reciprocal contrapposto angles.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-studio-800 bg-studio-850 flex items-center justify-between text-xs text-studio-400">
          <div>
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-studio-800 border border-studio-700 text-studio-300 font-mono text-[10px]">Esc</kbd> anytime to close.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition shadow-sm"
          >
            Done Studying
          </button>
        </div>
      </div>
    </div>
  );
};
