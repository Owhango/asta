import React, { useMemo, useState } from "react";

const psdSpecs = [
  { sieve: "26.50mm", target: 100, min: 100, max: 100 },
  { sieve: "19.00mm", target: 100, min: 100, max: 100 },
  { sieve: "13.20mm", target: 96.5, min: 93, max: 100 },
  { sieve: "9.50mm", target: 75, min: 68, max: 82 },
  { sieve: "6.70mm", target: 64, min: 57, max: 71 },
  { sieve: "4.75mm", target: 55, min: 48, max: 62 },
  { sieve: "2.36mm", target: 38, min: 33, max: 43 },
  { sieve: "1.18mm", target: 26, min: 21, max: 31 },
  { sieve: "0.600mm", target: 18, min: 14, max: 22 },
  { sieve: "0.300mm", target: 13, min: 9, max: 17 },
  { sieve: "0.150mm", target: 9.5, min: 7, max: 12 },
  { sieve: "0.075mm", target: 4.5, min: 3, max: 6 },
];

function checkRange(value, min, max) {
  const n = Number(value);
  if (value === "" || isNaN(n)) return "blank";
  if (n < min) return "low";
  if (n > max) return "high";
  return "pass";
}

function resultText(status) {
  if (status === "pass") return "PASS";
  if (status === "low") return "LOW";
  if (status === "high") return "HIGH";
  return "";
}

