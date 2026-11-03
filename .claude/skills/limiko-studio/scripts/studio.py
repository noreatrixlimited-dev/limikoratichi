#!/usr/bin/env python3
"""Limiko Studio loader: browse the engine catalog and load engines only when a job needs them.

The catalog is REFERENCES.txt (one line per engine, '[id] owner/repo | category | licence |
commercial | kind | use'). Clones go to vendor/<id>/ at the repo root (git-ignored).

    studio.py list [category]
    studio.py search <words…>
    studio.py show <id>
    studio.py fetch <id…> | --category <cat> | --kind <kind>
    studio.py skills <id>          # list SKILL.md files inside a fetched engine
    studio.py enable <id>          # link its skill folders into .claude/skills/x-<id>-<name>
    studio.py disable <id>
    studio.py status
    studio.py for <kids|games|facts|history>   # engines a category recommends
"""
import os, re, signal, subprocess, sys

signal.signal(signal.SIGPIPE, signal.SIG_DFL)  # quiet when piped into head
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKILL = HERE.parent
ROOT = SKILL.parents[2]  # repo root (…/.claude/skills/limiko-studio)
REFS = SKILL / "REFERENCES.txt"
VENDOR = ROOT / "vendor"
SKILLS_DIR = ROOT / ".claude" / "skills"
LINE = re.compile(r"^\[([\w-]+)\]\s+(\S+/\S+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*)$")


def catalog():
    out, last = {}, None
    for raw in REFS.read_text().splitlines():
        m = LINE.match(raw)
        if m:
            i, repo, cat, lic, com, kind, use = m.groups()
            last = out[i] = dict(id=i, repo=repo, category=cat, licence=lic,
                                 commercial=com, kind=kind, use=use, extra=[])
        elif last and raw.startswith("     ") and raw.strip():
            last["extra"].append(raw.strip())
        elif not raw.strip() or raw.startswith("---"):
            last = None
    return out


def need(cat, i):
    if i not in cat:
        sys.exit(f"unknown id '{i}'. Try: studio.py search <words>")
    return cat[i]


def row(e):
    flag = {"yes": "✔", "check": "?", "no": "✘"}.get(e["commercial"], " ")
    done = "●" if (VENDOR / e["id"]).exists() else " "
    return f"{done} {flag} {e['id']:<18} {e['kind']:<6} {e['repo']:<45} {e['use'][:70]}"


def cmd_list(cat, args):
    want = args[0] if args else None
    print("● fetched   ✔ commercial ok   ? check licence   ✘ non-commercial\n")
    for c in sorted({e["category"] for e in cat.values()}):
        if want and c != want:
            continue
        print(f"[{c}]")
        for e in cat.values():
            if e["category"] == c:
                print("  " + row(e))
        print()


def cmd_search(cat, args):
    words = [w.lower() for w in args]
    if not words:
        sys.exit("give some words, e.g. search kids voice")
    scored = []
    for e in cat.values():
        text = " ".join([e["id"], e["repo"], e["category"], e["kind"], e["use"], *e["extra"]]).lower()
        s = sum(text.count(w) for w in words) + (1 if e["commercial"] == "yes" else 0) * 0.5
        if s >= 1:
            scored.append((s, e))
    for s, e in sorted(scored, key=lambda x: -x[0])[:15]:
        print(row(e))
    if not scored:
        print("no match")


def cmd_show(cat, args):
    e = need(cat, args[0])
    for k in ("id", "repo", "category", "kind", "licence", "commercial", "use"):
        print(f"{k:>10}: {e[k]}")
    print(f"{'url':>10}: https://github.com/{e['repo']}")
    for x in e["extra"]:
        print(f"{'':>10}  {x}")
    d = VENDOR / e["id"]
    print(f"{'fetched':>10}: {d if d.exists() else 'no'}")


def clone(e):
    d = VENDOR / e["id"]
    if (d / ".git").exists():
        print(f"= {e['id']} already at {d}")
        return d
    VENDOR.mkdir(exist_ok=True)
    print(f"↓ {e['id']}  {e['repo']}")
    env = dict(os.environ, GIT_LFS_SKIP_SMUDGE="1")
    r = subprocess.run(["git", "clone", "-q", "--depth", "1", "--filter=blob:limit=5m",
                        f"https://github.com/{e['repo']}", str(d)], env=env)
    if r.returncode:
        print(f"  ! clone failed for {e['repo']}")
        return None
    if e["commercial"] != "yes":
        print(f"  note: licence is '{e['licence']}' ({e['commercial']}). Read it before using output commercially.")
    return d


