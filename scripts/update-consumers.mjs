// Met à jour @esupadomit/shared-prisma-ee-es directement sur la branche main
// (branches main et test) des autres dépôts via l'API GitHub (gh api) — sans clone.
//
//   npm run update-consumers                 -> version du package.json
//   npm run update-consumers -- 2.0.14       -> version précise
//   npm run update-consumers -- --dry-run    -> affiche sans rien commiter
import { execSync, execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const NAME = pkg.name;
const SCOPE = NAME.split("/")[0];
const args = process.argv.slice(2);
const VERSION = args.find((a) => !a.startsWith("--")) || pkg.version;
const DRY = args.includes("--dry-run");
const BRANCHES = ["main", "test"];
const REGISTRY = "https://npm.pkg.github.com";

const REPOS = [
  "esupadomIT/cronjob",
  "esupadomIT/elite-etude.tn",
  "esupadomIT/e-supadom.fr",
  "esupadomIT/admin.elite-etude.tn",
  "esupadomIT/admin.e-supadom.fr",
   "esupadomIT/prisma",
];

const gh = (apiArgs, input) =>
  execFileSync("gh", ["api", ...apiArgs], {
    encoding: "utf8",
    input,
    maxBuffer: 1 << 28,
    stdio: ["pipe", "pipe", "pipe"],
  });

// --- Infos de la version publiée (pour le package-lock) ---
let dist;
try {
  dist = JSON.parse(
    execSync(
      `npm view ${NAME}@${VERSION} dist --json --${SCOPE}:registry=${REGISTRY}`,
      { encoding: "utf8" }
    )
  );
} catch {
  console.error(`La version ${NAME}@${VERSION} est introuvable sur ${REGISTRY}.`);
  process.exit(1);
}

const newSpec = (spec) => {
  const m = /^([\^~]?)\d/.exec(spec);
  return m ? m[1] + VERSION : null; // ignore file:, git:, workspace:, etc.
};

// Garde l'indentation / fins de ligne d'origine
const parse = (raw) => ({
  data: JSON.parse(raw),
  indent: (/\n([ \t]+)"/.exec(raw) || [, "  "])[1],
  eol: raw.includes("\r\n") ? "\r\n" : "\n",
  final: /\r?\n$/.test(raw),
});
const stringify = ({ data, indent, eol, final }) => {
  let s = JSON.stringify(data, null, indent);
  if (eol === "\r\n") s = s.replace(/\n/g, "\r\n");
  return final ? s + eol : s;
};

const readRaw = (repo, path, BRANCH) =>
  gh(["-H", "Accept: application/vnd.github.raw",
      `repos/${repo}/contents/${encodeURI(path)}?ref=${BRANCH}`]);

const writeFile = (repo, path, sha, content, message, BRANCH) => {
  if (DRY) return console.log(`   [dry-run] commit ${path}`);
  const body = JSON.stringify({
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    sha,
    branch: BRANCH,
  });
  gh(["-X", "PUT", `repos/${repo}/contents/${encodeURI(path)}`, "--input", "-"], body);
  console.log(`   commit ${path}`);
};

function bumpPackageJson(p) {
  let changed = false;
  for (const f of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    const cur = p.data[f]?.[NAME];
    if (!cur) continue;
    const next = newSpec(cur);
    if (next && next !== cur) { p.data[f][NAME] = next; changed = true; }
  }
  return changed;
}

function bumpLock(l, spec) {
  let changed = false;
  const root = l.data.packages?.[""];
  for (const f of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    if (root?.[f]?.[NAME] && root[f][NAME] !== spec) { root[f][NAME] = spec; changed = true; }
  }
  const setEntry = (e) => {
    if (!e || e.version === VERSION) return;
    e.version = VERSION;
    e.resolved = dist.tarball;
    e.integrity = dist.integrity;
    changed = true;
  };
  for (const [k, v] of Object.entries(l.data.packages || {}))
    if (k === `node_modules/${NAME}` || k.endsWith(`/node_modules/${NAME}`)) setEntry(v);
  setEntry(l.data.dependencies?.[NAME]); // lockfile v1
  return changed;
}

console.log(`Mise à jour de ${NAME} -> ${VERSION} (branches ${BRANCHES.join(", ")})${DRY ? " [DRY-RUN]" : ""}`);
const msg = `chore: bump ${NAME} to ${VERSION}`;
let failures = 0;


for (const repo of REPOS) for (const BRANCH of BRANCHES) {
  console.log(`\n=== ${repo} (${BRANCH}) ===`);
  try {
    try { gh([`repos/${repo}/branches/${BRANCH}`]); }
    catch { console.log(`   Branche ${BRANCH} absente, ignorée.`); continue; }
    const tree = JSON.parse(gh([`repos/${repo}/git/trees/${BRANCH}?recursive=1`]));
    const blobs = new Map(tree.tree.filter((t) => t.type === "blob").map((t) => [t.path, t.sha]));
    const pkgPaths = [...blobs.keys()].filter(
      (p) => /(^|\/)package\.json$/.test(p) && !p.includes("node_modules/")
    );

    let touched = false;
    for (const pkgPath of pkgPaths) {
      const p = parse(readRaw(repo, pkgPath, BRANCH));

      // Projet prisma : c'est le package lui-même -> champ "version"
      if (p.data.name === NAME) {
        touched = true;
        if (p.data.version === VERSION) {
          console.log(`   ${pkgPath}: version déjà à ${VERSION}, aucun commit.`);
        } else {
          console.log(`   ${pkgPath}: version ${p.data.version} -> ${VERSION}`);
          p.data.version = VERSION;
          writeFile(repo, pkgPath, blobs.get(pkgPath), stringify(p), msg, BRANCH);
        }
        continue;
      }

      const allDeps = { ...p.data.dependencies, ...p.data.devDependencies,
                        ...p.data.peerDependencies, ...p.data.optionalDependencies };
      if (!allDeps[NAME]) continue;
      touched = true;

      const oldSpec = allDeps[NAME];
      const changedPkg = bumpPackageJson(p);
      const spec = newSpec(oldSpec) || oldSpec;

      const dir = pkgPath.includes("/") ? pkgPath.slice(0, pkgPath.lastIndexOf("/") + 1) : "";
      const lockPath = `${dir}package-lock.json`;
      let lock = null, changedLock = false;
      if (blobs.has(lockPath)) {
        lock = parse(readRaw(repo, lockPath, BRANCH));
        changedLock = bumpLock(lock, spec);
      }

      if (!changedPkg && !changedLock) {
        console.log(`   ${pkgPath}: déjà à ${VERSION}, aucun commit.`);
        continue;
      }
      console.log(`   ${pkgPath}: ${oldSpec} -> ${spec}`);
      if (changedLock) writeFile(repo, lockPath, blobs.get(lockPath), stringify(lock), msg, BRANCH);
      if (changedPkg) writeFile(repo, pkgPath, blobs.get(pkgPath), stringify(p), msg, BRANCH);
    }
    if (!touched) console.log(`   Aucun package.json n'utilise ${NAME}.`);
  } catch (e) {
    failures++;
    console.error(`   ECHEC: ${(e.stderr || e.message).toString().trim()}`);
  }
}

process.exit(failures ? 1 : 0);
