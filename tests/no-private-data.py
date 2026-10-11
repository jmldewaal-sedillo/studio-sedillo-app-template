#!/usr/bin/env python3
"""Test: er staan geen privégegevens (huisadres) in de repo of op de gepubliceerde pagina's.

  python3 tests/no-private-data.py                 # zelftest + alle bestanden van de repo
  python3 tests/no-private-data.py --online        # ook de pagina's die nu online staan
  python3 tests/no-private-data.py --online URL    # ... op dit adres

Gebruikt ~/.studio-sedillo/blocklist.txt als die bestaat (in GitHub Actions het geheim
PRIVATE_BLOCKLIST). Zonder lijst draait alleen de zelftest en volgt een waarschuwing.
Het echte werk zit in tools/no-private-data.py.
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOOL = [sys.executable, str(ROOT / 'tools' / 'no-private-data.py')]
DEFAULT_ONLINE = []                  # adressen zonder CNAME-bestand, bijvoorbeeld een github.io-adres

args = sys.argv[1:]
runs = [['--selftest'], [a for a in args if a == '--ci']]
if '--online' in args:
    urls = [a for a in args if a.startswith('http')] or list(DEFAULT_ONLINE)
    cname = ROOT / 'CNAME'
    if not urls and cname.is_file() and '{{' not in cname.read_text():
        host = cname.read_text().strip()
        urls = [f'https://{host}/', f'https://test-{host}/']
    runs += [['--online', url] for url in urls]
failed = 0
for run in runs:
    failed += subprocess.run(TOOL + run, cwd=ROOT).returncode != 0
print('✅ no-private-data: in orde.' if not failed else f'❌ no-private-data: {failed} controle(s) mislukt.')
sys.exit(1 if failed else 0)
