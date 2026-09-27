"""Read-only Bridge extraction benchmark for the four acceptance designs."""
import datetime
import json
from pathlib import Path
import socket
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
DESIGNS = [
    ("sar_adc_12bit_1MHz", "SAR_ADC_TOP_new", "/home/userone/Projects/Project_2026/sar_adc_12bit_1MHz"),
    ("sar_adc_12bit_1MHz", "Bootstrap", "/home/userone/Projects/Project_2026/sar_adc_12bit_1MHz"),
    ("sar_adc_12bit_1MHz", "strongarm", "/home/userone/Projects/Project_2026/sar_adc_12bit_1MHz"),
    ("sar_adc_12bit_40MHz", "L2_cdac_12b_CS", "/home/userone/Projects/Project_BTD/sar_adc_12bit_40MHz"),
]


def execute(code):
    with socket.create_connection(("127.0.0.1", 65432), timeout=185) as conn:
        conn.sendall(json.dumps({"skill": code, "timeout": 180}).encode())
        conn.shutdown(socket.SHUT_WR)
        chunks = []
        while True:
            chunk = conn.recv(65536)
            if not chunk:
                break
            chunks.append(chunk)
    result = b"".join(chunks)
    if result[:1] != b"\x02":
        raise RuntimeError(result.decode(errors="replace"))
    return result[1:].decode()


if __name__ == "__main__":
    out = Path(tempfile.mkdtemp(prefix="acceptance-", dir=ROOT / "work"))
    summary = {"startedAt": datetime.datetime.now().astimezone().isoformat(),
               "timing": "One sample per design; wall-clock seconds include TCP, SKILL, file output and response; exporter load excluded.",
               "designs": []}
    print(out, flush=True)
    summary["virtuosoVersion"] = execute("getVersion()")
    start = time.perf_counter()
    execute('load(' + json.dumps(str(ROOT / "skill/export_schematic.il")) + ')')
    summary["exporterLoadSeconds"] = time.perf_counter() - start
    for lib, cell, expected in DESIGNS:
        row = {"library": lib, "cell": cell, "expectedLibraryPath": expected}
        try:
            row["actualLibraryPath"] = execute('ddGetObj(' + json.dumps(lib) + ')~>readPath').strip().strip('"')
            if row["actualLibraryPath"] != expected:
                raise RuntimeError("Library path mismatch")
            dest = out / (cell + ".snapshot.json")
            start = time.perf_counter()
            row["response"] = execute("VCExportCell(" + " ".join(json.dumps(x) for x in [lib, cell, "schematic", str(dest)]) + ")")
            row["extractSeconds"] = time.perf_counter() - start
            data = json.loads(dest.read_text())
            row.update(status="success", snapshot=dest.name, bytes=dest.stat().st_size,
                       counts={k: len(data[k]) for k in ["instances", "nets", "terminals", "shapes", "symbols"]}, warnings=data["warnings"])
        except Exception as error:
            row.update(status="failed", error=str(error))
        summary["designs"].append(row)
        (out / "extraction.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2))
        print(json.dumps(row, ensure_ascii=False), flush=True)
