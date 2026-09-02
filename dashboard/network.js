/**
 * NeuroSleep Digital Twin Platform - Brain Connectivity Engine (network.js)
 * Manages Cytoscape.js connectome graph mapping anatomical brain regions and synaptic weights.
 */

window.NeuroNetwork = (function() {
  let cy = null;
  let currentSeverity = 0;
  let clickCallback = null;

  // Nodes list mapping to anatomical brain layout (X-Y layout coordinates)
  const BRAIN_REGIONS = [
    { id: 'FL_L', label: 'Frontal Lobe (L)', x: 120, y: 150, description: 'Executive function, cognitive control, highly vulnerable to ATP depletion.' },
    { id: 'FL_R', label: 'Frontal Lobe (R)', x: 380, y: 150, description: 'Decision making, attention, suffers high synaptic wear during sleep debt.' },
    { id: 'TL_L', label: 'Temporal Lobe (L)', x: 80, y: 250, description: 'Auditory processing, memory structures, exhibits firing irregularities.' },
    { id: 'TL_R', label: 'Temporal Lobe (R)', x: 420, y: 250, description: 'Language comprehension, memory consolidation, sleep-dependent repair.' },
    { id: 'PL_L', label: 'Parietal Lobe (L)', x: 160, y: 80, description: 'Sensory integration, spatial awareness, mild coordination decay.' },
    { id: 'PL_R', label: 'Parietal Lobe (R)', x: 340, y: 80, description: 'Attention allocation, sensory processing, sleep-deprivation delays.' },
    { id: 'OL_L', label: 'Occipital Lobe (L)', x: 180, y: 340, description: 'Visual cortex, visual processing, sleep debt causes visual lapses/hallucinations.' },
    { id: 'OL_R', label: 'Occipital Lobe (R)', x: 320, y: 340, description: 'Visual field mapping, integration, visual attention drops.' },
    { id: 'TH_C', label: 'Thalamus', x: 250, y: 200, description: 'Sensory relay hub, controls sleep-wake gating, suffers synchronization failure.' },
    { id: 'HP_C', label: 'Hippocampus', x: 250, y: 260, description: 'Memory consolidation, high theta-wave density, sensitive to ROS damage.' },
    { id: 'AM_L', label: 'Amygdala (L)', x: 190, y: 240, description: 'Emotional regulation, hyperactive and desynchronized during sleep debt.' },
    { id: 'AM_R', label: 'Amygdala (R)', x: 310, y: 240, description: 'Fear/threat processing, emotional instability indicator.' },
    { id: 'BS_C', label: 'Brainstem', x: 250, y: 380, description: 'Reticular Activating System (RAS) origin, drives arousal, severely fatigued.' }
  ];

  // Base connections with their default structural weight (0.0 to 1.0)
  const BRAIN_TRACTS = [
    { source: 'BS_C', target: 'TH_C', weight: 0.9, type: 'arousal' },
    { source: 'TH_C', target: 'FL_L', weight: 0.8, type: 'thalamocortical' },
    { source: 'TH_C', target: 'FL_R', weight: 0.8, type: 'thalamocortical' },
    { source: 'TH_C', target: 'PL_L', weight: 0.7, type: 'thalamocortical' },
    { source: 'TH_C', target: 'PL_R', weight: 0.7, type: 'thalamocortical' },
    { source: 'TH_C', target: 'HP_C', weight: 0.85, type: 'limbic' },
    { source: 'HP_C', target: 'AM_L', weight: 0.75, type: 'limbic' },
    { source: 'HP_C', target: 'AM_R', weight: 0.75, type: 'limbic' },
    { source: 'HP_C', target: 'FL_L', weight: 0.8, type: 'corticolimbic' },
    { source: 'HP_C', target: 'FL_R', weight: 0.8, type: 'corticolimbic' },
    { source: 'AM_L', target: 'FL_L', weight: 0.7, type: 'emotional-control' },
    { source: 'AM_R', target: 'FL_R', weight: 0.7, type: 'emotional-control' },
    { source: 'FL_L', target: 'FL_R', weight: 0.95, type: 'commissural' },
    { source: 'PL_L', target: 'PL_R', weight: 0.85, type: 'commissural' },
    { source: 'OL_L', target: 'OL_R', weight: 0.8, type: 'commissural' },
    { source: 'FL_L', target: 'PL_L', weight: 0.65, type: 'association' },
    { source: 'FL_R', target: 'PL_R', weight: 0.65, type: 'association' },
    { source: 'PL_L', target: 'OL_L', weight: 0.75, type: 'association' },
    { source: 'PL_R', target: 'OL_R', weight: 0.75, type: 'association' },
    { source: 'TL_L', target: 'FL_L', weight: 0.6, type: 'association' },
    { source: 'TL_R', target: 'FL_R', weight: 0.6, type: 'association' },
    { source: 'TH_C', target: 'OL_L', weight: 0.5, type: 'visual-relay' },
    { source: 'TH_C', target: 'OL_R', weight: 0.5, type: 'visual-relay' }
  ];

  /**
   * Initializes Cytoscape graph in the container element
   */
  function init(container, onNodeClick) {
    if (!container) return;
    clickCallback = onNodeClick;

    // Convert regions/tracts to cytoscape element formats
    const elements = [];
    
    // Add Nodes
    BRAIN_REGIONS.forEach(node => {
      elements.push({
        group: 'nodes',
        data: {
          id: node.id,
          label: node.label,
          desc: node.description,
          status: 'healthy',
          vulnerability: getVulnerability(node.id)
        },
        position: { x: node.x, y: node.y }
      });
    });

    // Add Edges
    BRAIN_TRACTS.forEach((edge, idx) => {
      elements.push({
        group: 'edges',
        data: {
          id: `e_${idx}`,
          source: edge.source,
          target: edge.target,
          baseWeight: edge.weight,
          weight: edge.weight,
          type: edge.type,
          status: 'stable'
        }
      });
    });

    // Initialize Cytoscape
    cy = cytoscape({
      container: container,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'content': 'data(label)',
            'text-valign': 'bottom',
            'text-margin-y': 8,
            'color': '#94a3b8',
            'font-size': '10px',
            'font-family': 'JetBrains Mono, monospace',
            'background-color': '#00f0ff',
            'width': '18px',
            'height': '18px',
            'border-width': '2px',
            'border-color': '#ffffff',
            'border-opacity': 0.8,
            'transition-property': 'background-color, border-color, width, height, shadow-blur',
            'transition-duration': '0.3s',
            // Cyber glow effect
            'shadow-color': '#00f0ff',
            'shadow-blur': '8px',
            'shadow-opacity': 0.6
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 'mapData(weight, 0, 1, 1, 5)',
            'line-color': '#0284c7',
            'opacity': 0.7,
            'curve-style': 'bezier',
            'control-point-step-size': '25px',
            'transition-property': 'line-color, opacity, width',
            'transition-duration': '0.3s'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#facc15',
            'border-width': '3px',
            'width': '22px',
            'height': '22px',
            'shadow-blur': '16px'
          }
        },
        // Sleep-deprived status styles
        {
          selector: 'node.stressed',
          style: {
            'background-color': '#e11d48',
            'shadow-color': '#f43f5e',
            'border-color': '#fda4af'
          }
        },
        {
          selector: 'node.warn',
          style: {
            'background-color': '#f97316',
            'shadow-color': '#fb923c',
            'border-color': '#ffedd5'
          }
        },
        {
          selector: 'edge.weakened',
          style: {
            'line-color': '#f97316',
            'opacity': 0.4
          }
        },
        {
          selector: 'edge.broken',
          style: {
            'line-color': '#e11d48',
            'opacity': 0.08,
            'line-style': 'dashed',
            'width': '1px'
          }
        },
        // Highlight active signals
        {
          selector: 'edge.active-pulse',
          style: {
            'line-color': '#ffffff',
            'width': '6px',
            'opacity': 1.0
          }
        }
      ],
      layout: {
        name: 'preset' // Using absolute coordinates mapping anatomy
      },
      userZoomingEnabled: false,
      userPanningEnabled: false,
      boxSelectionEnabled: false
    });

    // Add interactivity click actions
    cy.on('tap', 'node', function(evt){
      const node = evt.target;
      cy.$('node').unselect();
      node.select();
      
      if (clickCallback) {
        clickCallback({
          id: node.data('id'),
          label: node.data('label'),
          desc: node.data('desc'),
          vulnerability: node.data('vulnerability')
        });
      }
    });

    // Start network impulse cycle
    startPulseInterval();
  }

  /**
   * Helper to fetch region specific vulnerability percentage
   */
  function getVulnerability(id) {
    if (id.startsWith('FL_')) return 92; // Frontal Lobe is highly sensitive
    if (id === 'TH_C') return 88; // Thalamic gate suffers high strain
    if (id === 'HP_C') return 85; // Memory structures suffer high synaptic damage
    if (id === 'BS_C') return 78; // Reticular system
    if (id.startsWith('AM_')) return 65; // Amygdala goes hyper-active
    return 45; // Default sensory cortex
  }

  /**
   * Updates edge weights and styles dynamically based on global sleep deprivation severity
   * @param {number} severity - Severity score (0 to 100)
   */
  function updateNetwork(severity) {
    currentSeverity = severity;
    if (!cy) return;

    const ratio = severity / 100;

    // 1. Update edges based on synaptic decay
    cy.edges().forEach(edge => {
      const baseWeight = edge.data('baseWeight');
      const sourceVal = getVulnerability(edge.data('source')) / 100;
      const targetVal = getVulnerability(edge.data('target')) / 100;
      
      // Calculate joint vulnerability of connection
      const jointVuln = (sourceVal + targetVal) / 2;
      
      // Calculate new dynamic weight (decay weight based on severity & vulnerability)
      const currentWeight = Math.max(0.02, baseWeight * (1 - ratio * 0.8 * jointVuln));
      edge.data('weight', currentWeight);

      // Classify connection state
      edge.removeClass('weakened broken');
      
      if (currentWeight < 0.2) {
        edge.addClass('broken');
      } else if (currentWeight < 0.5) {
        edge.addClass('weakened');
      }
    });

    // 2. Update nodes based on cellular exhaustion
    cy.nodes().forEach(node => {
      const vuln = node.data('vulnerability') / 100;
      const nodeStress = ratio * vuln;
      
      node.removeClass('stressed warn');
      
      if (nodeStress > 0.65) {
        node.addClass('stressed');
      } else if (nodeStress > 0.3) {
        node.addClass('warn');
      }
    });
  }

  /**
   * Periodically triggers synaptic "signal pulses" down edges to show network flow.
   * Rates and latency are affected by network health.
   */
  let pulseInterval = null;
  function startPulseInterval() {
    if (pulseInterval) clearInterval(pulseInterval);

    pulseInterval = setInterval(() => {
      if (!cy || cy.destroyed()) return;

      // Select active edges to trigger a signal animation
      const activeEdges = cy.edges().filter(e => !e.hasClass('broken'));
      if (activeEdges.length === 0) return;

      // Select random subset of connections to pulse (pulse density drops with severity)
      const pulseDensity = Math.max(1, Math.floor(4 * (1 - 0.8 * (currentSeverity / 100))));
      
      for (let i = 0; i < pulseDensity; i++) {
        const idx = Math.floor(Math.random() * activeEdges.length);
        const edge = activeEdges[idx];

        // Animate Cytoscape edge briefly using style classes
        edge.addClass('active-pulse');
        setTimeout(() => {
          if (cy && !cy.destroyed()) {
            edge.removeClass('active-pulse');
          }
        }, 180);
      }
    }, 400);
  }

  // Exposed API
  return {
    init,
    updateNetwork,
    destroy: () => {
      if (pulseInterval) clearInterval(pulseInterval);
      if (cy) {
        cy.destroy();
        cy = null;
      }
    }
  };
})();
