import React, { useMemo, useState } from "react";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [comments, setComments] = useState("");

  const [values, setValues] = useState({
    stability: "",
    flow: "",
    airVoids: "",
    bitumen: "",
    vma: "",

    p2650: "",
    p1900: "",
    p1320: "",
    p950: "",
    p670: "",
    p475: "",
    p236: "",
    p118: "",
    p600: "",
    p300: "",
    p150: "",
    p075: "",
  });

  function handleLogin() {
    if (loginName === "astaadmin" && password === "asta1357") {
      setLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Incorrect login details.");
    }
  }

  function update(key, val) {
    setValues((prev) => ({
      ...prev,
      [key]: val,
    }));
  }

  const analysis = useMemo(() => {
    const issues = [];
    const good = [];
    const warnings = [];
    const actions = [];

    const stability = Number(values.stability);
    const flow = Number(values.flow);
    const air = Number(values.airVoids);
    const bit = Number(values.bitumen);
    const vma = Number(values.vma);

    const psdChecks = [
      { name: "0.600mm", actual: Number(values.p600), min: 14, max: 22 },
      { name: "0.300mm", actual: Number(values.p300), min: 9, max: 17 },
      { name: "0.150mm", actual: Number(values.p150), min: 7, max: 12 },
      { name: "0.075mm", actual: Number(values.p075), min: 3, max: 6 },
    ];

    psdChecks.forEach((item) => {
      if (item.actual < item.min) {
        issues.push(
          `${item.name} PSD is LOW — actual ${item.actual}% vs spec ${item.min}-${item.max}%.`
        );
      }

      if (item.actual > item.max) {
        issues.push(
          `${item.name} PSD is HIGH — actual ${item.actual}% vs spec ${item.min}-${item.max}%.`
        );
      }
    });

    if (air >= 4 && air <= 7) {
      good.push("Air voids are within specification.");
    } else {
      issues.push("Air voids outside specification.");
    }

    if (vma >= 14) {
      good.push("VMA is acceptable.");
    } else {
      issues.push("VMA below minimum specification.");
    }

    if (stability >= 8) {
      good.push("Marshall Stability is within specification.");
    } else {
      issues.push("Marshall Stability below specification.");
    }

    if (bit < 4.4) {
      issues.push(
        `Bitumen content is LOW — actual ${bit}% vs spec 4.4-5.0%.`
      );
    }

    if (bit > 5.0) {
      issues.push(
        `Bitumen content is HIGH — actual ${bit}% vs spec 4.4-5.0%.`
      );
    }

    if (flow < 2) {
      issues.push(
        `Marshall Flow is LOW — actual ${flow}mm vs spec 2.0-4.0mm.`
      );
    }

    if (flow > 4) {
      issues.push(
        `Marshall Flow is HIGH — actual ${flow}mm vs spec 2.0-4.0mm.`
      );
    }

    if (flow > 4 && bit < 4.4) {
      warnings.push(
        "High Flow combined with low binder content is technically inconsistent and may indicate testing or conditioning issues."
      );
    }

    if (comments.toLowerCase().includes("time")) {
      warnings.push(
        "Operator comments indicate potential Marshall timing compliance concerns."
      );

      actions.push(
        "Review Marshall conditioning time, transfer duration and testing sequence compliance."
      );
    }

    if (comments.toLowerCase().includes("warning")) {
      warnings.push(
        "Operator comments include warning notifications which should be investigated before production adjustments are made."
      );
    }

    if (issues.some((x) => x.includes("PSD"))) {
      actions.push(
        "Review dust return system, baghouse fines return, aggregate blending and feeder calibration."
      );

      actions.push(
        "Low fine fractions may create a coarse mix with reduced mortar cohesion and increased permeability."
      );
    }

    if (bit < 4.4) {
      actions.push(
        "Repeat binder extraction to confirm result before major mix design changes are implemented."
      );

      actions.push(
        "Check bitumen pump calibration, spray bar operation and binder weighing systems."
      );
    }

    if (flow > 4) {
      actions.push(
        "Investigate sample conditioning, Marshall hammer operation, water bath temperature and flow gauge calibration."
      );
    }

    return {
      issues,
      good,
      warnings,
      actions,
    };
  }, [values, comments]);

  if (!loggedIn) {
    return (
      <div className="container">
        <div className="card">
          <h1>A.S.T.A Login</h1>

          <div className="grid">
            <div>
              <label>Login Name</label>
              <input
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button className="button" onClick={handleLogin}>
            Login
          </button>

          {loginError && <p className="bad">{loginError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>A.S.T.A – Asphalt Solutions Test Analysis</h1>
        <p>MRWA Asphalt Mix Assessment Tool</p>
      </div>

      <div className="card">
        <h2>PSD</h2>

        <div className="grid">
          <div>
            <label>0.600mm (%)</label>
            <input
              value={values.p600}
              onChange={(e) => update("p600", e.target.value)}
            />
          </div>

          <div>
            <label>0.300mm (%)</label>
            <input
              value={values.p300}
              onChange={(e) => update("p300", e.target.value)}
            />
          </div>

          <div>
            <label>0.150mm (%)</label>
            <input
              value={values.p150}
              onChange={(e) => update("p150", e.target.value)}
            />
          </div>

          <div>
            <label>0.075mm (%)</label>
            <input
              value={values.p075}
              onChange={(e) => update("p075", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Marshall Density and Voids</h2>

        <div className="grid">
          <div>
            <label>Average Air Voids (%)</label>
            <input
              value={values.airVoids}
              onChange={(e) => update("airVoids", e.target.value)}
            />
          </div>

          <div>
            <label>Total VMA (%)</label>
            <input
              value={values.vma}
              onChange={(e) => update("vma", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Bitumen Content</h2>

        <div className="grid">
          <div>
            <label>Bitumen (%)</label>
            <input
              value={values.bitumen}
              onChange={(e) => update("bitumen", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Stability and Flow</h2>

        <div className="grid">
          <div>
            <label>Average Stability (kN)</label>
            <input
              value={values.stability}
              onChange={(e) => update("stability", e.target.value)}
            />
          </div>

          <div>
            <label>Average Flow (mm)</label>
            <input
              value={values.flow}
              onChange={(e) => update("flow", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Comments</h2>

        <textarea
          rows="6"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>

      <div className="card">
        <h2>Technical Summary Report</h2>

        {analysis.issues.length === 0 ? (
          <h3 className="good">OVERALL: CONFORMING MIX</h3>
        ) : (
          <h3 className="bad">
            OVERALL: NON-CONFORMING / INVESTIGATION REQUIRED
          </h3>
        )}

        <h3>Good Areas</h3>

        {analysis.good.map((g, i) => (
          <p key={i} className="good">
            ✓ {g}
          </p>
        ))}

        <h3>Non-Conformances / Failed Areas</h3>

        {analysis.issues.map((g, i) => (
          <p key={i} className="bad">
            ✗ {g}
          </p>
        ))}

        <h3>Technical Warnings</h3>

        {analysis.warnings.map((g, i) => (
          <p key={i} className="warn">
            ⚠ {g}
          </p>
        ))}

        <h3>Recommended Actions</h3>

        {analysis.actions.map((g, i) => (
          <p key={i}>
            • {g}
          </p>
        ))}

        <h3>Entered Comments</h3>

        <p>{comments}</p>
      </div>
    </div>
  );
}
