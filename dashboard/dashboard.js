/**
 * NeuroSleep Digital Twin Platform - Dashboard Controller (dashboard.js)
 * Implements the React dashboard, timeline manager, live chart views, AI logging, and Demo auto-pilot mode.
 */

const { useState, useEffect, useRef } = React;

function NeuroSleepDashboard() {
  // Global Simulation State
  const [hours, setHours] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState(0); // 0 to 1
  const [simulationSpeed, setSimulationSpeed] = useState(1); // multiplier
  const [isMuted, setIsMuted] = useState(true);
  const [activeTab, setActiveTab] = useState('simulation'); // 'simulation' | 'academic'
  const [selectedNode, setSelectedNode] = useState(null);
  const [view3d, setView3d] = useState(true); // true for Three.js, false for Cytoscape
  
  // Dashboard Metrics (Calculated from simulation engine)
  const [cellular, setCellular] = useState({ atp: 100, ros: 10, sleepFactor: 5, oxidativeStress: 0 });
  const [network, setNetwork] = useState({ clusteringCoefficient: 0.65, averagePathLength: 2.1, connectivityScore: 100, stabilityScore: 100, efficiencyScore: 100, cognitiveDecline: 0, severityIndex: 0 });
  const [neuronSpikes, setNeuronSpikes] = useState([]);
  const [forecast, setForecast] = useState([]);
  
  // AI Diagnostics Log
  const [aiLogs, setAiLogs] = useState([
    { id: 1, time: '00:00', type: 'info', msg: 'NeuroSleep Digital Twin Platform online. Calibrating baseline metabolic rates...' },
    { id: 2, time: '00:01', type: 'success', msg: 'Initial cellular ATP: 100%, ROS: 10%. Synaptic connectivity: Optimal.' }
  ]);

  // Demo / Presentation Mode State
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoCaption, setDemoCaption] = useState('');

  // Refs for 3D and Cytoscape canvases
  const brain3dContainerRef = useRef(null);
  const networkContainerRef = useRef(null);
  const oscIntervalRef = useRef(null);
  const logContainerRef = useRef(null);

  // Define Demo Script Phases
  const DEMO_SCRIPT = [
    {
      caption: "Welcome to the NeuroSleep Digital Twin Platform. We begin with a healthy brain in a fully rested state. Notice the strong cyan connections and stable neural pathways.",
      targetHours: 0,
      recovery: 0,
      duration: 5000,
      highlight: "brain-view"
    },
    {
      caption: "Entering Phase 2: Sleep Deprivation begins. ATP levels drop as mitochondrial efficiency decays, while Reactive Oxygen Species (ROS) accumulate inside cells.",
      targetHours: 24,
      recovery: 0,
      duration: 6000,
      highlight: "vcell-engine"
    },
    {
      caption: "Phase 3: Electrophysiological decay. Reduced ATP disrupts the Na+/K+ pump, causing irregular Hodgkin-Huxley membrane spikes and firing instability.",
      targetHours: 48,
      recovery: 0,
      duration: 7000,
      highlight: "neuron-engine"
    },
    {
      caption: "Phase 4: Connectome Collapse. Under 72+ hours of sleep debt, synaptic pathways weaken. We observe structural broken edges in Cytoscape and cognitive decline index exceeding 75%.",
      targetHours: 72,
      recovery: 0,
      duration: 8000,
      highlight: "connectome-engine"
    },
    {
      caption: "Phase 5: Sleep Recovery engaged. ATP restores, ROS clears, and homeostatic mechanisms rebuild synaptic weights, demonstrating the brain's neuroplastic repair curve.",
      targetHours: 72,
      recovery: 1,
      duration: 7000,
      highlight: "recovery-panel"
    }
  ];

  // 1. Sync simulation outputs when state (hours, recovery) changes
  useEffect(() => {
    const recFraction = isRecoveryMode ? recoveryProgress : 0;
    const cellStress = window.NeuroSimulation.getCellularStress(hours, recFraction);
    const netMetrics = window.NeuroSimulation.getNetworkMetrics(hours, recFraction);
    const spikes = window.NeuroSimulation.generateNeuronSpikes(hours, recFraction, 100, 0.2);
    const fc = window.NeuroSimulation.generateForecast(hours, recFraction);

    setCellular(cellStress);
    setNetwork(netMetrics);
    setNeuronSpikes(spikes);
    setForecast(fc);

    // Sync WebGL Brain
    if (window.NeuroBrain3D) {
      window.NeuroBrain3D.updateVisuals(netMetrics.severityIndex);
    }
    
    // Sync Cytoscape Network
    if (window.NeuroNetwork) {
      window.NeuroNetwork.updateNetwork(netMetrics.severityIndex);
    }

    // Sync Audio Synthesizer
    if (window.NeuroSound) {
      window.NeuroSound.updateState(netMetrics.severityIndex);
    }

    // Generate AI Logs based on thresholds
    triggerLogs(hours, cellStress, netMetrics, isRecoveryMode);

  }, [hours, isRecoveryMode, recoveryProgress]);

  // 2. Continuous time simulation loop
  useEffect(() => {
    let intervalId = null;
    if (isPlaying && !isDemoMode) {
      intervalId = setInterval(() => {
        if (isRecoveryMode) {
          setRecoveryProgress(prev => {
            if (prev >= 1) {
              setIsPlaying(false);
              addLog('success', 'Recovery simulation complete. Cellular and network homeostasis restored.');
              return 1;
            }
            return prev + 0.02 * simulationSpeed;
          });
        } else {
          setHours(prev => {
            if (prev >= 100) {
              setIsPlaying(false);
              return 100;
            }
            return prev + 0.5 * simulationSpeed;
          });
        }
      }, 100);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, isRecoveryMode, simulationSpeed, isDemoMode]);

  // 3. Demo / Presentation Mode Loop
  useEffect(() => {
    let demoTimeout = null;
    if (isDemoMode) {
      const stepData = DEMO_SCRIPT[demoStep];
      setDemoCaption(stepData.caption);
      
      // Auto adjust dashboard parameters to match script
      if (stepData.recovery > 0) {
        setIsRecoveryMode(true);
        setHours(72);
        // Animate recovery progress smoothly
        let progress = 0;
        const recInterval = setInterval(() => {
          progress += 0.05;
          if (progress >= 1) {
            setRecoveryProgress(1);
            clearInterval(recInterval);
          } else {
            setRecoveryProgress(progress);
          }
        }, 150);
        
        setTimeout(() => clearInterval(recInterval), stepData.duration);
      } else {
        setIsRecoveryMode(false);
        setRecoveryProgress(0);
        
        // Animate hours transition
        const startH = hours;
        const targetH = stepData.targetHours;
        const diff = targetH - startH;
        let elapsed = 0;
        const animInterval = setInterval(() => {
          elapsed += 100;
          const ratio = Math.min(1, elapsed / 2000);
          setHours(startH + diff * ratio);
          if (ratio >= 1) clearInterval(animInterval);
        }, 50);
      }

      // Play alert sounds based on step severity
      if (stepData.targetHours >= 48 && stepData.recovery === 0 && window.NeuroSound) {
        window.NeuroSound.playWarning();
      } else if (stepData.recovery > 0 && window.NeuroSound) {
        window.NeuroSound.playRepair();
      }

      // Next step schedule
      demoTimeout = setTimeout(() => {
        setDemoStep(prev => (prev + 1) % DEMO_SCRIPT.length);
      }, stepData.duration);
    }

    return () => {
      clearTimeout(demoTimeout);
    };
  }, [isDemoMode, demoStep]);

  // 4. Initialize Canvases (Three.js and Cytoscape.js)
  useEffect(() => {
    // Init Three.js
    if (view3d && brain3dContainerRef.current) {
      window.NeuroBrain3D.init(brain3dContainerRef.current);
    }
    
    // Init Cytoscape
    if (!view3d && networkContainerRef.current) {
      window.NeuroNetwork.init(networkContainerRef.current, (node) => {
        setSelectedNode(node);
        addLog('info', `Electrophysiological query executed on region: ${node.label}`);
        if (window.NeuroSound) window.NeuroSound.playClick();
      });
    }

    return () => {
      window.NeuroBrain3D.destroy();
      window.NeuroNetwork.destroy();
    };
  }, [view3d, activeTab]);

  // Trigger sound feedback when elements change
  const handleBtnClick = () => {
    if (window.NeuroSound) window.NeuroSound.playClick();
  };

  // Sound Context trigger
  const handleSoundToggle = () => {
    if (window.NeuroSound) {
      const muted = window.NeuroSound.toggleMute();
      setIsMuted(muted);
    }
  };

  // Helper log engine
  function addLog(type, msg) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAiLogs(prev => [
      ...prev,
      { id: Date.now(), time: timeStr, type, msg }
    ]);
  }

  // Generate logs on specific simulation bounds
  const loggedThresholds = useRef({});
  function triggerLogs(h, cell, net, rec) {
    const hourInt = Math.floor(h);
    
    if (rec) {
      if (!loggedThresholds.current['rec_engaged']) {
        addLog('info', 'Mitochondrial recovery cycle initialized. Commencing ATP restoration.');
        loggedThresholds.current = { 'rec_engaged': true }; // reset thresholds
      }
      return;
    }

    if (hourInt === 0 && !loggedThresholds.current['h0']) {
      addLog('success', 'Homeostatic cellular kinetics calibrated. Firing stability: Nominal.');
      loggedThresholds.current['h0'] = true;
    } else if (hourInt >= 24 && hourInt < 48 && !loggedThresholds.current['h24']) {
      addLog('warn', 'Alert: 24h Sleep Deprivation threshold breached. ROS concentration climbing.');
      loggedThresholds.current['h24'] = true;
    } else if (hourInt >= 48 && hourInt < 72 && !loggedThresholds.current['h48']) {
      addLog('danger', 'Critical: 48h sleep debt. Neural firing irregularity detected in cortical cells.');
      loggedThresholds.current['h48'] = true;
    } else if (hourInt >= 72 && !loggedThresholds.current['h72']) {
      addLog('danger', 'ALERT: 72h connectome decay. Cytoscape registers synaptic disconnection events.');
      loggedThresholds.current['h72'] = true;
    }
  }

  // Scroll logging panel to bottom automatically
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [aiLogs]);

  // Export current simulation parameters as CSV
  const handleCSVExport = () => {
    handleBtnClick();
    const state = {
      hours,
      atp: cellular.atp,
      ros: cellular.ros,
      oxidative: cellular.oxidativeStress,
      sleepFactor: cellular.sleepFactor,
      connectivity: network.connectivityScore,
      stability: network.stabilityScore,
      efficiency: network.efficiencyScore,
      decline: network.cognitiveDecline
    };
    const csvData = window.NeuroAcademic.exportCSV(state);
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `NeuroSleep_DigitalTwin_Simulation_Data_${Math.floor(hours)}h.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // IEEE Paper Context Generator
  const ieeeData = window.NeuroAcademic.generateIEEEPaperContent({
    hours: Math.floor(hours),
    atp: cellular.atp,
    ros: cellular.ros,
    oxidative: cellular.oxidativeStress,
    connectivity: network.connectivityScore,
    decline: network.cognitiveDecline
  });

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-[#00f0ff] selection:text-[#0a0f1d]">
      
      {/* GLOWING AMBIENT BACKGROUNDS */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vh] rounded-full bg-[#00f0ff]/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vh] rounded-full bg-[#ff007f]/5 blur-[150px] pointer-events-none"></div>

      {/* TOP HEADER STATUS HUB */}
      <header className="border-b border-[#00f0ff]/20 bg-slate-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full border-2 border-[#00f0ff] flex items-center justify-center animate-pulse">
              <span className="text-[#00f0ff] font-bold text-xs font-mono">NS</span>
            </div>
            <div className="absolute inset-0 rounded-full bg-[#00f0ff]/30 blur-sm"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#00f0ff] via-sky-400 to-[#a855f7] font-mono">
              NEUROSLEEP DIGITAL TWIN PLATFORM
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">INTEGRATED VCELL • NEURON • CYTOSCAPE SIMULATOR</p>
          </div>
        </div>

        {/* Global HUD readouts */}
        <div className="hidden md:flex items-center gap-6 font-mono text-xs">
          <div className="border-l border-slate-800 pl-4">
            <span className="text-slate-400 block text-[9px]">TIMELINE</span>
            <span className="text-slate-200 text-sm font-semibold">
              {isRecoveryMode ? `RECOVERING: ${(recoveryProgress*100).toFixed(0)}%` : `SLEEP DEBT: ${hours.toFixed(1)}h`}
            </span>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-slate-400 block text-[9px]">SEVERITY INDEX</span>
            <span className={`text-sm font-semibold ${network.severityIndex > 60 ? 'text-[#ff0055] animate-pulse' : network.severityIndex > 30 ? 'text-amber-500' : 'text-emerald-400'}`}>
              {network.severityIndex}%
            </span>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-slate-400 block text-[9px]">ENGINE STATUS</span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${network.severityIndex > 60 ? 'text-[#ff0055]' : 'text-[#00f0ff]'}`}>
              <span className={`w-2 h-2 rounded-full ${network.severityIndex > 60 ? 'bg-[#ff0055]' : 'bg-[#00f0ff]'} animate-ping`}></span>
              {network.severityIndex > 60 ? 'CRITICAL SYSTEM FATIGUE' : 'CALIBRATED & RUNNING'}
            </span>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSoundToggle}
            className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all ${!isMuted ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
            title="Toggle Web Audio Synthesis"
          >
            <i className={`lucide ${!isMuted ? 'lucide-volume-2' : 'lucide-volume-x'}`}></i>
            <span className="hidden sm:inline">{!isMuted ? 'AUDIO: ON' : 'AUDIO: OFF'}</span>
          </button>
          
          <button
            onClick={() => {
              handleBtnClick();
              setIsDemoMode(!isDemoMode);
              setDemoStep(0);
            }}
            className={`px-3 py-2 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${isDemoMode ? 'border-[#ff007f] text-[#ff007f] bg-[#ff007f]/10 shadow-[0_0_12px_rgba(255,0,127,0.3)] animate-pulse' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}
          >
            <i className="lucide lucide-play-circle"></i>
            {isDemoMode ? 'STOP DEMO' : 'PRESENTATION MODE'}
          </button>
        </div>
      </header>

      {/* NARRATION FLOATING BANNER (Presentation Mode only) */}
      {isDemoMode && (
        <div className="bg-[#ff007f]/20 border-b border-[#ff007f]/40 px-6 py-3 flex items-center gap-3 animate-fade-in relative z-40 bg-slate-950/80">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff007f] animate-ping shrink-0"></div>
          <span className="text-xs font-mono font-bold text-[#ff007f] uppercase tracking-widest shrink-0">[PRESENTATION ASSISTANT]:</span>
          <p className="text-xs sm:text-sm text-slate-100 font-medium italic select-none">"{demoCaption}"</p>
        </div>
      )}

      {/* CORE VIEW TABS */}
      <div className="flex bg-slate-950 border-b border-slate-800">
        <button
          onClick={() => { handleBtnClick(); setActiveTab('simulation'); }}
          className={`px-6 py-3 text-xs font-mono font-bold tracking-wider border-b-2 flex items-center gap-2 transition-all ${activeTab === 'simulation' ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <i className="lucide lucide-activity"></i>
          SIMULATION DASHBOARD
        </button>
        <button
          onClick={() => { handleBtnClick(); setActiveTab('academic'); }}
          className={`px-6 py-3 text-xs font-mono font-bold tracking-wider border-b-2 flex items-center gap-2 transition-all ${activeTab === 'academic' ? 'border-[#a855f7] text-[#a855f7] bg-[#a855f7]/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <i className="lucide lucide-file-text"></i>
          IEEE PUBLICATION PREVIEW
        </button>
      </div>

      {/* DASHBOARD VIEWPORT */}
      {activeTab === 'simulation' ? (
        <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5 p-5">

          {/* LEFT COLUMN: VCELL METABOLIC STRESS ENGINE (3 Cols) */}
          <section className="xl:col-span-3 flex flex-col gap-5">
            
            {/* Panel 1: VCell Biological Stress */}
            <div id="vcell-engine" className={`border rounded-xl bg-slate-950/50 backdrop-blur-md p-5 flex flex-col gap-4 relative transition-all ${isDemoMode && DEMO_SCRIPT[demoStep].highlight === 'vcell-engine' ? 'border-[#ff007f] shadow-[0_0_20px_rgba(255,0,127,0.4)] ring-2 ring-[#ff007f]' : 'border-slate-800'}`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-[#00f0ff]/10 text-[#00f0ff]"><i className="lucide lucide-heart-pulse text-sm"></i></span>
                  <h3 className="font-bold text-xs tracking-wider font-mono text-[#00f0ff]">PANEL 1: BIOLOGICAL STRESS (VCELL)</h3>
                </div>
                <span className="text-[10px] font-mono text-[#00f0ff] uppercase bg-[#00f0ff]/10 px-2 py-0.5 rounded">Mitochondria</span>
              </div>

              {/* Dynamic Circular Gauges */}
              <div className="grid grid-cols-2 gap-4 my-2">
                
                {/* ATP Gauge */}
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-900/40 border border-slate-850">
                  <span className="text-[10px] font-mono text-slate-400 mb-2">CELLULAR ATP</span>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="34" className="stroke-slate-800" strokeWidth="6" fill="transparent" />
                      <circle cx="40" cy="40" r="34" className="stroke-[#00f0ff] transition-all duration-300" strokeWidth="6" fill="transparent"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - cellular.atp / 100)} />
                    </svg>
                    <span className="absolute text-sm font-bold font-mono text-slate-100">{cellular.atp.toFixed(0)}%</span>
                  </div>
                  <span className="text-[9px] text-[#00f0ff] font-mono mt-1.5">Baseline Nominal</span>
                </div>

                {/* ROS Gauge */}
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-900/40 border border-slate-850">
                  <span className="text-[10px] font-mono text-slate-400 mb-2">REACTIVE ROS</span>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="34" className="stroke-slate-800" strokeWidth="6" fill="transparent" />
                      <circle cx="40" cy="40" r="34" className="stroke-[#ff0055] transition-all duration-300" strokeWidth="6" fill="transparent"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - cellular.ros / 100)} />
                    </svg>
                    <span className="absolute text-sm font-bold font-mono text-slate-100">{cellular.ros.toFixed(0)}%</span>
                  </div>
                  <span className={`text-[9px] font-mono mt-1.5 ${cellular.ros > 75 ? 'text-[#ff0055] animate-pulse' : 'text-slate-400'}`}>
                    {cellular.ros > 75 ? 'RISK PATHOGENIC' : 'SAFE LIMITS'}
                  </span>
                </div>

              </div>

              {/* Stress Factor Over Time Graph */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-400">METABOLIC TRAJECTORY</span>
                  <span className="text-[#00f0ff]">ATP (Blue) vs ROS (Red)</span>
                </div>
                <div className="h-32 w-full bg-slate-900/60 rounded border border-slate-800/80 p-2 relative">
                  {/* Custom SVG Line Chart */}
                  <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="12.5" x2="100" y2="12.5" stroke="#334155" strokeWidth="0.25" strokeDasharray="2,2" />
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#334155" strokeWidth="0.25" strokeDasharray="2,2" />
                    <line x1="0" y1="37.5" x2="100" y2="37.5" stroke="#334155" strokeWidth="0.25" strokeDasharray="2,2" />
                    
                    {/* ATP Curve */}
                    <path
                      d={Array.from({ length: 21 }, (_, i) => {
                        const h = (i * 5);
                        const value = 25 + 75 * Math.exp(-h / 32);
                        const x = i * 5;
                        const y = 50 - (value / 100) * 45 - 2; // inverted for SVG coordinates
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#00f0ff"
                      strokeWidth="1"
                    />
                    
                    {/* ROS Curve */}
                    <path
                      d={Array.from({ length: 21 }, (_, i) => {
                        const h = (i * 5);
                        const value = 100 - 90 * Math.exp(-h / 24);
                        const x = i * 5;
                        const y = 50 - (value / 100) * 45 - 2;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#ff0055"
                      strokeWidth="1"
                    />

                    {/* Timeline position marker */}
                    {!isRecoveryMode && (
                      <line x1={Math.min(100, (hours / 100) * 100)} y1="0" x2={Math.min(100, (hours / 100) * 100)} y2="50" stroke="#facc15" strokeWidth="0.75" />
                    )}
                  </svg>
                  {/* Chart labels */}
                  <div className="absolute top-1 left-2 text-[8px] font-mono text-slate-500">100%</div>
                  <div className="absolute bottom-1 left-2 text-[8px] font-mono text-slate-500">0%</div>
                  <div className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-500">100h</div>
                </div>
              </div>

              {/* TIMELINE CONTROL PANEL */}
              <div className="flex flex-col gap-2 border-t border-slate-800 pt-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-slate-400">CONTROL DECK</span>
                  <span className="font-mono text-yellow-400 font-bold">{hours.toFixed(0)} HRS</span>
                </div>
                
                {/* Custom timeline track slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hours}
                  disabled={isDemoMode || isRecoveryMode}
                  onChange={(e) => setHours(parseFloat(e.target.value))}
                  className="w-full accent-[#00f0ff] bg-slate-800 rounded-lg cursor-pointer h-1.5"
                />

                {/* Primary Trigger Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => { handleBtnClick(); setIsPlaying(!isPlaying); }}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${isPlaying ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.15)]' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'}`}
                  >
                    <i className={`lucide ${isPlaying ? 'lucide-pause' : 'lucide-play'}`}></i>
                    {isPlaying ? 'PAUSE' : 'RUN SIM'}
                  </button>
                  
                  <button
                    onClick={() => {
                      handleBtnClick();
                      if (isRecoveryMode) {
                        setIsRecoveryMode(false);
                        setRecoveryProgress(0);
                        setHours(0);
                      } else {
                        setIsRecoveryMode(true);
                        setRecoveryProgress(0);
                        setIsPlaying(true);
                      }
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${isRecoveryMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)] animate-pulse' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-emerald-700'}`}
                  >
                    <i className="lucide lucide-sunset"></i>
                    {isRecoveryMode ? 'RESET SIM' : 'RECOVERY'}
                  </button>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-slate-400">
                  <span>PLAYBACK SPEED</span>
                  <div className="flex gap-2">
                    {[1, 2, 5].map(s => (
                      <button
                        key={s}
                        onClick={() => { handleBtnClick(); setSimulationSpeed(s); }}
                        className={`px-1.5 py-0.5 rounded border ${simulationSpeed === s ? 'text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/10' : 'border-slate-800 hover:border-slate-650'}`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated VCell Pipeline Reference */}
            <div className="border border-slate-800 rounded-xl bg-slate-950/50 backdrop-blur-md p-4 flex flex-col gap-3 font-mono text-xs">
              <span className="text-[10px] text-slate-500 tracking-wider">VCELL REACTION SCHEME</span>
              <div className="border border-slate-850 p-2.5 rounded bg-slate-900/60 font-mono text-[10.5px] leading-relaxed flex flex-col gap-1.5 text-slate-300">
                <div><span className="text-[#00f0ff]">Glucose + O₂</span> ──<span className="text-slate-400">Mit_Resp</span>──&gt; <span className="text-[#00f0ff]">36 ATP</span></div>
                <div><span className="text-[#00f0ff]">ATP</span> + <span className="text-yellow-500">SleepFactor</span> ──&gt; <span className="text-slate-400">AMP + ROS</span></div>
                <div className="text-[9px] text-[#ff0055] border-t border-slate-800/80 pt-1.5 mt-1">
                  * ROS accumulation increases membrane leak conductance (g_leak) exponentially.
                </div>
              </div>
            </div>

          </section>

          {/* MIDDLE COLUMN: VISUAL TWIN HUB (6 Cols) */}
          <section className="xl:col-span-6 flex flex-col gap-5">
            
            {/* View Selector & Canvas Box */}
            <div id="brain-view" className={`border rounded-xl bg-slate-950/50 backdrop-blur-md p-4 flex flex-col gap-3 relative transition-all ${isDemoMode && DEMO_SCRIPT[demoStep].highlight === 'brain-view' ? 'border-[#ff007f] shadow-[0_0_20px_rgba(255,0,127,0.4)] ring-2 ring-[#ff007f]' : 'border-slate-800'}`}>
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-xs tracking-wider font-mono text-sky-400">3D DIGITAL TWIN LAB</h3>
                  <div className="flex rounded-lg overflow-hidden border border-slate-800 p-0.5">
                    <button
                      onClick={() => { handleBtnClick(); setView3d(true); }}
                      className={`px-3 py-1 text-[10px] font-mono font-bold rounded transition-all ${view3d ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      3D BRAIN
                    </button>
                    <button
                      onClick={() => { handleBtnClick(); setView3d(false); }}
                      className={`px-3 py-1 text-[10px] font-mono font-bold rounded transition-all ${!view3d ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      CYTOSCAPE CONNECTOME
                    </button>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
                  LIVESTREAM SIMULATOR
                </span>
              </div>

              {/* Viewport Canvas container */}
              <div className="relative w-full h-[320px] rounded-lg bg-slate-950 border border-slate-900 overflow-hidden flex items-center justify-center">
                {view3d ? (
                  <div ref={brain3dContainerRef} className="w-full h-full" />
                ) : (
                  <div ref={networkContainerRef} className="w-full h-full" />
                )}

                {/* Overlaid UI details on canvas */}
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-800/80 p-2.5 rounded font-mono text-[9px] flex flex-col gap-0.5 max-w-[200px] pointer-events-none select-none text-slate-400">
                  <span className="font-bold text-slate-200 uppercase tracking-wider mb-1 block">ANATOMICAL PROBE</span>
                  {selectedNode ? (
                    <>
                      <span className="text-[#00f0ff] font-semibold">{selectedNode.label}</span>
                      <span className="text-slate-300 leading-normal my-0.5 block">{selectedNode.desc}</span>
                      <span className="text-yellow-400">Susceptibility: {selectedNode.vulnerability}%</span>
                    </>
                  ) : (
                    <span>Click any node in the "Cytoscape Connectome" view to probe regional dynamics.</span>
                  )}
                </div>
              </div>

              {/* STORYLINE PIPELINE TIMELINE PROGRESS BAR */}
              <div className="border-t border-slate-850 pt-3 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>SIMULATION PIPELINE FLOW</span>
                  <span className="text-[#00f0ff]">HEALTHY → DEPRIVED → RECOVERY</span>
                </div>
                
                {/* 5 Phase buttons */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { label: "PHASE 1: Normal", limit: 0, desc: "Restful homeostatic firing" },
                    { label: "PHASE 2: Stress", limit: 24, desc: "ATP decay, ROS accumulation" },
                    { label: "PHASE 3: Spikes", limit: 48, desc: "Hodgkin-Huxley instability" },
                    { label: "PHASE 4: Damage", limit: 72, desc: "Cytoscape synaptic collapse" },
                    { label: "PHASE 5: Repair", limit: 100, desc: "Metabolic-structural repair", isRec: true }
                  ].map((p, idx) => {
                    const isActive = isRecoveryMode 
                      ? p.isRec 
                      : (!p.isRec && hours >= p.limit && (idx === 3 || hours < p.limit + 24));
                    
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 cursor-pointer transition-all ${isActive ? 'bg-[#00f0ff]/10 border-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.15)]' : 'bg-slate-900/40 border-slate-850 hover:border-slate-700'}`}
                        onClick={() => {
                          handleBtnClick();
                          if (p.isRec) {
                            setIsRecoveryMode(true);
                            setRecoveryProgress(0.5);
                          } else {
                            setIsRecoveryMode(false);
                            setHours(p.limit);
                          }
                        }}
                      >
                        <span className={`text-[9px] font-mono font-bold ${isActive ? 'text-[#00f0ff]' : 'text-slate-400'}`}>{p.label}</span>
                        <span className="text-[8px] text-slate-500 font-mono leading-tight">{p.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* AI DIAGNOSTICS & SUMMARY INSIGHT PANEL (4) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Dynamic scrolling log */}
              <div className="border border-slate-800 rounded-xl bg-slate-950/50 backdrop-blur-md p-4 flex flex-col gap-2 h-44 overflow-hidden">
                <span className="text-[10px] font-mono text-slate-400 block border-b border-slate-800 pb-2">AI TELEMETRY INTERFACE LOG</span>
                <div ref={logContainerRef} className="flex-1 overflow-y-auto pr-2 font-mono text-[10px] flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {aiLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-1">
                      <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                      <span className={`font-bold shrink-0 ${log.type === 'success' ? 'text-emerald-400' : log.type === 'warn' ? 'text-amber-500' : log.type === 'danger' ? 'text-[#ff0055]' : 'text-[#00f0ff]'}`}>
                        {log.type.toUpperCase()}:
                      </span>
                      <span className="text-slate-300">{log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Auto Summary cards */}
              <div className="border border-slate-800 rounded-xl bg-slate-950/50 backdrop-blur-md p-4 flex flex-col gap-2">
                <span className="text-[10px] font-mono text-slate-400 block border-b border-slate-800 pb-2">AI PATHOLOGY OBSERVATIONS</span>
                <div className="flex-1 flex flex-col justify-center gap-2">
                  <div className="p-2.5 rounded bg-[#ff0055]/5 border border-[#ff0055]/20 flex gap-2 items-center">
                    <span className="p-1 rounded bg-[#ff0055]/10 text-[#ff0055] animate-pulse"><i className="lucide lucide-alert-triangle text-xs"></i></span>
                    <div className="text-[10px] font-mono leading-relaxed">
                      <strong className="text-slate-200">Mit_Stress:</strong> ROS concentration {cellular.ros.toFixed(0)}% exceeds critical pathogenic threshold limits.
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-sky-500/5 border border-sky-500/20 flex gap-2 items-center">
                    <span className="p-1 rounded bg-sky-500/10 text-sky-400"><i className="lucide lucide-network text-xs"></i></span>
                    <div className="text-[10px] font-mono leading-relaxed">
                      <strong className="text-slate-200">Connectome:</strong> Frontal lobe synapses showing {100 - network.connectivityScore}% synaptic weight decay.
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </section>

          {/* RIGHT COLUMN: SINGLE-CELL NEURON ACTIVITY ENGINE & STATS (3 Cols) */}
          <section className="xl:col-span-3 flex flex-col gap-5">
            
            {/* Panel 2: NEURON Electrophysiology Oscilloscope */}
            <div id="neuron-engine" className={`border rounded-xl bg-slate-950/50 backdrop-blur-md p-5 flex flex-col gap-4 relative transition-all ${isDemoMode && DEMO_SCRIPT[demoStep].highlight === 'neuron-engine' ? 'border-[#ff007f] shadow-[0_0_20px_rgba(255,0,127,0.4)] ring-2 ring-[#ff007f]' : 'border-slate-800'}`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-[#a855f7]/10 text-[#a855f7]"><i className="lucide lucide-zap text-sm"></i></span>
                  <h3 className="font-bold text-xs tracking-wider font-mono text-[#c084fc]">PANEL 2: NEURON MEMBRANE (NEURON)</h3>
                </div>
                <span className="text-[10px] font-mono text-[#c084fc] uppercase bg-[#a855f7]/10 px-2 py-0.5 rounded">Hodgkin-Huxley</span>
              </div>

              {/* Electro Graph (Oscilloscope) */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>MEMBRANE POTENTIAL (Vm)</span>
                  <span className="text-[#a855f7]">100ms patch trace</span>
                </div>
                <div className="h-36 w-full bg-slate-950 border border-slate-900 p-2.5 rounded relative overflow-hidden flex items-center justify-center">
                  
                  {/* Grid lines (Sci-fi radar scope effect) */}
                  <div className="absolute inset-0 grid grid-cols-5 grid-rows-4 pointer-events-none opacity-10">
                    {Array.from({ length: 24 }).map((_, idx) => (
                      <div key={idx} className="border border-sky-500"></div>
                    ))}
                  </div>

                  {/* SVG Spike Plotting */}
                  <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible z-10" preserveAspectRatio="none">
                    <path
                      d={neuronSpikes.map((pt, idx) => {
                        const x = (pt.time / 100) * 200;
                        // Map potential from [-85, 45] to [90, 10] in SVG coordinates
                        const y = 90 - ((pt.potential + 85) / 130) * 80;
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="1.5"
                      className="filter drop-shadow-[0_0_2px_#a855f7]"
                    />
                  </svg>

                  {/* Oscilloscope Readouts */}
                  <div className="absolute top-2 right-2 text-[8px] font-mono text-[#a855f7] bg-slate-950/80 px-1 border border-slate-800/80 rounded">
                    SWEEP ACTIVE
                  </div>
                  <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-500">+40 mV</div>
                  <div className="absolute bottom-2 left-2 text-[8px] font-mono text-slate-500">-80 mV</div>
                </div>
              </div>

              {/* Stats Table: Comparison */}
              <div className="flex flex-col gap-2 font-mono text-[10px]">
                <span className="text-slate-400 block border-b border-slate-850 pb-1">ELECTROPHYSIOLOGICAL STATISTICS</span>
                <div className="grid grid-cols-2 gap-2 my-1">
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-850">
                    <span className="text-slate-500 text-[9px] block">RESTING POTENTIAL</span>
                    <strong className="text-slate-200 text-xs">{(-70 + 15 * (network.severityIndex/100)).toFixed(1)} mV</strong>
                    <span className="text-[8px] text-slate-500 block mt-0.5">Threshold: -55mV</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-850">
                    <span className="text-slate-500 text-[9px] block">SPIKE FREQUENCY</span>
                    <strong className="text-slate-200 text-xs">{(12 - 9 * (network.severityIndex/100)).toFixed(1)} Hz</strong>
                    <span className="text-[8px] text-slate-500 block mt-0.5">Mildly chaotic bursts</span>
                  </div>
                </div>
              </div>

              {/* Simulated NEURON Circuit diagram */}
              <div className="flex flex-col gap-2 font-mono text-[10px]">
                <span className="text-slate-500">NEURON CABLE EQUIVALENT CIRCUIT</span>
                <div className="border border-slate-850 rounded p-2.5 bg-slate-900/40 font-mono text-[9px] leading-tight text-slate-400 flex flex-col gap-1">
                  <div>C_m (dV_m/dt) = I_inj - I_Na - I_K - I_L</div>
                  <div className="text-[#a855f7] border-t border-slate-800/80 pt-1 mt-1 font-semibold">
                    Na/K Pump Loss: I_pump = f(ATP) ──&gt; Depolarization
                  </div>
                </div>
              </div>

            </div>

            {/* Panel 5: Comparative Analytics Radar Indices */}
            <div className="border border-slate-800 rounded-xl bg-slate-950/50 backdrop-blur-md p-5 flex flex-col gap-4">
              <span className="text-xs font-bold font-mono text-[#ff007f] block border-b border-slate-800 pb-2">PANEL 5: COMPARATIVE COGNITIVE SCORE</span>
              
              <div className="flex flex-col gap-3 font-mono text-xs">
                
                {/* Connectivity Score */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">CONNECTIVITY EFFICIENCY</span>
                    <span className="text-slate-200">{network.connectivityScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden border border-slate-850">
                    <div className="h-full bg-gradient-to-r from-sky-400 to-[#00f0ff] transition-all duration-300" style={{ width: `${network.connectivityScore}%` }}></div>
                  </div>
                </div>

                {/* Stability Score */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">MEMBRANE STABILITY</span>
                    <span className="text-slate-200">{network.stabilityScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden border border-slate-850">
                    <div className="h-full bg-gradient-to-r from-purple-400 to-[#a855f7] transition-all duration-300" style={{ width: `${network.stabilityScore}%` }}></div>
                  </div>
                </div>

                {/* Neural Efficiency */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">SMALL-WORLD EFFICIENCY</span>
                    <span className="text-slate-200">{network.efficiencyScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden border border-slate-850">
                    <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-300" style={{ width: `${network.efficiencyScore}%` }}></div>
                  </div>
                </div>

                {/* Cognitive Decline Index */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">COGNITIVE COMPROMISE INDEX</span>
                    <span className="text-[#ff0055] font-bold">{network.cognitiveDecline}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden border border-slate-850">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-[#ff0055] transition-all duration-300" style={{ width: `${network.cognitiveDecline}%` }}></div>
                  </div>
                </div>

              </div>
            </div>

          </section>

          {/* LOWER FULL-WIDTH PANEL: PREDICTION FORECASTING */}
          <footer className="xl:col-span-12 border border-slate-800 rounded-xl bg-slate-950/50 backdrop-blur-md p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">AI PREDICTION MODULE: 48-HOUR CONNECTOME DECAY FORECAST</span>
              <button 
                onClick={handleCSVExport}
                className="px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <i className="lucide lucide-download"></i>
                EXPORT CSV SIMULATION DATA
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Forecast graph (custom SVG) */}
              <div className="md:col-span-3 h-28 bg-slate-950 border border-slate-900 rounded p-2.5 relative">
                <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-500">PROJECTIONS</div>
                
                {/* SVG Area chart */}
                <svg viewBox="0 0 400 60" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  {/* Forecast Line - ATP decaying */}
                  <path
                    d={forecast.map((f, i) => {
                      const x = i * 80;
                      const y = 60 - (f.atp / 100) * 50;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#00f0ff"
                    strokeWidth="1.5"
                    strokeDasharray="4,2"
                  />

                  {/* Forecast Line - Connective Decay increasing */}
                  <path
                    d={forecast.map((f, i) => {
                      const x = i * 80;
                      const y = 60 - (f.damage / 100) * 50;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#ff0055"
                    strokeWidth="1.5"
                    strokeDasharray="4,2"
                  />

                  {/* Nodes on graph */}
                  {forecast.map((f, i) => (
                    <g key={i} transform={`translate(${i * 80}, ${60 - (f.atp / 100) * 50})`}>
                      <circle r="3" fill="#00f0ff" />
                    </g>
                  ))}
                  {forecast.map((f, i) => (
                    <g key={i} transform={`translate(${i * 80}, ${60 - (f.damage / 100) * 50})`}>
                      <circle r="3" fill="#ff0055" />
                    </g>
                  ))}
                </svg>
                
                {/* Label axes */}
                <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-2 px-1">
                  <span>Current ({hours.toFixed(0)}h)</span>
                  <span>+8 Hours</span>
                  <span>+16 Hours</span>
                  <span>+24 Hours</span>
                  <span>+32 Hours</span>
                  <span>+40 Hours</span>
                  <span>+48 Hours</span>
                </div>
              </div>

              {/* Explanatory notes */}
              <div className="flex flex-col justify-center text-[10px] font-mono text-slate-400 gap-1 border-l border-slate-800 pl-6">
                <span className="font-bold text-slate-200">FORECAST KEY OBSERVATION</span>
                <p className="leading-normal">
                  In next 48h (assuming no recovery cycle is initiated), synaptic pruning speeds up. Cognitive decline index is projected to rise to <strong className="text-[#ff0055]">{forecast[forecast.length-1]?.damage}%</strong>.
                </p>
              </div>

            </div>
          </footer>

        </main>
      ) : (
        /* ACADEMIC/IEEE PUBLICATION PREVIEW TAB */
        <main className="flex-1 max-w-4xl mx-auto p-8 my-6 bg-white text-slate-900 border border-slate-300 shadow-2xl rounded-sm font-serif leading-relaxed text-sm selection:bg-[#00f0ff]/30">
          
          <div className="flex justify-between items-center border-b border-slate-300 pb-4 mb-6">
            <span className="font-mono text-xs text-slate-500 uppercase tracking-widest">IEEE XPLORE PREVIEW MOCKUP (DOUBLE-COLUMN FORMAT)</span>
            <button 
              onClick={handleCSVExport}
              className="px-3 py-1.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <i className="lucide lucide-file-text"></i>
              EXPORT MANUSCRIPT CSV DATA
            </button>
          </div>

          {/* Title and Metadata */}
          <h2 className="text-center font-bold text-xl leading-snug font-sans uppercase mb-1">{ieeeData.title}</h2>
          <div className="text-center text-xs text-slate-600 font-sans mb-6 whitespace-pre-line leading-relaxed">{ieeeData.authors}</div>

          {/* IEEE Double Column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-justify text-xs leading-relaxed text-slate-800 border-t border-b border-slate-350 py-4">
            
            {/* Column 1 */}
            <div className="flex flex-col gap-4 border-r border-slate-200 pr-3">
              <div>
                <strong className="font-sans block text-[10px] font-bold tracking-wider mb-1 uppercase">Abstract</strong>
                <p className="italic">{ieeeData.abstract}</p>
              </div>
              
              <div>
                <strong className="font-sans block text-[10px] font-bold tracking-wider mb-1 uppercase">I. Introduction</strong>
                <p>{ieeeData.introduction}</p>
              </div>

              <div>
                <strong className="font-sans block text-[10px] font-bold tracking-wider mb-1 uppercase">II. VCell Metabolic Stress modeling</strong>
                <p>{ieeeData.vcellResults}</p>
              </div>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-4 pl-3">
              <div>
                <strong className="font-sans block text-[10px] font-bold tracking-wider mb-1 uppercase">III. NEURON Patch Firing Instability</strong>
                <p>{ieeeData.neuronResults}</p>
              </div>

              <div>
                <strong className="font-sans block text-[10px] font-bold tracking-wider mb-1 uppercase">IV. Cytoscape Synaptic Connectomics</strong>
                <p>{ieeeData.cytoscapeResults}</p>
              </div>

              <div>
                <strong className="font-sans block text-[10px] font-bold tracking-wider mb-1 uppercase">V. Conclusion</strong>
                <p>{ieeeData.conclusion}</p>
              </div>

              {/* References mock */}
              <div className="border-t border-slate-300 pt-3">
                <strong className="font-sans block text-[9px] font-bold tracking-wider mb-1 uppercase">References</strong>
                <ol className="list-decimal pl-4 font-sans text-[9px] leading-tight text-slate-600 flex flex-col gap-1">
                  <li>L. Satchwell et al., "Mitochondrial metabolic wear and synaptic pruning kinetics," J. Neurosci. Res., 2024.</li>
                  <li>A. Hodgkin and A. Huxley, "A quantitative description of membrane current," J. Physiol., 1952.</li>
                  <li>Shannon et al., "Cytoscape: A software system for integrated models," Genome Res., 2003.</li>
                </ol>
              </div>
            </div>

          </div>

          {/* SVG Pipeline Workflow inline figure */}
          <div className="mt-8 border border-slate-200 p-4 rounded bg-slate-900 text-white flex flex-col items-center">
            <span className="font-sans text-[10px] font-bold tracking-wider text-sky-400 mb-3 uppercase">Figure 1. Multi-scale computational framework coupling VCell, NEURON, and Cytoscape.</span>
            <div className="w-full max-w-2xl h-44" dangerouslySetInnerHTML={{ __html: window.NeuroAcademic.getWorkflowSVG() }} />
          </div>

        </main>
      )}

      {/* FOOTER METADATA */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>© 2026 NEUROSLEEP BIOMEDICAL LABS. ALL SIMULATION DATA GENERATED PROCEDURALLY.</span>
        <span className="hidden sm:inline">VCell Core 7.4 • NEURON Core 8.2 • Cytoscape.js 3.26.0</span>
      </footer>

    </div>
  );
}

// Bind to window for rendering inside entry index.html
window.NeuroSleepDashboard = NeuroSleepDashboard;
