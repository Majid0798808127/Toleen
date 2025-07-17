@echo off
cd /d "C:\Users\Majid Choudhary\Desktop\Toleen Pc"
start "" cmd /c "npm run dev"
timeout /t 5 /nobreak > nul
start msedge http://localhost:3000
