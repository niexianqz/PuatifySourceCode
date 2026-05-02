'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL;

export default function Admin() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [masterData, setMasterData] = useState({ images: {}, subjects: {} });
  const [authToken, setAuthToken] = useState("");
  const [currentTime, setCurrentTime] = useState(null);

  const [level, setLevel] = useState('m1');
  const [room, setRoom] = useState('1');
  const [day, setDay] = useState('Monday');
  const [period, setPeriod] = useState('1');
  const [subjectName, setSubjectName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Optimized data fetching with useCallback
  const fetchLatestData = useCallback(async () => {
    if (!GAS_URL) return;
    try {
      const res = await fetch(`${GAS_URL}?t=${Date.now()}`);
      const data = await res.json();
      setMasterData(data);
    } catch (e) {
      console.error("Fetch error:", e);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    if (isLoggedIn) fetchLatestData();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isLoggedIn, fetchLatestData]);

  // Sync fields when selection changes
  useEffect(() => {
    const key = `${level}_${room}`;
    setImageUrl(masterData.images?.[key] || "");
    const info = masterData.subjects?.[key]?.[day]?.[String(period)];
    setSubjectName(info?.name || "");
    setTeacherName(info?.teacher || "");
  }, [level, room, day, period, masterData]);

  if (!mounted || !currentTime) return <div className="min-h-screen bg-[#0B1120]"></div>;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!GAS_URL) {
      setError("System Configuration Error (Missing GAS URL)");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: 'login', username: user, password: pass })
      });
      const data = await res.json();
      if (data.status === 'success') { 
        setAuthToken(data.token); 
        setIsLoggedIn(true); 
      } else { 
        setError('Invalid Credentials'); 
      }
    } catch (e) { 
      setError('Connection failed. Please check your internet.'); 
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!subjectName) return alert("Please enter subject name");
    setLoading(true);
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ 
          action: 'save_entry', 
          token: authToken, 
          level, room, day, 
          period: String(period), 
          imageUrl, subjectName, teacherName 
        })
      });
      const data = await res.json();
      if (data.status === 'success') { 
        alert('Update successful!'); 
        await fetchLatestData(); 
      } 
    } catch (e) { 
      alert('Network error while saving'); 
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (p) => {
    if(!confirm(`Delete Period ${p}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: 'delete_entry', token: authToken, level, room, day, period: String(p) })
      });
      const data = await res.json();
      if (data.status === 'success') { 
        await fetchLatestData(); 
      }
    } catch (e) { 
      alert('Delete failed'); 
    } finally {
      setLoading(false);
    }
  };

  const handleTestLine = async () => {
    setLoading(true);
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: 'test_line', token: authToken, level, room, day })
      });
      const data = await res.json();
      if (data.status === 'success') alert('Test message deployed!'); 
    } catch (e) { 
      alert('Push notification failed'); 
    } finally {
      setLoading(false);
    }
  };

  const Logo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="w-10 h-10">
      <defs><linearGradient id="pGrad" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#C4B5FD" /><stop offset="1" stopColor="#6EE7B7" /></linearGradient></defs>
      <rect width="32" height="32" rx="10" fill="url(#pGrad)" />
      <path d="M12 10V22M12 10H17C19.2091 10 21 11.7909 21 14C21 16.2091 19.2091 18 17 18H12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="dark min-h-screen bg-[#0B1120] text-slate-100 font-sans transition-all relative flex flex-col">
      
      {!isLoggedIn ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-10 shadow-2xl w-full max-w-lg text-center animate-in fade-in zoom-in duration-500">
            <div className="flex justify-center mb-8"><Logo /></div>
            <h1 className="text-3xl font-extrabold mb-10 tracking-widest">ADMIN ACCESS</h1>
            <form className="space-y-6" onSubmit={handleLogin}>
              <input type="text" placeholder="ID" className="w-full bg-[#1E293B] border border-slate-700 text-white py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-purple-400" value={user} onChange={e => setUser(e.target.value)} required />
              <input type="password" placeholder="KEY" className="w-full bg-[#1E293B] border border-slate-700 text-white py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-purple-400" value={pass} onChange={e => setPass(e.target.value)} required />
              <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-[#C4B5FD] to-[#F9A8D4] text-white font-extrabold py-4 rounded-2xl shadow-xl hover:opacity-90 transition-all uppercase">
                {loading ? 'Connecting...' : 'Login'}
              </button>
              {error && <p className="text-red-400 text-xs font-bold mt-3 bg-red-900/20 py-2 rounded-lg">{error}</p>}
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center pt-24 px-4 pb-12 w-full animate-in fade-in duration-500">
          <nav className="fixed top-6 w-full max-w-3xl px-4 z-50">
            <div className="bg-[#0F172A]/90 backdrop-blur-md border border-slate-800 rounded-2xl px-6 py-4 shadow-lg flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Logo />
                <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-teal-400 tracking-widest">PUATIFY</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-slate-400 font-mono">{currentTime.toLocaleDateString()}</p>
                  <p className="text-sm font-bold text-teal-300 font-mono">{currentTime.toLocaleTimeString()}</p>
                </div>
                <Link href="/" className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold hover:text-[#C4B5FD] transition-all">EXIT</Link>
              </div>
            </div>
          </nav>

          <div className="w-full max-w-3xl bg-[#0F172A] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8 mt-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-6">
               <h2 className="font-bold text-xl text-[#C4B5FD] uppercase tracking-tighter">Command Center</h2>
               <button onClick={() => window.location.reload()} className="text-slate-500 hover:text-red-400 text-xs font-bold transition-colors">LOGOUT</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-slate-700 font-bold" value={level} onChange={e => setLevel(e.target.value)}>
                {[1,2,3,4,5,6].map(v => <option key={v} value={`m${v}`}>Grade M.{v}</option>)}
              </select>
              <select className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-slate-800 font-bold" value={room} onChange={e => setRoom(e.target.value)}>
                {[1,2,3,4,5,6,7,8,9].map(i => <option key={i} value={String(i)}>Room {i}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-slate-700 font-bold" value={day} onChange={e => setDay(e.target.value)}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-slate-700 font-bold" value={period} onChange={e => setPeriod(e.target.value)}>
                {[1,2,3,4,5,6,7,8].map(p => <option key={p} value={String(p)}>Period {p}</option>)}
              </select>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
              <input type="text" placeholder="Subject Name" className="w-full px-6 py-4 rounded-xl bg-[#1E293B] border border-slate-700" value={subjectName} onChange={e => setSubjectName(e.target.value)} />
              <input type="text" placeholder="Teacher" className="w-full px-6 py-4 rounded-xl bg-[#1E293B] border border-slate-700" value={teacherName} onChange={e => setTeacherName(e.target.value)} />
              <input type="text" placeholder="Image URL" className="w-full px-6 py-4 rounded-xl bg-[#1E293B] border border-slate-700" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <button disabled={loading} onClick={handleSave} className="py-4 bg-gradient-to-r from-teal-400 to-blue-500 text-slate-900 rounded-xl font-black shadow-lg hover:brightness-110 active:scale-95 transition-all">
                  {loading ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
                <button disabled={loading} onClick={handleTestLine} className="py-4 bg-slate-800 border border-slate-600 rounded-xl font-bold hover:bg-slate-700 transition-all">
                  TEST PUSH (LINE)
                </button>
              </div>
            </div>

            <div className="mt-10 border-t border-slate-800 pt-8">
              <h3 className="text-xs font-black text-slate-500 mb-6 uppercase text-center tracking-widest">Active Schedule Records</h3>
              <div className="space-y-3">
                {[1,2,3,4,5,6,7,8].map(p => {
                  const sub = masterData.subjects?.[`${level}_${room}`]?.[day]?.[String(p)];
                  if (!sub) return null;
                  return (
                    <div key={p} className="flex justify-between items-center p-4 bg-[#1E293B] rounded-2xl border border-slate-700 group hover:border-[#C4B5FD]/50 transition-all">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black bg-[#C4B5FD] text-slate-900 px-2 py-1 rounded-md">P{p}</span>
                        <span className="font-bold text-slate-200">{sub.name}</span>
                      </div>
                      <button onClick={() => handleDelete(p)} className="text-[10px] font-bold text-red-400 bg-red-900/10 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-all">DELETE</button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}