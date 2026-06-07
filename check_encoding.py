"""
RTTL Encoding Guard - Run before deploying to catch broken characters.
Usage: python check_encoding.py
Returns exit code 1 if broken characters found, 0 if clean.
"""
import glob
import sys
import re

PROBLEMS = []

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        
        # Skip script blocks, JSON, and URLs
        if any(x in stripped for x in ['<script', 'application/ld+json', 'querySelector', 'addEventListener', 'function(', 'const ', 'let ', 'var ', 'if (', 'return ']):
            continue
        
        # Check for replacement character
        if '\ufffd' in stripped:
            PROBLEMS.append(f"  {filepath}:{i} - Replacement character found")
        
        # Check for suspicious ?? (broken emoji)
        if re.search(r'>\?\?<', stripped):
            PROBLEMS.append(f"  {filepath}:{i} - Broken emoji (??) found: {stripped[:80]}")
        
        # Check for ? -  pattern (broken emoji + dash)
        if '>? -  ' in stripped:
            PROBLEMS.append(f"  {filepath}:{i} - Broken icon (? - ) found: {stripped[:80]}")

print("RTTL Encoding Guard")
print("=" * 50)

html_files = sorted(glob.glob('*.html'))
skip = ['index-full-backup.html']

for f in html_files:
    if f in skip:
        continue
    check_file(f)

if PROBLEMS:
    print(f"FAIL: {len(PROBLEMS)} encoding issues found!")
    for p in PROBLEMS:
        print(p)
    sys.exit(1)
else:
    print("PASS: All files clean!")
    sys.exit(0)
