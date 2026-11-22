@echo off
cd /d "%~dp0"
if not defined EQUINORIX_PORT set "EQUINORIX_PORT=4177"
echo EQUINORIX local preview: http://127.0.0.1:%EQUINORIX_PORT%/uk/
echo Keep this window open while viewing the local site.
node server-local.mjs
pause
