// Opt-in local regression against a previously reviewed legacy mapping, not a
// substitute for a colleague's approval. Never publish its PDK/design artifacts.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  scanDesign,
  recommendMappings,
  decisionTemplate,
  confirmMappings,
} from "../dist/packages/virtuoso-import/core/index.js";
import {
  loadCatalog,
  convertDesign,
} from "../dist/packages/virtuoso-import/adapter/index.js";
const root = fileURLToPath(new URL("../", import.meta.url));
const [sourceFile, legacyMappingFile, out] = process.argv.slice(2);
if (!sourceFile || !legacyMappingFile || !out)
  throw Error(
    "Usage: node scripts/regression.mjs SNAPSHOT LEGACY_MAPPING NEW_OUTPUT_DIR",
  );
const source = JSON.parse(await fs.readFile(sourceFile)),
  legacy = JSON.parse(await fs.readFile(legacyMappingFile));
const catalog = await loadCatalog({ root }),
  inventory = scanDesign(source);
const rules = {
  version: 1,
  rules: inventory.items.map((i) => {
    const r = legacy.rules.find(
      (r) => r.library === i.master.library && r.cell === i.master.cell,
    );
    if (!r)
      throw Error("No reviewed legacy rule for " + JSON.stringify(i.master));
    return {
      id: "legacy-" + i.id,
      master: i.master,
      mapping: {
        symbol: r.symbol,
        pins:
          r.symbol === "port"
            ? Object.fromEntries(i.pinNames.map((p) => [p, "P"]))
            : r.pins,
        parameters: {},
      },
    };
  }),
};
// Variants of the same master share one candidate rule, but confirmation is per signature.
rules.rules = rules.rules.filter(
  (r, n, all) =>
    all.findIndex(
      (x) => JSON.stringify(x.master) === JSON.stringify(r.master),
    ) === n,
);
const proposal = recommendMappings(inventory, rules, catalog),
  decisions = decisionTemplate(proposal);
decisions.reviewedBy = "regression-only: previously reviewed legacy rules";
for (const d of decisions.decisions) {
  const p = proposal.items.find((i) => i.itemId === d.itemId);
  if (p.candidates.length !== 1) throw Error("Ambiguous regression mapping");
  d.action = "approve";
  d.candidateId = p.candidates[0].id;
}
const { package: pkg } = confirmMappings(proposal, decisions, catalog, {
  name: "local-regression-not-for-distribution",
});
const result = await convertDesign(source, pkg, { runtime: { root } });
await fs.mkdir(out, { recursive: false });
await fs.writeFile(
  path.join(out, "project.icproj.json"),
  JSON.stringify(result.project, null, 2),
);
await fs.writeFile(
  path.join(out, "report.json"),
  JSON.stringify(result.report, null, 2),
);
await fs.writeFile(path.join(out, "preview.svg"), result.svg);
console.log(
  JSON.stringify(
    { counts: result.report.counts, validation: result.validation },
    null,
    2,
  ),
);
