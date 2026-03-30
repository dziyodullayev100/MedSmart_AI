@echo off
echo ========================================================
echo             MEDSMART TESTLAR MAJMUASI
echo ========================================================
echo.
echo [1] UNIT TEST ISHGA TUSHIRILMOQDA...
node backend/tests/unit_example.test.js
echo.
echo --------------------------------------------------------
echo [2] INTEGRAL TEST ISHGA TUSHIRILMOQDA...
node backend/tests/integration_example.test.js
echo.
echo --------------------------------------------------------
echo [3] SISTEM TEST ISHGA TUSHIRILMOQDA...
node backend/tests/system_example.test.js
echo.
echo ========================================================
echo        BARCHA TESTLAR MUVAFFAQIYATLI YAKUNLANDI!
echo        (Skrinshot olishingiz mumkin)
echo ========================================================
echo.