export default function App() {
  const [psd, setPsd] = useState({});
  const [bitumen, setBitumen] = useState("");
  const [density, setDensity] = useState({
    compTemp: "",
    volume: "",
    bulkDensity: "",
    maxDensity: "",
    airVoids: "",
    vma: "",
  });
  const [marshall, setMarshall] = useState({
    flow: "",
    stability: "",
  });
  const [comments, setComments] = useState("");

  function updatePsd(sieve, value) {
    setPsd((prev) => ({ ...prev, [sieve]: value }));
  }

  function updateDensity(key, value) {
    setDensity((prev) => ({ ...prev, [key]: value }));
  }

  function updateMarshall(key, value) {
    setMarshall((prev) => ({ ...prev, [key]: value }));
  }

  const analysis = useMemo(() => {
    const issues = [];
    const warnings = [];
    const good = [];
    const actions = [];

    const psdResults = psdSpecs.map((s) => ({
      ...s,
      actual: psd[s.sieve] || "",
      status: checkRange(psd[s.sieve], s.min, s.max),
    }));

    const failedPsd = psdResults.filter((r) => r.status === "low" || r.status === "high");

    failedPsd.forEach((r) => {
      issues.push(`${r.sieve} PSD is ${r.status.toUpperCase()} — actual ${r.actual}% vs spec ${r.min}-${r.max}%.`);
    });

    const lowFines = failedPsd.filter((r) =>
      ["0.600mm", "0.300mm", "0.150mm", "0.075mm"].includes(r.sieve) && r.status === "low"
    );

    if (lowFines.length > 0) {
      actions.push("Lower fine fraction is low. Mix may be running coarse/short on dust or filler. Review dust/filler feed and fine aggregate blend.");
      warnings.push("Low fines can reduce mortar cohesion, increase harshness, affect compaction, and increase ravelling/moisture risk.");
    }

    const bitStatus = checkRange(bitumen, 4.4, 5.0);
    if (bitStatus === "pass") good.push("Bitumen content is within specification.");
    if (bitStatus === "low") {
      issues.push(`Bitumen content is LOW — actual ${bitumen}% vs spec 4.4-5.0%.`);
      actions.push("Consider increasing binder toward target, around 4.7%, if confirmed by repeat extraction and production checks.");
    }
    if (bitStatus === "high") {
      issues.push(`Bitumen content is HIGH — actual ${bitumen}% vs spec 4.4-5.0%.`);
      actions.push("Review binder pump calibration, flow meter, density compensation and production set point.");
    }

    const airStatus = checkRange(density.airVoids, 4.0, 7.0);
    if (airStatus === "pass") good.push("Air voids are within specification.");
    if (airStatus === "low") {
      issues.push(`Air voids are LOW — actual ${density.airVoids}% vs spec 4.0-7.0%.`);
      actions.push("Low air voids may indicate rich mix, over-compaction, excessive fines, or low void structure.");
    }
    if (airStatus === "high") {
      issues.push(`Air voids are HIGH — actual ${density.airVoids}% vs spec 4.0-7.0%.`);
      actions.push("High air voids may indicate low binder, coarse grading, poor compaction, or insufficient fines.");
    }

    const vmaValue = Number(density.vma);
    if (density.vma !== "" && !isNaN(vmaValue)) {
      if (vmaValue >= 14) good.push("VMA is acceptable.");
      else {
        issues.push(`VMA is LOW — actual ${density.vma}% vs spec >14%.`);
        actions.push("Low VMA may reduce binder film thickness and durability. Review aggregate packing and grading.");
      }
    }

    const flowStatus = checkRange(marshall.flow, 2.0, 4.0);
    if (flowStatus === "pass") good.push("Marshall Flow is within specification.");
    if (flowStatus === "low") {
      issues.push(`Marshall Flow is LOW — actual ${marshall.flow}mm vs spec 2.0-4.0mm.`);
      actions.push("Low flow may indicate stiff/brittle mix, low binder, harsh grading, or excessive filler.");
    }
    if (flowStatus === "high") {
      issues.push(`Marshall Flow is HIGH — actual ${marshall.flow}mm vs spec 2.0-4.0mm.`);
      actions.push("High flow may indicate soft/tender mix, excess binder, weak aggregate structure, or Marshall testing/conditioning issue.");
    }

    const stabValue = Number(marshall.stability);
    if (marshall.stability !== "" && !isNaN(stabValue)) {
      if (stabValue >= 8) good.push("Marshall Stability is within specification.");
      else {
        issues.push(`Marshall Stability is LOW — actual ${marshall.stability}kN vs spec >8.0kN.`);
        actions.push("Low stability may indicate weak aggregate structure, excess binder, poor compaction, or sample/testing issue.");
      }
    }

    if (
      flowStatus === "high" &&
      bitStatus !== "high" &&
      airStatus === "pass" &&
      stabValue >= 8
    ) {
      warnings.push("High Flow does not fully correlate with otherwise acceptable stability/air voids. Review Marshall timing, conditioning, water bath temperature, flow gauge and machine calibration before assuming production issue.");
    }

    if (issues.length === 0) {
      good.push("Overall result appears conforming based on entered values. Mix appears acceptable, but continue monitoring trends against target values.");
    }

    return { issues, warnings, good, actions, psdResults };
  }, [psd, bitumen, density, marshall]);

  return (
    <div className="container">
      <div className="card header">
        <h1>A.S.T.A – Asphalt Solutions Test Analysis</h1>
        <p>MRWA DG14 75B test result review and mix feedback system.</p>
      </div>

      <div className="card">
        <h2>PSD</h2>
        <table>
          <thead>
            <tr>
              <th>Sieve</th>
              <th>Target % Passing</th>
              <th>Specification</th>
              <th>Actual % Passing</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {psdSpecs.map((row) => {
              const status = checkRange(psd[row.sieve], row.min, row.max);
              return (
                <tr key={row.sieve}>
                  <td>{row.sieve}</td>
                  <td>{row.target}%</td>
                  <td>{row.min} - {row.max}%</td>
                  <td>
                    <input
                      value={psd[row.sieve] || ""}
                      onChange={(e) => updatePsd(row.sieve, e.target.value)}
                    />
                  </td>
                  <td className={status}>{resultText(status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Bitumen Content</h2>
        <div className="grid">
          <label>
            Actual Binder Content %
            <input value={bitumen} onChange={(e) => setBitumen(e.target.value)} />
          </label>
          <p><strong>Target:</strong> 4.7%</p>
          <p><strong>Spec:</strong> 4.4 - 5.0%</p>
        </div>
      </div>

      <div className="card">
        <h2>Marshall Density and Voids</h2>
        <div className="grid">
          <label>Average Compaction Temperature <input value={density.compTemp} onChange={(e) => updateDensity("compTemp", e.target.value)} /></label>
          <label>Average Volume <input value={density.volume} onChange={(e) => updateDensity("volume", e.target.value)} /></label>
          <label>Average Bulk Density <input value={density.bulkDensity} onChange={(e) => updateDensity("bulkDensity", e.target.value)} /></label>
          <label>Maximum Density <input value={density.maxDensity} onChange={(e) => updateDensity("maxDensity", e.target.value)} /></label>
          <label>Average Air Voids % <input value={density.airVoids} onChange={(e) => updateDensity("airVoids", e.target.value)} /></label>
          <label>Total V.M.A % <input value={density.vma} onChange={(e) => updateDensity("vma", e.target.value)} /></label>
        </div>
        <p><strong>Air Voids Target:</strong> 5.5% | <strong>Spec:</strong> 4.0 - 7.0%</p>
        <p><strong>VMA Spec:</strong> &gt; 14%</p>
      </div>

      <div className="card">
        <h2>Stability and Flow</h2>
        <div className="grid">
          <label>Average Flow mm <input value={marshall.flow} onChange={(e) => updateMarshall("flow", e.target.value)} /></label>
          <label>Average Stability kN <input value={marshall.stability} onChange={(e) => updateMarshall("stability", e.target.value)} /></label>
        </div>
        <p><strong>Flow Target:</strong> 3.0mm | <strong>Spec:</strong> 2.0 - 4.0mm</p>
        <p><strong>Stability Spec:</strong> &gt; 8.0kN</p>
      </div>

      <div className="card">
        <h2>Comments</h2>
        <textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Add test notes, site observations, warnings, plant comments, timing issues, etc." />
      </div>

      <div className="card summary">
        <h2>Summary</h2>

        {analysis.issues.length === 0 ? (
          <h3 className="pass">OVERALL: CONFORMING</h3>
        ) : (
          <h3 className="fail">OVERALL: NON-CONFORMING / INVESTIGATION REQUIRED</h3>
        )}

        <h4>Good Areas</h4>
        {analysis.good.map((item, i) => <p key={i} className="pass">✓ {item}</p>)}

        <h4>Issues / Non-Conformances</h4>
        {analysis.issues.length === 0 ? <p>No major non-conformances detected.</p> : analysis.issues.map((item, i) => <p key={i} className="fail">✗ {item}</p>)}

        <h4>Technical Warnings</h4>
        {analysis.warnings.length === 0 ? <p>No unusual technical warnings detected.</p> : analysis.warnings.map((item, i) => <p key={i} className="warn">⚠ {item}</p>)}

        <h4>Recommended Actions</h4>
        {analysis.actions.length === 0 ? <p>Continue monitoring against targets.</p> : analysis.actions.map((item, i) => <p key={i}>• {item}</p>)}

        {comments && (
          <>
            <h4>Entered Comments</h4>
            <p>{comments}</p>
          </>
        )}
      </div>
    </div>
  );
}