def cmd_fetch(cat, args):
    if not args:
        sys.exit("fetch <id…> | --category <cat> | --kind <kind>")
    if args[0] in ("--category", "--kind"):
        key = args[0][2:]
        todo = [e for e in cat.values() if e[key] == args[1]]
    else:
        todo = [need(cat, i) for i in args]
    print(f"fetching {len(todo)} engine(s) into {VENDOR}")
    for e in todo:
        clone(e)


def skill_files(d):
    return sorted(p for p in d.rglob("SKILL.md") if ".git" not in p.parts)


def cmd_skills(cat, args):
    e = need(cat, args[0])
    d = VENDOR / e["id"]
    if not d.exists():
        sys.exit(f"fetch it first: studio.py fetch {e['id']}")
    files = skill_files(d)
    for p in files:
        print(p.relative_to(ROOT))
    if not files:
        print("no SKILL.md inside; read its README for how to run it")


def link_name(e, folder):
    if folder == VENDOR / e["id"]:
        return f"x-{e['id']}".lower()
    return f"x-{e['id']}-{folder.name}".lower()


def cmd_enable(cat, args):
    e = need(cat, args[0])
    d = VENDOR / e["id"]
    if not d.exists():
        sys.exit(f"fetch it first: studio.py fetch {e['id']}")
    files = skill_files(d)
    if not files:
        sys.exit("no SKILL.md inside to enable")
    SKILLS_DIR.mkdir(parents=True, exist_ok=True)
    for p in files:
        link = SKILLS_DIR / link_name(e, p.parent)
        if link.is_symlink() or link.exists():
            print(f"= {link.name}")
            continue
        link.symlink_to(os.path.relpath(p.parent, SKILLS_DIR))
        print(f"+ {link.name} → {p.parent.relative_to(ROOT)}")
    print("Enabled. They load in the next Claude Code session. Read each SKILL.md first: it is third-party.")


def cmd_disable(cat, args):
    e = need(cat, args[0])
    n = 0
    for link in [*SKILLS_DIR.glob(f"x-{e['id'].lower()}"), *SKILLS_DIR.glob(f"x-{e['id'].lower()}-*")]:
        if link.is_symlink():
            link.unlink()
            n += 1
    print(f"removed {n} link(s)")


def cmd_status(cat, args):
    fetched = sorted(p.name for p in VENDOR.iterdir()) if VENDOR.exists() else []
    links = sorted(p.name for p in SKILLS_DIR.glob("x-*")) if SKILLS_DIR.exists() else []
    print(f"catalog: {len(cat)} engines in {REFS.name}")
    print(f"fetched ({len(fetched)}): {', '.join(fetched) or '-'}")
    print(f"enabled skill links ({len(links)}): {', '.join(links) or '-'}")
    if VENDOR.exists():
        size = subprocess.run(["du", "-sh", str(VENDOR)], capture_output=True, text=True).stdout.split()[0]
        print(f"vendor size: {size}")


CATS = {"1": "1-kids", "kids": "1-kids", "2": "2-games", "games": "2-games", "gaming": "2-games",
        "3": "3-facts", "facts": "3-facts", "4": "4-history-mythology", "history": "4-history-mythology",
        "mythology": "4-history-mythology", "myth": "4-history-mythology"}


def cmd_for(cat, args):
    key = (args[0].lower() if args else "")
    if key not in CATS:
        sys.exit("for <kids|games|facts|history>")
    folder = SKILL / "categories" / CATS[key]
    text = " ".join(f.read_text() for f in folder.glob("*.md"))
    ids = sorted(set(re.findall(r"`([A-Z]-[\w-]+)`", text)) & set(cat))
    print(f"{CATS[key]}: {len(ids)} recommended engine(s)\n")
    for i in ids:
        print(row(cat[i]))


CMDS = dict(for_=cmd_for, list=cmd_list, search=cmd_search, show=cmd_show, fetch=cmd_fetch, skills=cmd_skills,
            enable=cmd_enable, disable=cmd_disable, status=cmd_status)

CMDS["for"] = CMDS.pop("for_")

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in CMDS:
        print(__doc__)
        sys.exit(0 if len(sys.argv) < 2 else 1)
    CMDS[sys.argv[1]](catalog(), sys.argv[2:])
