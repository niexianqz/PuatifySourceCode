'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Fetch GAS URL from environment variables
const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL;

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [db, setDb] = useState({ images: {}, subjects: {} });
  const [level, setLevel] = useState('');
  const [room, setRoom] = useState('');
  const [viewDay, setViewDay] = useState('Monday');
  const [currentTime, setCurrentTime] = useState(null); 
  
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const loadData = async () => {
    if (!GAS_URL) {
      console.error("GAS_URL is missing. Please set NEXT_PUBLIC_GAS_URL in your .env.local file.");
      return;
    }
    try {
      const res = await fetch(`${GAS_URL}?t=${new Date().getTime()}`);
      const data = await res.json();
      setDb(data);
    } catch (error) { console.error("Data load failed", error); }
  };

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());

    const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Bangkok' }).format(new Date());
    setViewDay(today);

    loadData();
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted || !currentTime) return <div className="min-h-screen bg-[#0B1120]"></div>;

  const key = `${level}_${room}`;
  const subjects = db.subjects?.[key]?.[viewDay] || {};
  const currentImage = db.images?.[key] || "";
  
  const isJunior = level === 'm1' || level === 'm2' || level === 'm3';
  const sequence = isJunior ? [1, 2, 3, "LUNCH", 4, 5, 6, 7, 8] : [1, 2, 3, 4, "LUNCH", 5, 6, 7, 8];

  const getTimeSlot = (p) => {
    if (p === "LUNCH") {
        return isJunior 
          ? { start: 11 * 60 + 0, end: 11 * 60 + 50, timeStr: "11:00-11:50" }
          : { start: 11 * 60 + 50, end: 12 * 60 + 40, timeStr: "11:50-12:40" };
    }
    const slots = {
      "1": { start: 8 * 60 + 30, end: 9 * 60 + 20, timeStr: "08:30-09:20" },
      "2": { start: 9 * 60 + 20, end: 10 * 60 + 10, timeStr: "09:20-10:10" },
      "3": { start: 10 * 60 + 10, end: 11 * 60 + 0, timeStr: "10:10-11:00" },
      "4": isJunior ? { start: 11 * 60 + 50, end: 12 * 60 + 40, timeStr: "11:50-12:40" } : { start: 11 * 60 + 0, end: 11 * 60 + 50, timeStr: "11:00-11:50" },
      "5": { start: 12 * 60 + 40, end: 13 * 60 + 30, timeStr: "12:40-13:30" },
      "6": { start: 13 * 60 + 30, end: 14 * 60 + 20, timeStr: "13:30-14:20" },
      "7": { start: 14 * 60 + 20, end: 15 * 60 + 10, timeStr: "14:20-15:10" },
      "8": { start: 15 * 60 + 10, end: 16 * 60 + 0, timeStr: "15:10-16:00" }
    };
    return slots[String(p)];
  };

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Bangkok' }).format(currentTime);

  // เปลี่ยนชื่อวันเป็นภาษาไทย
  const dayThaiMap = {
    'Monday': 'วันจันทร์', 'Tuesday': 'วันอังคาร', 'Wednesday': 'วันพุธ', 
    'Thursday': 'วันพฤหัสบดี', 'Friday': 'วันศุกร์', 'Saturday': 'วันเสาร์', 'Sunday': 'วันอาทิตย์'
  };

  const PuatifyLogo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="w-8 h-8 md:w-10 md:h-10">
      <defs><linearGradient id="pGrad" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#C4B5FD" /><stop offset="1" stopColor="#6EE7B7" /></linearGradient></defs>
      <rect width="32" height="32" rx="10" fill="url(#pGrad)" />
      <path d="M12 10V22M12 10H17C19.2091 10 21 11.7909 21 14C21 16.2091 19.2091 18 17 18H12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="dark flex flex-col min-h-screen bg-[#0B1120] text-slate-100 transition-colors duration-500 font-sans relative">
      <div className="flex-1 flex flex-col items-center pt-24 px-4 pb-12 w-full">
        
        {/* LINE Official Account Subscription Button */}
        <a 
          href="https://line.me/R/ti/p/@472xbraq" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="fixed bottom-6 right-6 z-40 rounded-full shadow-[0_4px_20px_rgba(0,195,0,0.5)] hover:scale-110 transition-transform duration-300 block bg-[#00C300]"
          title="Add LINE Official Account"
        >
          <img 
            src="https://scdn.line-apps.com/lan/image/webstore/notice/web/17f8bb72cc5_0f54aec8432f58699e719163ee5c8e89.jpg" 
            alt="LINE" 
            className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover object-center border-2 border-[#00C300]"
          />
        </a>

        {/* Image Zoom Modal Overlay */}
        {isImageOpen && currentImage && (
          <div 
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center cursor-zoom-out" 
            onClick={() => { setIsImageOpen(false); setIsZoomed(false); }}
          >
             <button 
               className="absolute top-6 right-6 text-white text-3xl font-bold hover:text-red-500 transition-colors z-[110]"
               onClick={() => { setIsImageOpen(false); setIsZoomed(false); }}
             >
               X
             </button>
             
             <div className={`overflow-auto w-full h-full flex p-4 ${isZoomed ? 'items-start justify-start custom-scrollbar' : 'items-center justify-center'}`}>
                 <img
                    src={currentImage}
                    alt="Zoomed Schedule"
                    onClick={(e) => { 
                      e.stopPropagation();
                      setIsZoomed(!isZoomed);
                    }}
                    className={`transition-all duration-300 ${isZoomed ? 'max-w-none w-[150%] md:w-[200%] cursor-zoom-out rounded-lg' : 'max-w-full max-h-full cursor-zoom-in rounded-xl'}`}
                 />
             </div>
          </div>
        )}

        {/* Top Navigation Bar */}
        <nav className="fixed top-6 w-full max-w-3xl px-4 z-30">
          <div className="bg-[#0F172A]/90 backdrop-blur-md border border-slate-800 rounded-2xl px-4 md:px-6 py-4 shadow-lg flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-3">
              <PuatifyLogo />
              <span className="font-bold text-lg md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-teal-400 uppercase tracking-widest">PUATIFY</span>
            </div>
            
            <div className="flex items-center gap-4 md:gap-5">
              <div className="flex flex-col items-end">
                <span className="text-[10px] md:text-xs text-slate-400 font-medium tracking-wide">
                  {new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: '2-digit' }).format(currentTime)}
                </span>
                <span className="text-sm md:text-lg font-bold font-mono tracking-widest text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)] mt-0.5">
                  {new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(currentTime)}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-700 rounded-full hidden sm:block"></div>
              <Link href="/admin" className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-[#C4B5FD]/10 hover:border-[#C4B5FD]/50 text-[10px] md:text-xs font-bold text-slate-400 hover:text-[#C4B5FD] uppercase tracking-[0.15em] transition-all">
                Admin
              </Link>
            </div>
          </div>
        </nav>

        {/* Class Selection Dropdowns */}
        <div className="w-full max-w-3xl bg-[#0F172A] border border-slate-800 rounded-3xl p-8 shadow-xl mb-8 mt-6 relative z-10 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <select className="w-full bg-[#1E293B] border border-slate-700 text-slate-300 py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-purple-400 text-lg font-bold shadow-sm" 
              value={level} onChange={(e) => {setLevel(e.target.value); setRoom('');}}>
              <option value="" disabled>Select Level</option>
              {/* เอาคำว่า Level ออก เหลือแค่ M.1 - M.6 */}
              {[1,2,3,4,5,6].map((i) => <option key={i} value={`m${i}`}>M.{i}</option>)}
            </select>
            <select className="w-full bg-[#1E293B] border border-slate-700 text-slate-300 py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-teal-400 text-lg font-bold shadow-sm" 
              disabled={!level} value={room} onChange={(e) => setRoom(e.target.value)}>
              <option value="">Select Room</option>
              {[1,2,3,4,5,6,7,8,9].map(r => <option key={r} value={String(r)}>Room {r}</option>)}
            </select>
          </div>
        </div>

        {/* Schedule Display Area */}
        {level && room && (
          <div className="w-full max-w-3xl space-y-8 animate-fade-in-up relative z-10 flex-shrink-0">
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-8 border-b border-slate-800/80 pb-6">
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {dayThaiMap[viewDay]} <span className="text-[#C4B5FD] ml-1">M.{level.replace('m', '')}/{room}</span>
                </h3>

                <select className="px-5 py-3 rounded-2xl bg-[#1E293B] border border-slate-700 outline-none text-md font-bold shadow-sm" value={viewDay} onChange={e => setViewDay(e.target.value)}>
                  {/* Change the date option in the dropdown to Thai (but keep the value in English for the system to work).*/}
                  <option value="Monday">วันจันทร์</option>
                  <option value="Tuesday">วันอังคาร</option>
                  <option value="Wednesday">วันพุธ</option>
                  <option value="Thursday">วันพฤหัสบดี</option>
                  <option value="Friday">วันศุกร์</option>
                  <option value="Saturday">วันเสาร์</option>
                  <option value="Sunday">วันอาทิตย์</option>
                </select>
              </div>

              <div className="flex flex-col space-y-4">
                {sequence.map((p) => {
                  const slotInfo = getTimeSlot(p);
                  
                  let status = 'pending';
                  if (viewDay === currentDayName) {
                      if (currentMinutes >= slotInfo.end) {
                          status = 'finished';
                      } else if (currentMinutes >= slotInfo.start && currentMinutes < slotInfo.end) {
                          status = 'active';
                      }
                  }

                  const isActive = status === 'active';
                  const isFinished = status === 'finished';

                  if (p === "LUNCH" && Object.keys(subjects).length > 3) {
                    return (
                      <div key="lunch" className={`p-5 rounded-2xl border-2 flex justify-between items-center transition-all ${isActive ? 'bg-pink-500/10 border-pink-400 scale-[1.02] shadow-lg' : isFinished ? 'bg-[#1e293b]/20 border-dashed border-slate-800 opacity-50 grayscale' : 'bg-[#1e293b]/50 border-dashed border-pink-900/30'}`}>
                        <div className="flex-1">
                          <span className={`text-xs font-bold text-white px-3 py-1.5 rounded-lg tracking-wider mb-2 inline-block uppercase ${isFinished ? 'bg-slate-500' : 'bg-[#F9A8D4]'}`}>
                            {isActive ? '[ LUNCH ] (NOW)' : isFinished ? '[ LUNCH ] (DONE)' : '[ LUNCH ]'}
                          </span>
                          <p className={`text-lg font-bold tracking-tight ${isFinished ? 'text-slate-500' : 'text-pink-300'}`}>Lunch Break</p>
                        </div>
                        <span className="text-sm font-bold text-slate-400 font-mono">{slotInfo.timeStr}</span>
                      </div>
                    );
                  } else if (p !== "LUNCH" && subjects[String(p)]) {
                    const sub = subjects[String(p)];
                    
                    const badgeColor = isActive ? 'bg-[#6EE7B7] text-slate-900' : isFinished ? 'bg-slate-600 text-slate-300' : 'bg-[#C4B5FD] text-slate-900';
                    const badgeText = isActive ? '[ ACTIVE ]' : isFinished ? '[ DONE ]' : `[ PERIOD ${p} ]`;
                    const containerStyle = isActive 
                        ? 'bg-[#0F172A] border-[#6EE7B7] shadow-[0_0_15px_rgba(110,231,183,0.3)] scale-[1.02]' 
                        : isFinished 
                        ? 'bg-[#1E293B]/40 border-slate-800 opacity-60 grayscale'
                        : 'bg-[#1E293B] border-slate-700 hover:border-slate-500';

                    return (
                      <div key={p} className={`flex justify-between items-center p-6 rounded-2xl border transition-all ${containerStyle}`}>
                        <div className="flex-1">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg tracking-wider mb-2 inline-block uppercase ${badgeColor}`}>
                            {badgeText}
                          </span>
                          <p className={`text-xl font-bold mb-1 tracking-tight ${isActive ? 'text-white' : isFinished ? 'text-slate-400' : 'text-slate-200'}`}>
                            {sub.name}
                          </p>
                          <p className="text-sm font-medium text-slate-400">
                            Teacher: <span className={isFinished ? 'text-slate-500' : 'text-white'}>{sub.teacher || '-'}</span>
                          </p>
                        </div>
                        <div className="text-right">
                           <span className={`text-sm font-bold px-4 py-2 rounded-xl font-mono ${isActive ? 'bg-[#1E293B] text-white' : 'bg-slate-800 text-slate-400'}`}>
                             {slotInfo.timeStr}
                           </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
                
                {Object.keys(subjects).length === 0 && <p className="text-center text-slate-400 py-10 text-lg font-bold uppercase tracking-widest">No Schedule Found</p>}
              </div>
            </div>
            
            {/* Schedule Image Display */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-xl text-center">
                {currentImage ? (
                  <img 
                    src={currentImage} 
                    className="max-w-full h-auto rounded-xl shadow-md mx-auto cursor-zoom-in hover:opacity-90 transition-opacity" 
                    alt="Schedule Image" 
                    onClick={() => setIsImageOpen(true)}
                    title="Click to Zoom"
                  />
                ) : (
                  <p className="text-slate-500 font-bold uppercase tracking-widest p-4">No Image Available</p>
                )}
            </div>

          </div>
        )}
      </div>

      {/* Credit Footer */}
      <footer className="w-full py-8 flex flex-col items-center justify-center gap-3 text-slate-500 relative z-10 border-t border-slate-800/50 mt-auto bg-[#0B1120]">
        <div className="flex items-center gap-2 text-sm font-medium tracking-wide">
          Designed & Developed by <span className="text-[#C4B5FD] font-bold">XIAN</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="https://instagram.com/xi4nnnqz_" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors flex items-center gap-1.5 group">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 group-hover:scale-110 transition-transform">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            <span className="text-xs font-mono">@xi4nnnqz_</span>
          </a>
          <a href="https://github.com/niexianqz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5 group">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 group-hover:scale-110 transition-transform">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="text-xs font-mono">niexianqz</span>
          </a>
        </div>
      </footer>
    </div>
  );
}