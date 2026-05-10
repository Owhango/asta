
import React, { useMemo, useState } from "react";

export default function App() {
  const [values, setValues] = useState({
    stability: "",
    flow: "",
    airVoids: "",
    bitumen: "",
    vma: "",
  });

  function update(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  const analysis = useMemo(() => {
    const issues = [];
    const good = [];

    const stability = Number(values.stability);
    const flow = Number(values.flow);
    const air = Number(values.airVoids);
    const bit = Number(values.bitumen);
    const vma = Number(values.vma);

    if (stability >= 15) {
      good.push("Stability acceptable.");
    } else {
      issues.push("Low stability.");
    }

    if (flow > 4) {
      issues.push("Flow too high.");
    } else if (flow >= 2) {
      good.push("Flow acceptable.");
    }

    if (air >= 4 && air <= 7) {
      good.push("Air voids acceptable.");
    } else {
      issues.push("Air voids outside spec.");
    }

    if (bit < 4.4) {
      issues.push("Binder low.");
    }

    if (vma >= 14) {
      good.push("VMA acceptable.");
    }

    return { issues, good };
  }, [values]);

  return (
    <div className="container">
      <div className="card">
        <h1>A.S.T.A – Asphalt Solutions Test Analysis</h1>
        <p>Enter asphalt test results below.</p>
      </div>

      <div className="card">
        <div className="grid">
          <div>
            <label>Stability (kN)</label>
            <input value={values.stability} onChange={(e)=>update("stability", e.target.value)} />
          </div>

          <div>
            <label>Flow (mm)</label>
            <input value={values.flow} onChange={(e)=>update("flow", e.target.value)} />
          </div>

          <div>
            <label>Air Voids (%)</label>
            <input value={values.airVoids} onChange={(e)=>update("airVoids", e.target.value)} />
          </div>

          <div>
            <label>Bitumen (%)</label>
            <input value={values.bitumen} onChange={(e)=>update("bitumen", e.target.value)} />
          </div>

          <div>
            <label>VMA (%)</label>
            <input value={values.vma} onChange={(e)=>update("vma", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Analysis</h2>

        {analysis.good.map((g, i)=>(
          <p key={i} className="good">✓ {g}</p>
        ))}

        {analysis.issues.map((g, i)=>(
          <p key={i} className="bad">✗ {g}</p>
        ))}

        {analysis.issues.length === 0 && (
          <p className="good"><strong>Overall: Conforming</strong></p>
        )}

        {analysis.issues.length > 0 && (
          <p className="warn"><strong>Overall: Investigation Required</strong></p>
        )}
      </div>
    </div>
  );
}


import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f3f4f6;
}
.container {
  max-width: 1000px;
  margin: auto;
  padding: 20px;
}
.card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(180px,1fr));
  gap: 12px;
}
input {
  width: 100%;
  padding: 10px;
}
.good { color: green; }
.bad { color: red; }
.warn { color: orange; }
