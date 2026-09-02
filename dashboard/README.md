# Computational Modeling of Sleep Deprivation Effects on Brain Connectivity Using VCell, NEURON, and Cytoscape

### *NeuroSleep Digital Twin Platform*

This is a clean, visual, and easy-to-understand **Digital Twin Platform** designed for academic project presentations and viva exhibitions. It demonstrates the direct cascading effects of sleep deprivation on cellular energy (VCell), neuron signal transmission (NEURON), and brain connectome pathways (Cytoscape).

---

## 🔬 How the Multi-Scale Model Works (Simplified)

Rather than separate panels, the interface connects three essential biological stages inside a unified live simulator:

1.  **Stage 1: Cellular Metabolism (VCell)**
    *   **What it does**: Simulates the energy levels inside cells. As sleep debt accumulates (from 0 to 72 hours), Cellular Energy (ATP) depletes, and Cellular Stress (ROS) builds up.
2.  **Stage 2: Electrical Spiking (NEURON)**
    *   **What it does**: Simulates the electrical action potentials (signals) transmitted by individual brain cells. In a healthy rested state, the signal is a crisp, rhythmic wave. As cellular energy drops, the signals become irregular, slow down, and ultimately fail.
3.  **Stage 3: Connectome Map (Cytoscape)**
    *   **What it does**: Maps communication across 13 major brain regions. Synaptic pathways weaken when electrical signals are unstable. In the map, healthy connections pulse in cyan/green, while damaged pathways fade and break (dashed red lines).

---

## 🖥️ Platform Visual Layout

The dashboard is structured to present these findings side-by-side with zero clutter:

*   **Left Column (Cellular & Electrical)**: Live dials for Cellular Energy and Stress, alongside an oscilloscope plotting the real-time electrical waves.
*   **Center Column (The Digital Twins)**: Shows the **3D Brain Model (Three.js)** and the **Neural Pathway Map (Cytoscape)** side-by-side. As you drag the timeline, both models react in real time.
*   **Right Column (Pathology & Compromise)**: Shows a plain-English explanation card summarizing the clinical effects at the current hour, alongside a circular progress dial tracking overall cognitive decline.

---

## 🚀 How to Run the Project

1.  **Locate** [index.html](file:///c:/Users/HP/Downloads/acm/index.html) in your project workspace.
2.  **Double-click `index.html`** to open it immediately in Chrome, Edge, or Firefox. 
3.  *(Optional)* For the best experience, open the workspace in VS Code, install the **Live Server** extension, and click **"Go Live"** to run it locally.

---

## 🎓 Tips for Presentation / Viva Exhibition

*   **Turn on Audio**: Click the **AUDIO: OFF** button in the header. The platform synthesizes real-time soundscapes (alpha/delta brainwave hums) that pitch down and gain static interference as sleep debt worsens, creating an immersive cinematic experience.
*   **Use Presentation Mode**: Click **"PRESENTATION MODE"** in the top-right header. The simulator will auto-run from 0 to 72 hours, then engage a recovery phase, while displaying subtitles that explain the science step-by-step.
*   **Interactive Node Queries**: Click on any node in the **Neural Pathway Map** (e.g., *Frontal Lobe* or *Thalamus*) to view a custom card detailing that region's role and sleep vulnerability.
