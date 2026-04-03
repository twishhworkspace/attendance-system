import React from 'react';

export default function PrivacyPolicyView() {
  const lastUpdated = "April 2026";
  const grievanceEmail = "twishhworkspace@gmail.com";

  return (
    <div className="app-container" style={{ padding: '4rem 2rem', overflowY: 'auto', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <div className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'left', display: 'block', borderBottom: '4px solid var(--primary-color)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h1 className="brand" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>TWISHH<span className="brand-accent">SYNC</span></h1>
            <label className="label-proto" style={{ letterSpacing: '6px' }}>DIGITAL PERSONAL DATA PROTECTION PROTOCOL (V2.0)</label>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '1rem' }}>COMPLIANT WITH INDEPENDENT DPDP ACT, 2023 [INDIA]</p>
            <p style={{ color: 'gray', fontSize: '10px' }}>Last System Synchronization: {lastUpdated}</p>
        </div>

        <div className="policy-section mb-10">
            <h3 className="mb-4" style={{ color: 'var(--primary-color)', fontSize: '1.1rem', letterSpacing: '1px' }}>1. INTRODUCTION & SCOPE</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                This Privacy Protocol outlines how **TwishhSync** (the "Data Processor") manages personal data on behalf of your employer (the "Data Fiduciary"). 
                By utilizing this workspace uplink, you acknowledge the processing of your data in accordance with the Digital Personal Data Protection (DPDP) Act, 2023.
            </p>
        </div>

        <div className="policy-section mb-10">
            <h3 className="mb-4" style={{ color: 'var(--primary-color)', fontSize: '1.1rem', letterSpacing: '1px' }}>2. CATEGORIES OF DATA COLLECTED</h3>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', listStyleType: 'square', paddingLeft: '1.5rem' }}>
                <li><strong>Identity Data:</strong> Name, Employee ID, and Organizational Role.</li>
                <li><strong>Contact Data:</strong> Professional Email ID and registered Mobile Number.</li>
                <li><strong>Telemetry (Location) Data:</strong> Precise GPS coordinates at the moment of entry/exit to verify presence within authorized "Workspace Zones".</li>
                <li><strong>Hardware Identity:</strong> Unique Device ID (UUID) to prevent unauthorized identity impersonation.</li>
            </ul>
        </div>

        <div className="policy-section mb-10">
            <h3 className="mb-4" style={{ color: 'var(--primary-color)', fontSize: '1.1rem', letterSpacing: '1px' }}>3. PURPOSE OF PROCESSING</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                Your data is processed solely for the specific purposes of:
                <br/>• Automated attendance logging and workforce scheduling.
                <br/>• Real-time verification of physical presence within secured office perimeters.
                <br/>• Ensuring hardware-level security to maintain organizational integrity.
            </p>
        </div>

        <div className="policy-section mb-10">
            <h3 className="mb-4" style={{ color: 'var(--primary-color)', fontSize: '1.1rem', letterSpacing: '1px' }}>4. RIGHTS OF THE DATA PRINCIPAL</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1rem' }}>
                Under the DPDP Act, you are the "Data Principal" and hold the following inherent rights:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label className="label-proto" style={{ fontSize: '9px' }}>RIGHT TO ACCESS</label>
                    <p style={{ fontSize: '12px', margin: 0 }}>Review the summary of personal data held within this platform.</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label className="label-proto" style={{ fontSize: '9px' }}>RIGHT TO ERASURE</label>
                    <p style={{ fontSize: '12px', margin: 0 }}>Request the permanent deletion of your data when no longer legally required.</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label className="label-proto" style={{ fontSize: '9px' }}>RIGHT TO CORRECTION</label>
                    <p style={{ fontSize: '12px', margin: 0 }}>Correct inaccurate or incomplete profile records via your Admin.</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label className="label-proto" style={{ fontSize: '9px' }}>CONSENT WITHDRAWAL</label>
                    <p style={{ fontSize: '12px', margin: 0 }}>Choose to stop data collection, noting this may affect your employment protocols.</p>
                </div>
            </div>
        </div>

        <div className="policy-section mb-10">
            <h3 className="mb-4" style={{ color: 'var(--primary-color)', fontSize: '1.1rem', letterSpacing: '1px' }}>5. DATA RETENTION POLICY</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                Personal data is retained only for as long as your employment status is active within the Data Fiduciary's workspace.
                Upon termination or withdrawal of consent, your data is purged from the active system unless required by labor laws.
            </p>
        </div>

        <div className="policy-section mb-10" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '2.5rem' }}>
            <h3 className="mb-4" style={{ color: 'var(--danger-color)', fontSize: '1.1rem', letterSpacing: '1px' }}>6. GRIEVANCE REDRESSAL MECHANISM</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                For any concerns, complaints, or if you believe your data has been handled improperly, you may contact the appointed **Grievance Officer**:
            </p>
            <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.03)', padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <label className="label-proto" style={{ color: 'var(--danger-color)' }}>CONTACT UPLINK</label>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Department of Compliance (TwishhSync)</p>
                <a href={`mailto:${grievanceEmail}`} style={{ color: 'white', textDecoration: 'none', fontSize: '1.1rem' }}>{grievanceEmail}</a>
                <p style={{ fontSize: '11px', color: 'gray', marginTop: '1rem' }}>
                    If you are unsatisfied with our response, you have the right to escalate your complaint to the **Data Protection Board of India**.
                </p>
            </div>
        </div>
        
        <button className="btn-primary mt-12" onClick={() => window.location.href = '/'} style={{ width: 'auto', padding: '1rem 3rem' }}>UPLINK DISCONNECT // RETURN</button>
      </div>
    </div>
  );
}
