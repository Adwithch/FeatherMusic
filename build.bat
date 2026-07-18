@echo off
echo Starting Build Process...

echo [1/6] Installing Python dependencies...
python -m pip install pyinstaller ytmusicapi yt-dlp urllib3

echo [2/6] Building ytapi executable...
python -m PyInstaller --onefile --noconsole --name ytapi --collect-data ytmusicapi extensions/ytapi/main.py

echo [3/6] Building Neutralino App...
powershell -ExecutionPolicy Bypass -Command "npx @neutralinojs/neu build"

echo [4/6] Creating Release Folder...
if exist "FeatherMusic-Release" rmdir /S /Q "FeatherMusic-Release"
mkdir "FeatherMusic-Release"

echo Copying necessary files to Release folder...
copy "dist\feathermusic\feathermusic-win_x64.exe" "FeatherMusic-Release\FeatherMusic.exe"
copy "dist\feathermusic\WebView2Loader.dll" "FeatherMusic-Release\"
copy "dist\feathermusic\resources.neu" "FeatherMusic-Release\"
copy "dist\ytapi.exe" "FeatherMusic-Release\"
copy "neutralino.config.json" "FeatherMusic-Release\"

echo [5/6] Downloading yt-dlp.exe...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' -OutFile 'FeatherMusic-Release\yt-dlp.exe'"

echo [6/6] Generating Installers...
"%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe" FeatherMusic.iss
"wix314\candle.exe" FeatherMusic.wxs -o FeatherMusic.wixobj
"wix314\light.exe" -ext WixUIExtension FeatherMusic.wixobj -o FeatherMusic-Setup.msi

echo Build Complete! Installers are ready.
