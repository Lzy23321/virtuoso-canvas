import fs from "node:fs";
import * as contracts from "../dist/packages/virtuoso-import/core/contracts.js";
import { MappingTableSchema } from "../dist/packages/virtuoso-import/core/mapping-table.js";
import { UserConfigSchema } from "../dist/packages/virtuoso-import/core/user-config.js";
fs.writeFileSync(
  new URL("../schemas/MappingTable.schema.json", import.meta.url),
  JSON.stringify(contracts.z.toJSONSchema(MappingTableSchema), null, 2) + "\n",
);
fs.writeFileSync(
  new URL("../schemas/UserConfig.schema.json", import.meta.url),
  JSON.stringify(contracts.z.toJSONSchema(UserConfigSchema), null, 2) + "\n",
);
for (const name of [
  "Snapshot",
  "Inventory",
  "MappingPackage",
  "Proposal",
  "Decisions",
  "BuiltinRules",
]) {
  fs.writeFileSync(
    new URL("../schemas/" + name + ".schema.json", import.meta.url),
    JSON.stringify(
      contracts.z.toJSONSchema(contracts[name + "Schema"]),
      null,
      2,
    ) + "\n",
  );
}
