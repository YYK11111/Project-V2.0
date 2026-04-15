import re
import pathlib
import subprocess

root = pathlib.Path('/Users/yyk/工作/代码开发/Project-V2.0')
code_keys = set()

for path in (root / 'nest-admin-frontend/src').rglob('*'):
  if path.suffix not in {'.vue', '.ts', '.js'}:
    continue
  try:
    text = path.read_text(errors='ignore')
  except Exception:
    continue
  for match in re.findall(r"checkPermi\((?:\[)?['\"]([^'\"]+)", text):
    code_keys.add(match)

for path in (root / 'nest-admin/src').rglob('*.ts'):
  try:
    text = path.read_text(errors='ignore')
  except Exception:
    continue
  for match in re.findall(r"(?:@Permission\(['\"]|['\"])(system/[A-Za-z0-9/_:-]+|business/[A-Za-z0-9/_:-]+)", text):
    code_keys.add(match)

res = subprocess.check_output([
  '/opt/homebrew/bin/mysql', '-uroot', '-p12345678', '-N', '-e',
  "use psd2; select permissionKey from sys_menu where type='button' and is_delete is null;"
])
db_keys = set(res.decode().split())
missing = sorted(k for k in code_keys if k and k not in db_keys and not k.startswith('*'))
print('\n'.join(missing))
