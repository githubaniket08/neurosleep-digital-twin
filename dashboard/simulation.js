/**
 * NeuroSleep Digital Twin Platform - Simulation Engine (simulation.js)
 * Simulates cellular stress, electrophysiological membrane dynamics, and network properties.
 */

window.NeuroSimulation = (function() {
  
  // Base configuration parameters
  const CONFIG = {
    baselineATP: 100, // %
    baselineROS: 10,  // %
    baselineSleepFactor: 5, // Arbitrary unit (0-100)
    criticalROSThreshold: 75, // %
    restingPotentialHealthy: -70, // mV
    restingPotentialDeprived: -55, // mV
  };

  /**
   * Calculates VCell Cellular Stress parameters based on sleep deprivation hours (t) and recovery fraction (r).
   * Uses simple ODE-derived equations.
   * @param {number} hours - Sleep deprivation hours (0 to 100)
   * @param {number} recovery - Recovery fraction (0 to 1, where 1 is fully recovered)
   */
  function getCellularStress(hours, recovery = 0) {
    // Under sleep deprivation, ATP decays, ROS rises, SleepFactor increases.
    // Under recovery, ATP restores, ROS decays, SleepFactor drops.
    
    // ATP Depletion
    // Healthy ATP is 100%. Max depletion down to ~25%.
    const rawATP = 25 + 75 * Math.exp(-hours / 32); 
    const recoveredATP = rawATP + (100 - rawATP) * recovery;
    
    // ROS Accumulation
    // Healthy ROS is 10%. Max accumulation up to 100%.
    const rawROS = 100 - 90 * Math.exp(-hours / 24);
    const recoveredROS = rawROS - (rawROS - 10) * recovery;
    
    // SleepFactor (Adenosine and other sleep pressures)
    const rawSF = 100 - 95 * Math.exp(-hours / 18);
    const recoveredSF = rawSF - (rawSF - 5) * recovery;
    
    // Oxidative Stress index (derived)
    const oxidativeStress = Math.min(100, Math.max(0, (recoveredROS * 1.2) - (recoveredATP * 0.3)));
    
    return {
      atp: Math.max(0, Math.min(100, recoveredATP)),
      ros: Math.max(0, Math.min(100, recoveredROS)),
      sleepFactor: Math.max(0, Math.min(100, recoveredSF)),
      oxidativeStress: Math.max(0, Math.min(100, oxidativeStress)),
      criticalAlert: recoveredROS > CONFIG.criticalROSThreshold
    };
  }

  /**
   * Generates Hodgkin-Huxley-like membrane potential dynamics for healthy, deprived, or recovering neurons.
   * Returns a time series for plotting.
   * @param {number} hours - Sleep deprivation hours
   * @param {number} recovery - Recovery fraction (0-1)
   * @param {number} duration - Time duration in ms (default 100ms)
   * @param {number} step - Step size in ms (default 0.1ms)
   */
  function generateNeuronSpikes(hours, recovery = 0, duration = 100, step = 0.1) {
    const pointsCount = Math.floor(duration / step);
    const timeSeries = [];
    
    // Severity parameters
    const severity = Math.max(0, Math.min(1, (hours / 72) * (1 - recovery)));
    
    // Resting potential shifts from -70mV (healthy) towards -55mV (depolarized) due to Na+/K+ pump stress
    const restingV = -70 + 15 * severity;
    
    // Spike amplitude shrinks with severity due to Na+ channel inactivation
    const maxSpikeAmp = 40 - 25 * severity; 
    const hyperpolarizationV = -80 + 10 * severity;
    
    // Channel conductances and noise variables
    let v = restingV;
    let n = 0.3; // Potassium activation
    let m = 0.05; // Sodium activation
    let h = 0.6; // Sodium inactivation
    
    // Applied current injection (simulate periodic input or synaptic activity)
    const getStimulus = (t) => {
      if (severity < 0.2) {
        // Healthy: Clean periodic stimulus triggering crisp spikes
        return 10 * (Math.sin(2 * Math.PI * t / 20) > 0.6 ? 1 : 0);
      } else if (severity < 0.6) {
        // Mild Deprivation: Slightly irregular stimulus, noisy inputs
        const freqNoise = Math.sin(2 * Math.PI * t / (18 + Math.sin(t/5)*3));
        return (10 + 5 * Math.sin(t/2)) * (freqNoise > 0.4 ? 1 : 0);
      } else {
        // Severe Deprivation: Random synaptic noise, unstable input, failing pump
        const noise = Math.random() * 8 - 4;
        const cycle = Math.sin(2 * Math.PI * t / 15) > 0.8;
        return cycle ? (8 + noise) : (2 + noise);
      }
    };

    // Run a simplified FitzHugh-Nagumo / Hodgkin-Huxley hybrid solver
    for (let i = 0; i < pointsCount; i++) {
      const t = i * step;
      const I_stim = getStimulus(t);
      
      // Equations modeling ionic currents modified by metabolic stress (severity)
      // High severity increases leak conductances and slows down recovery gates
      const g_Na = 120 * (1 - 0.4 * severity);
      const g_K = 36 * (1 - 0.3 * severity);
      const g_L = 0.3 * (1 + 1.5 * severity); // Increased leak
      
      const V_Na = 50 - 20 * severity;
      const V_K = -77 + 10 * severity;
      const V_L = -54.4 + 10 * severity;
      
      // Calculate steady states & time constants
      const alpha_m = 0.1 * (v + 40) / (1 - Math.exp(-(v + 40) / 10));
      const beta_m = 4.0 * Math.exp(-(v + 65) / 18);
      const alpha_h = 0.07 * Math.exp(-(v + 65) / 20);
      const beta_h = 1.0 / (1 + Math.exp(-(v + 35) / 10));
      const alpha_n = 0.01 * (v + 55) / (1 - Math.exp(-(v + 55) / 10));
      const beta_n = 0.125 * Math.exp(-(v + 65) / 80);
      
      // Time scale slowing due to ATP failure
      const timeScale = 1 - 0.5 * severity;
      
      m += step * timeScale * (alpha_m * (1 - m) - beta_m * m);
      h += step * timeScale * (alpha_h * (1 - h) - beta_h * h);
      n += step * timeScale * (alpha_n * (1 - n) - beta_n * n);
      
      // Currents
      const I_Na = g_Na * Math.pow(m, 3) * h * (v - V_Na);
      const I_K = g_K * Math.pow(n, 4) * (v - V_K);
      const I_L = g_L * (v - V_L);
      
      // Voltage change
      const dv = I_stim - I_Na - I_K - I_L;
      v += step * dv;
      
      // Cap voltages to biological limits
      if (v > maxSpikeAmp) v = maxSpikeAmp + Math.random() * 2;
      if (v < hyperpolarizationV) v = hyperpolarizationV;
      
      // Output every 5th point to keep graph performance high (200 points total per 100ms)
      if (i % 5 === 0) {
        timeSeries.push({
          time: parseFloat(t.toFixed(1)),
          potential: parseFloat(v.toFixed(2)),
          stimulus: parseFloat(I_stim.toFixed(2))
        });
      }
    }
    
    return timeSeries;
  }

  /**
   * Generates graph theory and network statistics metrics based on sleep deprivation.
   * Modifies clustering coefficient, path length, connectivity and stability indices.
   * @param {number} hours - Sleep deprivation hours
   * @param {number} recovery - Recovery fraction (0-1)
   */
  function getNetworkMetrics(hours, recovery = 0) {
    const severity = Math.max(0, Math.min(1, (hours / 72) * (1 - recovery)));
    
    // Baseline network metrics
    const baselineClustering = 0.65;
    const baselinePathLength = 2.1; // Small world characteristic
    
    // Sleep deprivation degrades efficiency: clustering drops, path length increases
    const clustering = baselineClustering - 0.35 * severity;
    const pathLength = baselinePathLength + 1.8 * severity;
    
    // Performance indexes (0 to 100)
    const connectivityScore = Math.max(15, Math.min(100, 100 - 75 * severity));
    const stabilityScore = Math.max(10, Math.min(100, 100 - 80 * (severity * 1.1)));
    const efficiencyScore = Math.max(12, Math.min(100, (clustering / baselineClustering) * 100 - 15 * severity));
    
    // Overall indices
    const cognitiveDecline = Math.min(100, Math.max(0, 95 * severity));
    const severityIndex = Math.min(100, Math.max(0, severity * 100));
    
    return {
      clusteringCoefficient: parseFloat(clustering.toFixed(3)),
      averagePathLength: parseFloat(pathLength.toFixed(2)),
      connectivityScore: Math.round(connectivityScore),
      stabilityScore: Math.round(stabilityScore),
      efficiencyScore: Math.round(efficiencyScore),
      cognitiveDecline: Math.round(cognitiveDecline),
      severityIndex: Math.round(severityIndex)
    };
  }

  /**
   * Forecasts future damage progression metrics over the next 48 hours.
   * @param {number} currentHours - Current sleep deprivation hours
   * @param {number} recovery - Recovery fraction (0-1)
   */
  function generateForecast(currentHours, recovery = 0) {
    const forecastPoints = [];
    const stepHours = 8;
    const forecastHorizon = 48;
    
    for (let offset = 0; offset <= forecastHorizon; offset += stepHours) {
      const projectedHours = currentHours + offset;
      
      // Generate cellular and network variables at projected hours (assuming no sleep/recovery yet)
      const cellular = getCellularStress(projectedHours, recovery);
      const network = getNetworkMetrics(projectedHours, recovery);
      
      forecastPoints.push({
        timeOffset: `+${offset}h`,
        atp: Math.round(cellular.atp),
        ros: Math.round(cellular.ros),
        damage: Math.round(network.cognitiveDecline),
        connectivity: Math.round(network.connectivityScore)
      });
    }
    
    return forecastPoints;
  }

  // Exposed API
  return {
    getCellularStress,
    generateNeuronSpikes,
    getNetworkMetrics,
    generateForecast,
    config: CONFIG
  };
})();
