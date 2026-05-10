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

function entered(value) {
  return value !== "" && value !== null && value !== undefined && !isNaN(Number(value));
}

function buildAnalysis(psd, bitumen, density, marshall, comments) {
  const issues = [];
  const warnings = [];
  const good = [];
  const actions = [];
  const rootCauses = [];
  const designChanges = [];
  const immediateChecks = [];

  const commentText = comments.toLowerCase();

  const bitStatus = checkRange(bitumen, 4.4, 5.0);
  const airStatus = checkRange(density.airVoids, 4.0, 7.0);
  const flowStatus = checkRange(marshall.flow, 2.0, 4.0);

  const stabValue = Number(marshall.stability);
  const vmaValue = Number(density.vma);

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
    warnings.push("The lower fine fraction is below specification. This indicates the mix is running coarse or short of fines/filler through the mortar fraction.");
    rootCauses.push("Likely production/design contributors include insufficient dust/filler feed, fine aggregate deficiency, aggregate segregation, or a blend not matching the approved target grading.");
    designChanges.push("Increase the overall dust/filler contribution where practical and review the aggregate blend to bring the 0.600mm, 0.300mm, 0.150mm and 0.075mm sieves back toward target.");
    actions.push("Monitor the lower sieves closely during production. Low fines can reduce mortar cohesion, make the mix harsher, increase compaction sensitivity and increase ravelling/moisture risk.");
  }

  if (bitStatus === "pass") good.push("Bitumen content is within specification.");
  if (bitStatus === "low") {
    issues.push(`Bitumen content is LOW — actual ${bitumen}% vs spec 4.4-5.0%.`);
    actions.push("Confirm binder content by repeat extraction before making major production changes.");
    designChanges.push("If repeat testing confirms low binder, increase binder toward the approved target of 4.7%, or at minimum into the 4.5–4.7% range while monitoring air voids, stability and flow.");
  }
  if (bitStatus === "high") {
    issues.push(`Bitumen content is HIGH — actual ${bitumen}% vs spec 4.4-5.0%.`);
    rootCauses.push("High binder may be caused by binder pump calibration, density compensation error, incorrect set point, sampling error, or extraction/calculation issue.");
    actions.push("Check binder pump calibration, bitumen flow meter, density input, production set point and extraction calculation.");
  }

  if (airStatus === "pass") good.push("Air voids are within specification.");
  if (airStatus === "low") {
    issues.push(`Air voids are LOW — actual ${density.airVoids}% vs spec 4.0-7.0%.`);
    rootCauses.push("Low air voids may indicate rich mix, excessive fines, over-compaction, high density or reduced void structure.");
  }
  if (airStatus === "high") {
    issues.push(`Air voids are HIGH — actual ${density.airVoids}% vs spec 4.0-7.0%.`);
    rootCauses.push("High air voids may indicate low binder, coarse grading, insufficient fines, poor compaction or harsh aggregate structure.");
  }

  if (entered(density.vma)) {
    if (vmaValue >= 14) good.push("VMA is acceptable.");
    else {
      issues.push(`VMA is LOW — actual ${density.vma}% vs spec >14%.`);
      rootCauses.push("Low VMA may indicate over-packed aggregate grading, insufficient void structure or poor aggregate blend balance.");
    }
  }

  if (flowStatus === "pass") good.push("Marshall Flow is within specification.");
  if (flowStatus === "high") {
    issues.push(`Marshall Flow is HIGH — actual ${marshall.flow}mm vs spec 2.0-4.0mm.`);
    rootCauses.push("High flow may indicate soft/tender mix, excess binder, weak aggregate skeleton, poor sample conditioning, Marshall timing issue, water bath issue, or flow gauge/machine issue.");
    immediateChecks.push("Verify Marshall testing timing, water bath temperature, conditioning duration, transfer time from bath to machine, machine calibration and flow gauge operation.");
  }
  if (flowStatus === "low") {
    issues.push(`Marshall Flow is LOW — actual ${marshall.flow}mm vs spec 2.0-4.0mm.`);
    rootCauses.push("Low flow may indicate stiff/brittle mix, low binder content, harsh grading, excessive filler or sample/testing issue.");
  }

  if (entered(marshall.stability)) {
    if (stabValue >= 8) good.push("Marshall Stability is within specification.");
    else {
      issues.push(`Marshall Stability is LOW — actual ${marshall.stability}kN vs spec >8.0kN.`);
      rootCauses.push("Low stability may indicate weak aggregate structure, excess binder, poor compaction, low density, poor sample preparation or testing issue.");
    }
  }

  if (flowStatus === "high" && bitStatus === "low" && airStatus === "pass" && entered(marshall.stability) && stabValue >= 8) {
    warnings.push("The result pattern is technically inconsistent: Flow is high, but binder is low, air voids are acceptable and stability is acceptable. This does not strongly support a normal production-rich mix failure.");
    rootCauses.push("The low binder result may be a flyer or extraction/calculation issue, particularly if production settings and other volumetric results do not support a genuinely lean mix.");
    immediateChecks.push("Repeat binder extraction and independently check sample mass, extraction process, filter/fines correction, oven drying, calculation and sample identification.");
  }

  if (commentText.includes("time limit") || commentText.includes("warning")) {
    warnings.push("Entered comments identify a test time limit/warning issue. This directly affects confidence in the Marshall Flow result.");
    rootCauses.push("The elevated Flow result may be influenced by testing validity, conditioning time or timing compliance rather than production mix behaviour alone.");
    immediateChecks.push("Repeat Marshall Stability and Flow testing under controlled timing conditions before accepting the Flow value as representative.");
  }

  if (commentText.includes("pump") || commentText.includes("bitumen pump")) {
    immediateChecks.push("Comment references pump/binder system. Check bitumen pump calibration, flow meter, density input and binder delivery stability.");
  }

  if (commentText.includes("segregation")) {
    rootCauses.push("Comment references segregation. Review stockpile management, loader practice, cold feed consistency and sample splitting.");
  }

  if (commentText.includes("temperature") || commentText.includes("water bath")) {
    immediateChecks.push("Comment references temperature/water bath. Verify thermometers, bath temperature, conditioning period and sample transfer time.");
  }

  if (issues.length === 0) {
    good.push("Overall result appears conforming based on entered values. Mix appears acceptable against the entered MRWA limits.");
    actions.push("Continue monitoring trends against the approved mix design targets. Consider tightening any results close to limits before they become non-conforming.");
  }

  return { issues, warnings, good, actions, rootCauses, designChanges, immediateChecks, psdResults };
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
  const [marshall, setMarshall] = useState({ flow: "", stability: "" });
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const analysis = useMemo(() => {
    if (!submitted) return null;
    return buildAnalysis(psd, bitumen, density, marshall, comments);
  }, [submitted, psd, bitumen, density, marshall, comments]);

  function updatePsd(sieve, value) {
    setPsd((prev) => ({ ...prev, [sieve]: value }));
  }

  function updateDensity(key, value) {
    setDensity((prev) => ({ ...prev, [key]: value }));
  }

  function updateMarshall(key, value) {
    setMarshall((prev) => ({ ...prev, [key]: value }));
  }

  function analyseResults() {
    setSubmitted(true);
  }

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
                    <input value={psd[row.sieve] || ""} onChange={(e) => updatePsd(row.sieve, e.target.value)} />
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
          <label>Actual Binder Content %<input value={bitumen} onChange={(e) => setBitumen(e.target.value)} /></label>
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
        <button className="analyseButton" onClick={analyseResults}>Analyse Results</button>
      </div>

      {analysis && (
        <div className="card summary">
          <h2>Technical Summary Report</h2>

          {analysis.issues.length === 0 ? (
            <h3 className="pass">OVERALL: CONFORMING</h3>
          ) : (
            <h3 className="fail">OVERALL: NON-CONFORMING / INVESTIGATION REQUIRED</h3>
          )}

          <h4>Good Areas</h4>
          {analysis.good.map((item, i) => <p key={i} className="pass">✓ {item}</p>)}

          <h4>Non-Conformances / Failed Areas</h4>
          {analysis.issues.length === 0 ? <p>No major non-conformances detected.</p> : analysis.issues.map((item, i) => <p key={i} className="fail">✗ {item}</p>)}

          <h4>Technical Warnings</h4>
          {analysis.warnings.length === 0 ? <p>No unusual technical warnings detected.</p> : analysis.warnings.map((item, i) => <p key={i} className="warn">⚠ {item}</p>)}

          <h4>Likely Root Causes</h4>
          {analysis.rootCauses.length === 0 ? <p>No specific root causes identified from entered data.</p> : analysis.rootCauses.map((item, i) => <p key={i}>• {item}</p>)}

          <h4>Immediate Checks Required</h4>
          {analysis.immediateChecks.length === 0 ? <p>No immediate checks triggered beyond normal review.</p> : analysis.immediateChecks.map((item, i) => <p key={i}>• {item}</p>)}

          <h4>Mix Design / Production Adjustments To Consider</h4>
          {analysis.designChanges.length === 0 ? <p>No mix design adjustment is currently recommended from the entered data.</p> : analysis.designChanges.map((item, i) => <p key={i}>• {item}</p>)}

          <h4>Recommended Actions</h4>
          {analysis.actions.length === 0 ? <p>Continue monitoring against targets.</p> : analysis.actions.map((item, i) => <p key={i}>• {item}</p>)}

          {comments && (
            <>
              <h4>Entered Comments / Site Notes Considered</h4>
              <p>{comments}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
