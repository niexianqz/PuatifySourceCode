export const metadata = {
  title: 'Puatify - ตารางเรียน',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="dark">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>{`
          :root {
            --bg-base: #f8fafc;
            --text-base: #0f172a;
            --glass-bg: rgba(255, 255, 255, 0.7);
            /* เข้มขึ้นเพื่อให้เห็นกรอบในโหมดสีขาวชัดเจน */
            --glass-border: rgba(0, 0, 0, 0.25); 
          }
          .dark {
            --bg-base: #09090b;
            --text-base: #f8fafc;
            --glass-bg: rgba(20, 20, 23, 0.6);
            --glass-border: rgba(255, 255, 255, 0.1);
          }
          body { 
            background: var(--bg-base); 
            color: var(--text-base); 
            transition: all 0.3s; 
          }
          .glass-panel { 
            background: var(--glass-bg); 
            backdrop-filter: blur(20px); 
            border: 1px solid var(--glass-border); 
          }
          select option {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .dark select option {
            background-color: #18181b !important;
            color: #ffffff !important;
          }
          select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 1.25rem center;
            background-size: 1.2em;
            /* บังคับขอบกล่อง Select ให้แสดงผลเสมอ */
            border: 1px solid var(--glass-border) !important;
          }
          select:focus, input:focus {
            border-color: #3b82f6 !important;
            outline: none;
          }
        `}</style>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
