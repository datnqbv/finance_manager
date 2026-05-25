@echo off
echo ============================================
echo   Build Quan Ly Chi Tieu - Windows EXE
echo ============================================

:: Kiểm tra Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Chua cai dat Node.js. Tai tai: https://nodejs.org
    pause
    exit /b 1
)

:: Dừng file .exe nếu đang chạy
echo Dang dung QuanLyChiTieu.exe neu dang chay...
taskkill /f /im QuanLyChiTieu.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Tạo thư mục dist
if not exist "dist" mkdir dist

:: === BƯỚC 1: Build React Frontend ===
echo.
echo [1/4] Dang build React frontend...
cd client
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo [LOI] Build React that bai!
    pause
    exit /b 1
)
cd ..

:: === BƯỚC 2: Install server dependencies ===
echo.
echo [2/4] Dang cai dat server dependencies...
cd server
call npm install
cd ..

:: === BƯỚC 3: Cài tools cần thiết ===
echo.
echo [3/4] Dang cai esbuild va pkg...
cd server
call npm install --save-dev esbuild
cd ..
call npm install -g pkg --force

:: === BƯỚC 4: Build .exe ===
echo.
echo [4/4] Dang dong goi thanh .exe...
cd server
echo   Buoc 4a: Bundle voi esbuild...
call npx esbuild src/index.js --bundle --platform=node --format=cjs --target=node18 --outfile=bundled.cjs --external:fsevents
if %errorlevel% neq 0 (
    echo [LOI] esbuild that bai!
    cd ..
    pause
    exit /b 1
)
echo   Buoc 4b: Dong goi voi pkg...
call pkg bundled.cjs --target node18-win-x64 --no-bytecode --public --output ../dist/QuanLyChiTieu.exe
if %errorlevel% neq 0 (
    echo [LOI] Build .exe that bai!
    cd ..
    pause
    exit /b 1
)
cd ..

:: === Copy client/dist vào thư mục dist ===
echo.
echo Dang copy React build vao thu muc dist...
if not exist "dist\client" mkdir "dist\client"
xcopy /s /e /y "client\dist" "dist\client\dist\"

:: === Dọn file tạm ===
if exist "server\bundled.cjs" del "server\bundled.cjs"

:: === Copy file .env ===
echo Dang copy file .env...
if exist "server\.env" (
    copy "server\.env" "dist\.env"
) else (
    echo [CANH BAO] Khong tim thay server\.env - ban can tao file nay thu cong!
    copy "server\.env.example" "dist\.env" 2>nul || echo # Cau hinh moi truong > "dist\.env"
)

echo.
echo ============================================
echo   HOAN THANH! Ket qua trong thu muc: dist\
echo ============================================
echo.
echo   Cau truc thu muc dist\:
echo   dist\
echo     QuanLyChiTieu.exe   (file chay chinh)
echo     .env                (cau hinh - CHINH TRUOC KHI CHAY)
echo     client\
echo       dist\             (React frontend)
echo.
echo   QUAN TRONG: Chinh file dist\.env truoc khi chay!
echo   SQLSERVER_HOST=your-sql-server-host
echo   SQLSERVER_PORT=1433
echo   SQLSERVER_USER=your-sql-server-user
echo   SQLSERVER_PASSWORD=your-sql-server-password
echo   SQLSERVER_DATABASE=FinanceManager
echo.
pause
