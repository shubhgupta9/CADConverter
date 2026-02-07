# 🛠️ CAD-Recon AI: Industrial Mesh-to-B-Rep System

[![Graphics](https://img.shields.io/badge/Graphics-Three.js_/_R3F-000000?style=for-the-badge)](https://threejs.org/)
[![Industry](https://img.shields.io/badge/Field-Industrial_Design-orange?style=for-the-badge)](#)

> **Neural Reconstruction of Unstructured Meshes.** Convert "dumb" STL point clouds into "smart" parametric B-Rep geometry with the power of Google Gemini.

---

## 🚀 Purpose
In industrial workflows, STL files are often "dead" geometry—triangulated meshes that are difficult to edit or use for precision manufacturing. **CAD-Recon AI** uses deep-learning analysis to bridge this gap. It scans unstructured topology, detects engineering primitives (holes, pockets, fillets), and generates valid B-Rep reconstruction paths.

---

## ✨ Features

*   **⚡ Rapid Feature Detection**: Automatically identifies Holes, Fillets, Chamfers, and Extrusions.
*   **📐 Precise Parameterization**: Extracts exact diameters, depths, and radii for reconstruction.
*   **📦 High-Density Core**: Support for massive industrial meshes up to **150MB** and **10 Million facets**.
*   **🔍 Interactive 3D HUD**: High-tech labels and overlays directly in the 3D viewport.
*   **📝 Industrial Export**: Generate mock-up **STEP (.stp)** files based on detected parametric data.
*   **🕰️ Session Archive**: Persistent history of scans and analyses.

---

## 💻 Running Locally

### 1. Prerequisites
Ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 2. Setup
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/cad-recon-ai.git
cd cad-recon-ai
npm install
```

### 3. Environment Configuration
The project requires a **AI API Key**.
1.  Get your API Key.
2.  Create a file named `.env` in the project root.
3.  Add the following line to the file:
```env
VITE_API_KEY=your_api_key_here
VITE_API_HOST=your_api_host
```

### 4. Launch
Start the development server:
```bash
npm start
```
The app will be available at `http://localhost:3000`.

---

## 🛠️ Usage Workflow

1.  **IMPORT**: Drag and drop your `.stl` file into the "Neural Recon v4" workspace.
2.  **PREVIEW**: Use the OrbitControls to inspect the raw mesh topology.
3.  **INITIALIZE**: Click the **"Initialize AI Reconstruction"** button. The Gemini engine will perform a topological scan.
4.  **INSPECT**: Click on detected nodes (spheres) in the 3D view to view exact geometric parameters.
5.  **SYNTHESIZE**: Toggle the **B-Rep Preview** to see the cleaned surface reconstruction.
6.  **EXPORT**: Download the industrial **STEP** report for your CAD software (SolidWorks, AutoCAD, etc.).

---

## 🧠 Tech Stack

*   **Frontend**: React 19 + TypeScript
*   **Graphics**: Three.js, React Three Fiber, React Three Drei
*   **AI**: gwdg.mistral-large-instruct (Uni API Key)
*   **Styling**: Tailwind CSS + Lucide Icons
*   **State**: React Hooks (useState/useEffect)

---

## ⚠️ Disclaimer
*This tool is an industrial prototype. The STEP export provides the topological map of the part based on AI detection. For safety-critical parts, always verify AI-detected dimensions against the original source data.*

---

<div align="center">
  <p>Built for the next generation of digital manufacturing.</p>
  <b>CAD-RECON | [Industrial Recon System]</b>
</div>
