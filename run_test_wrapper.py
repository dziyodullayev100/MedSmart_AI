import os, subprocess, sys
target_dir = r"c:\Users\user\Downloads\MedSmart_AI_Engine"
os.chdir(target_dir)
os.environ["PYTHONIOENCODING"] = "utf-8"
print(f"Changed directory to: {os.getcwd()}")
result = subprocess.run([sys.executable, "tests/run_all_tests.py"])
sys.exit(result.returncode)
