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
    rootCauses.push("Likely contributors include insufficient dust/filler feed, fine aggregate deficiency, segregation, or a blend not matching the approved target grading.");
    designChanges.push("Increase overall dust/filler contribution where practical and review the aggregate blend to bring lower sieves back toward target.");
    actions.push("Monitor lower sieves closely during production. Low fines can reduce mortar cohesion, increase harshness, affect compaction and increase ravelling/moisture risk.");
  }

  if (bitStatus === "pass") good.push("Bitumen content is within specification.");
  if (bitStatus === "low") {
    issues.push(`Bitumen content is LOW — actual ${bitumen}% vs spec 4.4-5.0%.`);
    actions.push("Confirm binder content by repeat extraction before making major production changes.");
    designChanges.push("If repeat testing confirms low binder, increase binder toward target 4.7%, or at least 4.5–4.7%, while monitoring air voids, stability and flow.");
  }
  if (bitStatus === "high") {
    issues.push(`Bitumen content is HIGH — actual ${bitumen}% vs spec 4.4-5.0%.`);
    rootCauses.push("High binder may be caused by pump calibration, density compensation error, incorrect set point, sampling error, or extraction/calculation issue.");
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
    rootCauses.push("High flow may indicate soft/tender mix, excess binder, weak aggregate skeleton, poor sample conditioning, timing issue, water bath issue, or flow gauge/machine issue.");
    immediateChecks.push("Verify Marshall timing, bath temperature, conditioning duration, transfer time, machine calibration and flow gauge operation.");
  }
  if (flowStatus === "low") {
    issues.push(`Marshall Flow is LOW — actual ${marshall.flow}mm vs spec 2.0-4.0mm.`);
    rootCauses.push("Low flow may indicate stiff/brittle mix, low binder, harsh grading, excessive filler or sample/testing issue.");
  }

  if (entered(marshall.stability)) {
    if (stabValue >= 8) good.push("Marshall Stability is within specification.");
    else {
      issues.push(`Marshall Stability is LOW — actual ${marshall.stability}kN vs spec >8.0kN.`);
      rootCauses.push("Low stability may indicate weak aggregate structure, excess binder, poor compaction, low density, poor sample preparation or testing issue.");
    }
  }

  if (flowStatus === "high" && bitStatus === "low" && airStatus === "pass" && entered(marshall.stability) && stabValue >= 8) {
    warnings.push("The result pattern is technically inconsistent: Flow is high, but binder is low, air voids are acceptable and stability is acceptable.");
    rootCauses.push("The low binder result may be a flyer or extraction/calculation issue if production settings and other volumetrics do not support a genuinely lean mix.");
    immediateChecks.push("Repeat binder extraction and independently check sample mass, extraction process, filter/fines correction, drying, calculation and sample identification.");
  }

  if (commentText.includes("time limit") || commentText.includes("warning")) {
    warnings.push("Entered comments identify a test time limit/warning issue. This directly affects confidence in the Marshall Flow result.");
    rootCauses.push("The elevated Flow result may be influenced by testing validity, conditioning time or timing compliance.");
    immediateChecks.push("Repeat Marshall Stability and Flow testing under controlled timing conditions before accepting Flow as representative.");
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
    good.push("Overall result appears conforming based on entered values. Mix appears acceptable against entered MRWA limits.");
    actions.push("Continue monitoring trends against approved mix design targets. Tighten any results close to limits before they become non-conforming.");
  }

  return { issues, warnings, good, actions, rootCauses, designChanges, immediateChecks };
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const [jobInfo, setJobInfo] = useState({
    date: "",
    sampleNumber: "",
    location: "",
    testedBy: "",
  });

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

  function handleLogin() {
    if (loginName === "astaadmin" && password === "asta1357") {
      setLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Incorrect login details.");
    }
  }

  function updateJob(key, value) {
    setJobInfo((prev) => ({ ...prev, [key]: value }));
  }

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

  function exportPage() {
    window.print();
  }

  if (!loggedIn) {
    return (
      <div className="container">
        <div className="card header">
          <h1>A.S.T.A Login</h1>
          <p>Asphalt Solutions Test Analysis</p>
        </div>

        <div className="card">
          <label>Login Name<input value={loginName} onChange={(e) => setLoginName(e.target.value)} /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button className="analyseButton" onClick={handleLogin}>Login</button>
          {loginError && <p className="fail">{loginError}</p>}
        </div>
      </div>
    );
  }

  if (showInfo) {
    return (
      <div className="container">
        <div className="card header">
          <h1>A.S.T.A Information Guide</h1>
          <p>How each asphalt result works, common causes of high/low results, likely fixes and how changes affect the rest of the mix.</p>
        </div>

        <button className="analyseButton" onClick={() => setShowInfo(false)}>Back to Test Entry</button>

        <div className="card">
          <h2>PSD – Particle Size Distribution</h2>
          <p><strong>What it is:</strong> PSD shows the percentage of aggregate passing each sieve. It controls the stone skeleton, mortar content, workability, compaction and durability of the asphalt mix.</p>
          <p><strong>If coarse / low passing:</strong> The mix may be short of fines or filler. This can reduce mortar, make the mix harsh, increase permeability, increase air void sensitivity and increase ravelling/moisture risk.</p>
          <p><strong>Likely causes:</strong> Fine aggregate underfeeding, fixed dust feed too low, baghouse/filler return issue, stockpile segregation, loader practice, incorrect blend proportions or quarry grading changes.</p>
          <p><strong>Likely fixes:</strong> Increase overall dust/filler feed where practical, review fine aggregate contribution, confirm current quarry gradings, check cold feed calibration and monitor the 0.600mm, 0.300mm, 0.150mm and 0.075mm sieves closely.</p>
          <p><strong>If fine / high passing:</strong> Too many fines can increase binder demand, tighten voids, make the mix tender or over-filled, and may increase stiffness depending on binder/filler balance.</p>
          <p><strong>Effect on other results:</strong> Adding fines/filler may reduce air voids, increase density, improve cohesion, but can also increase binder demand and affect Flow/Stability if overdone.</p>

          <h2>Bitumen Content</h2>
          <p><strong>What it is:</strong> Bitumen content is the binder percentage in the mix. It holds aggregate together, waterproofs the mix and gives flexibility.</p>
          <p><strong>If low:</strong> The mix may become dry, harsh, difficult to compact, more permeable and more prone to ravelling/cracking.</p>
          <p><strong>Likely causes:</strong> Low binder set point, binder pump/flow meter issue, density compensation issue, sample splitting issue, extraction/calculation error or unrepresentative sample.</p>
          <p><strong>Likely fixes:</strong> Repeat extraction first. Check binder pump calibration, flow meter, bitumen density input and plant set point. If confirmed low, increase binder toward target, generally around 4.7% for this mix design.</p>
          <p><strong>If high:</strong> The mix may become rich, soft, tender, prone to flushing, bleeding, rutting and high Flow.</p>
          <p><strong>Effect on other results:</strong> Increasing binder usually improves workability and density, can lower air voids, can increase Flow, and may reduce Stability if excessive. Reducing binder can increase voids, reduce Flow and make the mix harsher.</p>
          <p><strong>Important correlation:</strong> If binder is reported low but Flow is high and air voids/stability are acceptable, the binder result may be a flyer and should be retested before making large production changes.</p>

          <h2>Average Compaction Temperature</h2>
          <p><strong>What it is:</strong> The temperature of the mix during compaction. It affects workability, density and Marshall performance.</p>
          <p><strong>If too low:</strong> Mix becomes stiff, harder to compact, may produce higher air voids and lower density.</p>
          <p><strong>If too high:</strong> Mix may become overly soft/tender and may influence Flow or binder behaviour.</p>
          <p><strong>Likely fixes:</strong> Confirm thermometer accuracy, sample handling time, reheating process, compaction timing and plant discharge temperature.</p>

          <h2>Average Bulk Density</h2>
          <p><strong>What it is:</strong> Bulk density shows how compacted the Marshall specimen is.</p>
          <p><strong>If low:</strong> Usually indicates more air voids, poor compaction, coarse grading, low binder or harsh mix.</p>
          <p><strong>If high:</strong> May indicate low voids, rich mix, high fines, high binder or over-compaction.</p>
          <p><strong>Effect on other results:</strong> Bulk density is directly related to air voids. As density increases, air voids generally reduce.</p>

          <h2>Maximum Density</h2>
          <p><strong>What it is:</strong> Maximum density is used with bulk density to calculate air voids.</p>
          <p><strong>If questionable:</strong> Air void calculations may also be wrong.</p>
          <p><strong>Likely fixes:</strong> Confirm test procedure, sample mass, calibration, drying and calculation.</p>

          <h2>Average Air Voids</h2>
          <p><strong>What it is:</strong> Air voids are the air spaces left in the compacted asphalt. Target is 5.5%, with specification 4.0–7.0%.</p>
          <p><strong>If low:</strong> Mix may be too dense/rich, with increased bleeding, flushing and rutting risk.</p>
          <p><strong>Likely causes:</strong> High binder, high fines, excessive compaction, low void aggregate structure or incorrect density result.</p>
          <p><strong>Likely fixes:</strong> Check binder, fines, VMA, compaction effort and density calculations.</p>
          <p><strong>If high:</strong> Mix may be too open, permeable and prone to oxidation, ravelling and moisture damage.</p>
          <p><strong>Likely causes:</strong> Low binder, coarse grading, low fines/filler, poor compaction, low temperature or aggregate segregation.</p>
          <p><strong>Likely fixes:</strong> Increase binder if confirmed low, increase fines/filler if grading is coarse, improve compaction temperature/process and review blend.</p>

          <h2>Total V.M.A</h2>
          <p><strong>What it is:</strong> VMA is the void space within the aggregate skeleton. It provides room for binder and air voids.</p>
          <p><strong>If low:</strong> There may not be enough space for binder film thickness, reducing durability.</p>
          <p><strong>Likely causes:</strong> Over-packed grading, excessive mid-size material or poor aggregate blend balance.</p>
          <p><strong>Likely fixes:</strong> Review aggregate blend shape, adjust coarse/fine balance and check target grading.</p>
          <p><strong>Effect on other results:</strong> VMA affects binder film thickness, air voids, durability and compaction behaviour.</p>

          <h2>Marshall Stability</h2>
          <p><strong>What it is:</strong> Stability measures the maximum load the compacted specimen can carry before failure.</p>
          <p><strong>If low:</strong> Mix may have weak aggregate structure, excess binder, poor compaction, rounded aggregate, high voids or sample/testing issues.</p>
          <p><strong>Likely fixes:</strong> Improve aggregate interlock, review binder content, check density/compaction and verify sample preparation.</p>
          <p><strong>If very high:</strong> Mix may be strong but potentially stiff/brittle if combined with low Flow or low binder.</p>
          <p><strong>Effect on other results:</strong> Stability should be interpreted with Flow. Strong stability with abnormal Flow may point to testing or conditioning issues.</p>

          <h2>Marshall Flow</h2>
          <p><strong>What it is:</strong> Flow measures how much the sample deforms before failure.</p>
          <p><strong>If high:</strong> Mix may be soft/tender, too rich in binder, weak in structure, over-conditioned, incorrectly tested or affected by flow gauge/machine issue.</p>
          <p><strong>Likely fixes:</strong> Check Marshall timing, water bath temperature, conditioning duration, transfer time, flow gauge and machine calibration. Then review binder and aggregate structure.</p>
          <p><strong>If low:</strong> Mix may be stiff/brittle, low in binder, harsh, over-filled with dust/filler or incorrectly conditioned.</p>
          <p><strong>Effect on other results:</strong> Increasing binder tends to increase Flow. Increasing filler can either stiffen the mix or improve cohesion depending on amount and binder balance.</p>

          <h2>How Changes Affect Other Results</h2>
          <p><strong>Increase binder:</strong> Usually improves workability and compaction, lowers air voids, may increase Flow, may reduce Stability if excessive, and improves durability if the mix was dry.</p>
          <p><strong>Reduce binder:</strong> May reduce Flow and bleeding risk, but can increase air voids, reduce durability, increase ravelling risk and make the mix harsh.</p>
          <p><strong>Increase dust/filler:</strong> Can improve lower PSD, mortar cohesion and reduce permeability. Too much can increase stiffness, binder demand and compaction difficulty.</p>
          <p><strong>Reduce dust/filler:</strong> Can reduce stiffness/tenderness if excessive, but may increase voids, reduce cohesion and increase ravelling risk if taken too far.</p>
          <p><strong>Increase coarse aggregate:</strong> Can improve stone skeleton and stability, but may increase voids and harshness if fines/binder are not balanced.</p>
          <p><strong>Increase fine aggregate:</strong> Can improve workability and fill voids, but too much can weaken stone-on-stone contact and increase tenderness.</p>

          <h2>How A.S.T.A Correlates Results</h2>
          <p>A.S.T.A does not just look at one failed item. It checks whether results make sense together.</p>
          <p><strong>Example:</strong> High Flow + Low Binder + Acceptable Air Voids + Acceptable Stability may suggest testing, conditioning, timing or extraction issue rather than a simple production mix fault.</p>
          <p><strong>Example:</strong> Low fines + High Air Voids + Low Binder points more strongly toward a coarse/lean production or mix design issue.</p>
          <p><strong>Example:</strong> High binder + Low Air Voids + High Flow points more strongly toward rich/tender mix and possible rutting/flushing risk.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card header">
        <h1>A.S.T.A – Asphalt Solutions Test Analysis</h1>
        <p>MRWA DG14 75B test result review and mix feedback system.</p>
      </div>

      <div className="topButtons">
        <button className="analyseButton" onClick={() => setShowInfo(true)}>Information</button>
        <button className="analyseButton" onClick={exportPage}>Export / Save PDF</button>
      </div>

      <div className="card">
        <h2>Test Details</h2>
        <div className="grid">
          <label>Date<input type="date" value={jobInfo.date} onChange={(e) => updateJob("date", e.target.value)} /></label>
          <label>Sample Number<input value={jobInfo.sampleNumber} onChange={(e) => updateJob("sampleNumber", e.target.value)} /></label>
          <label>Location<input value={jobInfo.location} onChange={(e) => updateJob("location", e.target.value)} /></label>
          <label>Tested By<input value={jobInfo.testedBy} onChange={(e) => updateJob("testedBy", e.target.value)} /></label>
        </div>
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
                  <td><input value={psd[row.sieve] || ""} onChange={(e) => updatePsd(row.sieve, e.target.value)} /></td>
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

          <p><strong>Date:</strong> {jobInfo.date || "Not entered"}</p>
          <p><strong>Sample Number:</strong> {jobInfo.sampleNumber || "Not entered"}</p>
          <p><strong>Location:</strong> {jobInfo.location || "Not entered"}</p>
          <p><strong>Tested By:</strong> {jobInfo.testedBy || "Not entered"}</p>

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
          {analysis.designChanges.length === 0 ? <p>No mix design adjustment is currently recommended from entered data.</p> : analysis.designChanges.map((item, i) => <p key={i}>• {item}</p>)}

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
