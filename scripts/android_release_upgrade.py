"""Check a real release package update through public Android accessibility UI."""
import pathlib
import re
import subprocess
import time
import xml.etree.ElementTree as ET

PACKAGE = 'com.kpok.threefold'
OUT = pathlib.Path('release-upgrade-results')


def run(*args):
    return subprocess.run(args, check=True, text=True, capture_output=True, timeout=60).stdout


def label(node):
    return (node.get('text') or node.get('content-desc') or '').strip()


def center(bounds):
    match = re.fullmatch(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', bounds)
    if not match:
        raise ValueError('Invalid accessibility bounds')
    left, top, right, bottom = map(int, match.groups())
    if right <= left or bottom <= top:
        raise ValueError('Invisible accessibility node')
    return str((left + right) // 2), str((top + bottom) // 2)


def snapshot():
    # UIAutomator can exit zero without writing a dump while the cold UI is busy.
    # Remove the previous file first so a failed dump can never satisfy a later assertion.
    path = '/sdcard/release-window.xml'
    run('adb', 'shell', 'rm', '-f', path)
    output = run('adb', 'shell', 'uiautomator', 'dump', path)
    (OUT / 'uiautomator.txt').write_text(output)
    xml = run('adb', 'shell', 'cat', path)
    tree = ET.fromstring(xml)
    (OUT / 'ui.xml').write_text(xml)
    return tree


def wait_node(pattern, scroll=False):
    deadline = time.monotonic() + 75
    swipes = 0
    while time.monotonic() < deadline:
        try:
            tree = snapshot()
        except (subprocess.SubprocessError, ET.ParseError) as error:
            parts = (getattr(error, 'stdout', '') or '', getattr(error, 'stderr', '') or '')
            detail = ''.join(part.decode(errors='replace') if isinstance(part, bytes) else part for part in parts)
            (OUT / 'probe-error.txt').write_text(str(error) + '\n' + detail)
            time.sleep(.3)
            continue
        for node in reversed(list(tree.iter('node'))):
            if re.search(pattern, label(node), re.IGNORECASE):
                try:
                    center(node.get('bounds', ''))
                    return node
                except ValueError:
                    continue
        if scroll and swipes < 4:
            run('adb', 'shell', 'input', 'swipe', '540', '1550', '540', '650', '400')
            swipes += 1
        time.sleep(.3)
    raise RuntimeError(f'Release UI not found: {pattern}; inspect release-upgrade-results')


def tap(pattern, scroll=False):
    node = wait_node(pattern, scroll)
    run('adb', 'shell', 'input', 'tap', *center(node.get('bounds')))


def launch():
    run('adb', 'shell', 'am', 'force-stop', PACKAGE)
    run('adb', 'shell', 'am', 'start', '-W', '-n', PACKAGE + '/.MainActivity')


def version(code):
    info = run('adb', 'shell', 'dumpsys', 'package', PACKAGE)
    if not re.search(r'\bversionCode=' + str(code) + r'\b', info):
        raise RuntimeError('Wrong installed release version')


def saved_game():
    wait_node(r'Salit-salitan', scroll=True)
    wait_node(r'Kahon 5: O\b', scroll=True)
    wait_node(r'\b1/100 galaw\b')


def screenshot(name):
    image = subprocess.run(['adb', 'exec-out', 'screencap', '-p'], check=True, capture_output=True, timeout=20).stdout
    (OUT / name).write_bytes(image)


def main():
    OUT.mkdir(exist_ok=True)
    run('adb', 'install', '-r', 'release-smoke/1001.apk')
    # Only the fresh isolated emulator is cleared; no clear/uninstall after seeding.
    run('adb', 'shell', 'pm', 'clear', PACKAGE)
    version(1001)
    run('adb', 'shell', 'svc', 'wifi', 'disable')
    run('adb', 'shell', 'svc', 'data', 'disable')
    launch()
    tap(r'EN\s*·\s*English')
    tap(r'TL\s*·\s*Tagalog')
    tap(r'^Salit-salitan$', scroll=True)
    tap(r'Kahon 5: bakante', scroll=True)
    saved_game()
    launch()
    saved_game()
    screenshot('before-upgrade.png')
    run('adb', 'shell', 'am', 'force-stop', PACKAGE)
    run('adb', 'install', '-r', 'release-smoke/1002.apk')
    version(1002)
    launch()
    saved_game()
    tap(r'Kahon 1: bakante', scroll=True)
    wait_node(r'Kahon 1: X\b')
    wait_node(r'\b2/100 galaw\b')
    screenshot('after-upgrade.png')
    print('PASS: release1001 ->1002 retained Tagalog, local game and center O; further X move works offline')


if __name__ == '__main__':
    try:
        main()
    finally:
        OUT.mkdir(exist_ok=True)
        try:
            screenshot('final-screen.png')
        except subprocess.SubprocessError:
            pass
        try:
            (OUT / 'logcat.txt').write_text(run('adb', 'logcat', '-d', '-t', '1200'))
        except subprocess.SubprocessError:
            pass
