import React, { useState } from 'react';

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SignupCompany({ onBack }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      companyName: e.target.companyName.value,
      ownerName: e.target.ownerName.value,
      email: e.target.email.value,
      phoneNumber: e.target.phoneNumber.value,
      password: e.target.password.value,
    };

    try {
      const res = await fetch(`${API_ROOT}/auth/signup-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        alert(data.error || "Provisioning failed.");
      }
    } catch (err) {
      alert("Network failure.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass-panel" style={{width:'500px', textAlign:'center', border:'1px solid var(--success-color)', boxShadow:'0 0 30px var(--glow-accent)'}}>
        <h2 style={{color:'var(--success-color)', letterSpacing:'4px', fontWeight:'800'}}>PROVISIONING COMPLETE</h2>
        <p className="mb-8" style={{color:'var(--text-secondary)', lineHeight:'1.6'}}>Your <strong>TwishhSync</strong> workspace is online. You have been granted an <strong>18-Month Stealth Trial</strong> protocol.</p>
        <div style={{background:'rgba(16,185,129,0.05)', padding:'1.5rem', borderRadius:'12px', border:'1px solid rgba(16,185,129,0.2)', marginBottom:'2rem'}}>
            <label className="label-proto" style={{marginBottom:'0.5rem'}}>IDENTITY UPLINK</label>
            <p style={{fontSize:'16px', margin:0, color:'white', fontWeight:'bold'}}>{document.getElementById('signup-email')?.value}</p>
        </div>
        <button className="btn-primary" onClick={onBack} style={{background:'var(--success-color)', border:'none'}}>ESTABLISH INITIAL LINK</button>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{width:'500px'}}>
      <div className="brand mb-4" style={{textAlign:'center'}}>Twishh<span className="brand-accent">Sync</span></div>
      <h3 className="mb-6" style={{textAlign:'center'}}>WORKSPACE PROVISIONING</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group mb-4">
            <label className="label-proto">ORGANIZATION NAME</label>
            <input name="companyName" placeholder="e.g. Acme Industries" required />
        </div>
        
        <div className="form-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
            <div className="form-group mb-4">
                <label className="label-proto">OWNER FULL NAME</label>
                <input name="ownerName" placeholder="John Doe" required />
            </div>
            <div className="form-group mb-4">
                <label className="label-proto">CONTACT PHONE</label>
                <input name="phoneNumber" placeholder="+91 98765 43210" required />
            </div>
        </div>

        <div className="form-group mb-4">
            <label className="label-proto">IDENTITY EMAIL (ADMIN)</label>
            <input id="signup-email" name="email" type="email" placeholder="admin@company.com" required />
        </div>

        <div className="form-group mb-8">
            <label className="label-proto">INITIAL SECURITY KEY</label>
            <input name="password" type="password" placeholder="••••••••" required />
        </div>

        <button className="btn-primary" type="submit" disabled={loading} style={{width:'100%'}}>
            {loading ? "INITIALIZING..." : "COMMENCE PROVISIONING"}
        </button>
      </form>
      
      <button className="btn-secondary" onClick={onBack} style={{width:'100%', marginTop:'1rem', background:'transparent', border:'1px solid #333'}}>
        BACK TO IDENTITY GATE
      </button>
    </div>
  );
}
