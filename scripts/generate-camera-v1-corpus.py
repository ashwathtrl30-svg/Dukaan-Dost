#!/usr/bin/env python3
"""Generate a fictional 40-document Camera V1 corpus. Requires Pillow; no network calls."""
import argparse
import csv
import hashlib
import json
import random
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SANS_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
DEV = "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf"
DEV_B = "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf"
HAND = "/usr/share/fonts/truetype/dejavu/DejaVuSerifCondensed-Italic.ttf"
HAND_B = "/usr/share/fonts/truetype/dejavu/DejaVuSerifCondensed-BoldItalic.ttf"
INK, BLUE, MUTED, PAPER, RULE = (35, 49, 66), (39, 69, 103), (105, 116, 126), (252, 250, 242), (222, 225, 221)
W, H = 1240, 1754
DIGITS = str.maketrans("0123456789", "०१२३४५६७८९")
UNITS_HI = {"kg": "किलो", "g": "ग्राम", "L": "लीटर", "packet": "पैकेट", "piece": "पीस", "bottle": "बोतल", "cup": "कप", "dozen": "दर्जन", "roll": "रोल"}
CATALOG = [
    ("Basmati Rice", 2, "kg", 19000), ("Toor Dal", 1, "kg", 16500), ("Fortune Sunflower Oil", 1, "bottle", 14500),
    ("Tata Salt", 2, "packet", 5600), ("Aashirvaad Atta", 5, "kg", 26000), ("Amul Gold Milk", 2, "L", 13600),
    ("Parle-G Biscuits", 10, "packet", 5000), ("Dettol Soap", 4, "piece", 16000), ("Maggi Noodles", 6, "packet", 8400),
    ("Surf Excel", 1, "kg", 12000), ("Chana Dal", 2, "kg", 18400), ("Moong Dal", 1, "kg", 13800),
    ("Sugar", 3, "kg", 13200), ("Tea Powder", 500, "g", 21500), ("Curd", 2, "cup", 6000),
    ("Bathing Soap", 3, "piece", 9900), ("Toothpaste", 2, "piece", 11800), ("Red Chilli Powder", 200, "g", 7200),
    ("Turmeric Powder", 200, "g", 5400), ("Dishwash Bar", 5, "piece", 7500), ("Wheat Flour", 2, "kg", 9800),
    ("Poha", 1, "kg", 6200), ("Jaggery", 500, "g", 4800), ("Groundnut Oil", 1, "L", 17200),
    ("Coconut", 3, "piece", 9000), ("Banana", 1, "dozen", 6000), ("Notebook A5", 4, "piece", 12000),
    ("Ball Pen", 6, "piece", 6000), ("LED Bulb 9W", 2, "piece", 18000), ("Detergent Powder", 2, "kg", 21000),
    ("Tomato", 1, "kg", 4000), ("Onion", 2, "kg", 7000), ("Potato", 3, "kg", 9000),
    ("Bottle Water", 6, "bottle", 12000), ("Paper Cup", 2, "packet", 8000), ("Sewing Thread", 3, "roll", 7500),
]
HINDI = ["बासमती चावल", "तूर दाल", "सूरजमुखी तेल", "टाटा नमक", "गेहूँ आटा", "अमूल दूध", "पारले बिस्किट", "डिटॉल साबुन", "मैगी नूडल्स", "सर्फ एक्सेल", "चना दाल", "मूंग दाल", "चीनी", "चाय पत्ती", "दही", "टूथपेस्ट", "हल्दी पाउडर", "लाल मिर्च", "पोहा", "गुड़", "मूंगफली तेल", "केला", "कॉपी A5", "बॉल पेन", "टमाटर"]


def font(path, size):
    if not Path(path).is_file():
        raise RuntimeError(f"Missing font {path}; install fonts-dejavu-core and fonts-noto-core.")
    return ImageFont.truetype(path, size)


def money(paise):
    if paise is None:
        return "?"
    return f"₹{paise / 100:,.2f}".rstrip("0").rstrip(".")


def item(name, quantity, unit, amount_paise, needs_review=False, note="", display_line=None):
    return {
        "productName": name,
        "quantity": quantity,
        "quantityUnit": unit,
        "finalAmountPaise": amount_paise,
        "needsReview": needs_review,
        "notes": note,
        "displayLine": display_line,
    }


def pick(seed, count):
    rows = []
    for index in range(count):
        name, quantity, unit, amount = CATALOG[(seed * 7 + index * 5) % len(CATALOG)]
        rows.append(item(name, quantity, unit, amount))
    return rows


def jitter(canvas, text, x, y, face, rng, fill=BLUE, width=1040):
    text = text.replace("₹", "Rs.")
    layer = Image.new("RGBA", (width, 76), (0, 0, 0, 0))
    ImageDraw.Draw(layer).text((4, 3 + rng.randrange(0, 7)), text, font=face, fill=fill)
    layer = layer.rotate(rng.uniform(-1.5, 1.2), resample=Image.Resampling.BICUBIC)
    canvas.paste(layer, (x + rng.randrange(-5, 8), y), layer)


def print_document(document):
    rows = document["items"]
    image = Image.new("RGB", (W, H), "white")
    draw = ImageDraw.Draw(image)
    title, body = font(SANS_B, 38), font(SANS, 22)
    small, heading = font(SANS, 18), font(SANS_B, 21)
    draw.text((76, 58), f"DUKAAN SAMPLE STORE {document['seed']:02d}", font=title, fill=INK)
    draw.text((76, 112), "FICTIONAL TRAINING DOCUMENT  •  SAMPLE ONLY", font=body, fill=MUTED)
    draw.line((76, 160, W - 76, 160), fill=(80, 91, 101), width=3)
    draw.text((76, 190), "CASH MEMO / SALES BILL", font=heading, fill=INK)
    draw.text((76, 232), f"Document ID: {document['documentId']}   Ref: SYN-{document['seed'] + 301:04d}", font=small, fill=MUTED)
    draw.text((76, 266), "Customer: Walk-in    Date: 12 Nov 2026", font=small, fill=MUTED)
    y0 = 330
    draw.rounded_rectangle((70, y0, W - 70, y0 + 56), radius=8, fill=(238, 242, 245))
    for x, label in [(92, "ITEM DESCRIPTION"), (735, "QTY"), (870, "RATE"), (1040, "AMOUNT")]:
        draw.text((x, y0 + 14), label, font=heading, fill=INK)
    y = y0 + 70
    row_height = 100 if len(rows) <= 8 else 62
    row_font = font(SANS, 21 if row_height > 70 else 17)
    for row in rows:
        quantity = row["quantity"]
        quantity_text = "—" if quantity is None else f"{quantity:g} {row['quantityUnit'] or ''}"
        amount = row["finalAmountPaise"]
        rate = "—" if quantity in (None, 0) or amount is None else money(round(amount / quantity))
        draw.text((92, y + 10), row["productName"], font=row_font, fill=INK)
        draw.text((735, y + 10), quantity_text, font=row_font, fill=INK)
        draw.text((870, y + 10), rate, font=row_font, fill=INK)
        draw.text((1040, y + 10), money(amount), font=row_font, fill=INK)
        draw.line((88, y + row_height - 8, W - 90, y + row_height - 8), fill=RULE, width=2)
        y += row_height
    total = sum(row["finalAmountPaise"] or 0 for row in rows)
    draw.text((720, y + 26), "ITEM TOTAL", font=heading, fill=INK)
    draw.text((1025, y + 26), money(total), font=heading, fill=INK)
    if document.get("footerNote"):
        draw.text((76, 1515), document["footerNote"], font=small, fill=(100, 85, 70))
    draw.text((76, H - 115), "Synthetic sample. No real customer or business information.", font=small, fill=MUTED)
    return image


def handwriting_style_document(document, tall=False):
    rows = document["items"]
    row_height = 43 if tall else 77
    top = 155
    height = max(H, top + len(rows) * row_height + 150)
    image = Image.new("RGB", (W, height), PAPER)
    draw = ImageDraw.Draw(image)
    for y in range(75, height, row_height):
        draw.line((58, y, W - 55, y), fill=(224, 229, 222), width=1)
    draw.line((125, 0, 125, height), fill=(235, 185, 175), width=3)
    rng = random.Random(document["seed"] * 97 + len(rows))
    heading = font(HAND_B, 42 if not tall else 32)
    body = font(HAND, 36 if not tall else 27)
    jitter(image, "today sale list / dukaan", 155, 38, heading, rng)
    jitter(image, f"{document['documentId']} - sample notes", 160, 90, font(HAND, 25), rng, fill=(70, 88, 108))
    y = top
    for row in rows:
        quantity = row["quantity"]
        quantity_text = "?" if quantity is None else (str(int(quantity)) if float(quantity).is_integer() else str(quantity))
        unit = row["quantityUnit"] or ""
        if row.get("displayLine"):
            line = row["displayLine"]
        elif "overwritten" in row.get("notes", "").lower():
            line = f"{quantity_text} {unit} {row['productName']}  Rs.125 (crossed out) -> Rs.130"
        elif row["finalAmountPaise"] is None:
            line = f"{quantity_text} {unit} {row['productName']}  ?"
        elif quantity is None:
            line = f"{row['productName']}  -  {money(row['finalAmountPaise'])}"
        else:
            line = f"{quantity_text} {unit} {row['productName']}  ........  {money(row['finalAmountPaise'])}"
        jitter(image, line, 150 + rng.randrange(0, 16), y + rng.randrange(-4, 7), body, rng, fill=(34, 48, 83))
        y += row_height
    if not tall:
        jitter(image, "end of list", 165, min(y + 18, height - 90), font(HAND, 27), rng, fill=(70, 88, 108))
    return image


def hindi_document(document):
    image = Image.new("RGB", (W, H), (255, 255, 253))
    draw = ImageDraw.Draw(image)
    draw.text((78, 70), "आज की दुकान बिक्री", font=font(DEV_B, 43), fill=INK, language="hi")
    draw.text((78, 132), "नमूना सूची", font=font(DEV, 25), fill=MUTED, language="hi")
    draw.text((245, 132), f"| {document['documentId']} | SAMPLE ONLY", font=font(SANS, 22), fill=MUTED)
    draw.line((78, 195, W - 78, 195), fill=RULE, width=2)
    y = 245
    body = font(DEV, 34)
    for row in document["items"]:
        quantity = row["quantity"]
        quantity_text = "?" if quantity is None else (str(int(quantity)) if float(quantity).is_integer() else str(quantity))
        unit = UNITS_HI.get(row["quantityUnit"], row["quantityUnit"] or "")
        amount = row["finalAmountPaise"]
        price = "?" if amount is None else f"{amount / 100:,.2f}".rstrip("0").rstrip(".")
        line = f"{quantity_text.translate(DIGITS)} {unit}  {row['productName']}  —  ₹{price.translate(DIGITS)}"
        draw.text((100, y), line, font=body, fill=(39, 58, 83), language="hi")
        y += 112
    draw.text((78, H - 105), "यह एक काल्पनिक नमूना है। कोई असली दुकान/ग्राहक डेटा नहीं।", font=font(DEV, 25), fill=MUTED, language="hi")
    return image


def make_documents():
    documents = []
    for index in range(10):
        documents.append({"documentId": f"P{index + 1:02d}", "documentType": "printed_invoice", "language": "en", "items": pick(index + 1, 4 + index % 4), "kind": "print", "seed": index + 1})
    for index in range(10):
        documents.append({"documentId": f"H{index + 1:02d}", "documentType": "handwritten_list", "language": "en", "items": pick(index + 11, 4 + index % 4), "kind": "hand", "seed": index + 11})
    for index in range(10):
        rows = pick(index + 21, 4 + index % 4)
        for row_index, row in enumerate(rows):
            row["productName"] = HINDI[(index * 3 + row_index * 2) % len(HINDI)]
        documents.append({"documentId": f"L{index + 1:02d}", "documentType": "hindi_hinglish", "language": "mixed", "items": rows, "kind": "hindi", "seed": index + 21})

    rows = pick(31, 4)
    rows[1] = item("Toor Dal", 10, "kg", None, True, "Price beside quantity has no reliable unit-rate or line-total cue.", "10 kg Toor Dal     500")
    documents.append({"documentId": "D01", "documentType": "difficult_ambiguous", "language": "en", "items": rows, "kind": "hand", "seed": 31})

    rows = pick(32, 5)
    rows[0] = item("Basmati Rice", 1.5, "kg", 13650, False, "Decimal final amount; preserve paise.")
    documents.append({"documentId": "D02", "documentType": "difficult_ambiguous", "language": "en", "items": rows, "kind": "print", "seed": 32})

    documents.append({"documentId": "D03", "documentType": "difficult_ambiguous", "language": "en", "items": pick(33, 5), "kind": "print", "seed": 33, "footerNote": "Invoice-level discount Rs.25 applies to whole bill; do not allocate it across item rows."})

    rows = pick(34, 4)
    rows[0] = item("Rice", 2, "kg", 17000, True, "Explicit 2 kg at Rs.85/kg; final amount is calculated and must be confirmed.", "2 kg Rice @ Rs.85/kg")
    documents.append({"documentId": "D04", "documentType": "difficult_ambiguous", "language": "en", "items": rows, "kind": "hand", "seed": 34})

    rows = [item("Atta 500 g packet", 1, "packet", 3200, False, "One packet with 500 g pack size; sold quantity is one packet.", "1 packet Atta (500 g pack size) Rs.32"), *pick(35, 3)]
    documents.append({"documentId": "D05", "documentType": "difficult_ambiguous", "language": "en", "items": rows, "kind": "hand", "seed": 35})

    rows = pick(36, 4)
    rows[2] = item("Mustard Oil", None, None, 18000, True, "Amount is visible but quantity is absent.", "Mustard Oil  -  Rs.180")
    documents.append({"documentId": "D06", "documentType": "difficult_ambiguous", "language": "en", "items": rows, "kind": "hand", "seed": 36})

    rows = pick(37, 4)
    rows[0] = item("Sugar", 5, "kg", None, True, "Amount is overwritten and cannot be read reliably.", "5 kg Sugar Rs.1?0 (overwritten)")
    documents.append({"documentId": "D07", "documentType": "difficult_ambiguous", "language": "en", "items": rows, "kind": "hand", "seed": 37})

    documents.append({"documentId": "D08", "documentType": "difficult_ambiguous", "language": "en", "items": pick(38, 5), "kind": "print", "seed": 38, "footerNote": "Tax-inclusive line amounts shown. Subtotal and grand total are invoice-level figures."})

    rows = pick(39, 4)
    rows[1] = item("Detergent Powder", 1, "kg", 13000, True, "Old Rs.125 is crossed out and replaced by Rs.130; verify correction.", "1 kg Detergent Powder  Rs.125 (crossed out) -> Rs.130")
    documents.append({"documentId": "D09", "documentType": "difficult_ambiguous", "language": "en", "items": rows, "kind": "hand", "seed": 39})

    stress_rows = []
    for index in range(65):
        name, base_quantity, unit, base_amount = CATALOG[index % len(CATALOG)]
        quantity = [1, 2, 3, 0.5, 4][index % 5]
        if unit in ("piece", "packet", "bottle", "cup", "roll", "dozen") and not float(quantity).is_integer():
            quantity = 1
        amount = int(round(base_amount * quantity / max(base_quantity, 0.5)))
        stress_rows.append(item(f"{name} {index + 1:02d}", quantity, unit, amount, False, "65-row stress sample; every source row must remain distinct."))
    documents.append({"documentId": "D10", "documentType": "difficult_ambiguous", "language": "en", "items": stress_rows, "kind": "tall", "seed": 40})
    assert len(documents) == 40
    assert sum(len(document["items"]) for document in documents) == 263
    return documents


def render(document):
    if document["kind"] == "print":
        image = print_document(document)
    elif document["kind"] == "hindi":
        image = hindi_document(document)
    else:
        image = handwriting_style_document(document, tall=(document["kind"] == "tall"))
    rng = random.Random(document["seed"] * 313 + 11)
    if document["documentType"] == "difficult_ambiguous":
        image = image.rotate(rng.uniform(-0.8, 0.8), resample=Image.Resampling.BICUBIC, fillcolor=(249, 247, 238))
        if document["seed"] in (36, 38):
            image = image.filter(ImageFilter.GaussianBlur(0.28))
    elif document["documentType"] == "handwritten_list":
        image = image.rotate(rng.uniform(-0.45, 0.45), resample=Image.Resampling.BICUBIC, fillcolor=PAPER)
    return image


def build(output, force=False):
    output = Path(output).resolve()
    if output.exists() and any(output.iterdir()):
        if not force:
            raise FileExistsError(f"{output} is not empty; use --force")
        shutil.rmtree(output)
    images = output / "images"
    images.mkdir(parents=True)
    ground_truth_documents, manifest_rows = [], []
    for document in make_documents():
        image_path = images / (document["documentId"] + ".png")
        render(document).save(image_path, "PNG", optimize=True, dpi=(150, 150))
        digest = hashlib.sha256(image_path.read_bytes()).hexdigest()
        ground_truth_items = []
        for index, row in enumerate(document["items"], 1):
            ground_truth_items.append({
                "rowIndex": index,
                "productName": row["productName"],
                "quantity": row["quantity"],
                "quantityUnit": row["quantityUnit"],
                "finalAmountPaise": row["finalAmountPaise"],
                "needsReview": row["needsReview"],
                "notes": row["notes"],
            })
        ground_truth_documents.append({
            "documentId": document["documentId"],
            "documentType": document["documentType"],
            "language": document["language"],
            "imageSha256": digest,
            "items": ground_truth_items,
        })
        manifest_rows.append({
            "document_id": document["documentId"],
            "document_type": document["documentType"],
            "language": document["language"],
            "image_sha256": digest,
            "local_image_path": f"images/{document['documentId']}.png",
            "permission_basis": "synthetic",
            "redaction_checked": "true",
            "ground_truth_status": "verified_synthetic",
            "notes": "fictional sample; no real customer or shop data",
        })

    ground_truth = {
        "schemaVersion": 1,
        "datasetId": "camera-v1-synthetic-40-docs",
        "datasetDescription": "Forty fictional Indian shop documents for offline Camera V1 benchmark development.",
        "syntheticOnly": True,
        "generator": "scripts/generate-camera-v1-corpus.py",
        "documents": ground_truth_documents,
    }
    (output / "ground-truth.json").write_text(json.dumps(ground_truth, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with (output / "manifest.csv").open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=list(manifest_rows[0]))
        writer.writeheader()
        writer.writerows(manifest_rows)
    (output / "README.md").write_text(
        "# Camera V1 synthetic corpus\n\n"
        "40 fictional PNG documents, 263 labelled rows and no real customer/shop data. "
        "P01-P10 are printed invoices; H01-H10 are handwriting-style typeface simulations (not genuine handwriting); "
        "L01-L10 are typeset Hindi/Devanagari mixed-language lists; D01-D10 are difficult cases. D10 contains 65 distinct rows.\n\n"
        "Amounts are integer paise in ground truth. Null means no reliable final line amount is visible. "
        "needsReview=true means a shopkeeper should verify the row. This is a synthetic engineering fixture, not model accuracy evidence. "
        "Real handwriting samples with permission are still required for production conclusions.\n",
        encoding="utf-8",
    )
    return ground_truth


def verify(output):
    output = Path(output).resolve()
    ground_truth = json.loads((output / "ground-truth.json").read_text(encoding="utf-8"))
    documents = ground_truth["documents"]
    if len(documents) != 40:
        raise ValueError(f"Expected 40 documents, found {len(documents)}")
    ids = set()
    for document in documents:
        document_id = document["documentId"]
        if document_id in ids:
            raise ValueError(f"Duplicate document ID: {document_id}")
        ids.add(document_id)
        image_path = output / "images" / (document_id + ".png")
        if not image_path.is_file():
            raise FileNotFoundError(image_path)
        if hashlib.sha256(image_path.read_bytes()).hexdigest() != document["imageSha256"]:
            raise ValueError("Image checksum mismatch: " + document_id)
    image_files = list((output / "images").glob("*.png"))
    if len(image_files) != 40:
        raise ValueError(f"Expected exactly 40 PNG images, found {len(image_files)}")
    with (output / "manifest.csv").open(encoding="utf-8-sig", newline="") as file:
        manifest = list(csv.DictReader(file))
    if len(manifest) != 40:
        raise ValueError(f"Expected exactly 40 manifest rows, found {len(manifest)}")
    by_id = {document["documentId"]: document for document in documents}
    for entry in manifest:
        if entry["document_id"] not in by_id:
            raise ValueError("Manifest contains unknown document: " + entry["document_id"])
        if entry["image_sha256"] != by_id[entry["document_id"]]["imageSha256"]:
            raise ValueError("Manifest checksum mismatch: " + entry["document_id"])
    return {
        "verified": True,
        "documents": 40,
        "rows": sum(len(document["items"]) for document in documents),
        "images": 40,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="private-benchmark/camera-v1-synthetic-corpus")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    result = verify(args.output) if args.verify else {
        "documents": 40,
        "rows": sum(len(document["items"]) for document in build(args.output, args.force)["documents"]),
        "images": 40,
    }
    print(json.dumps({"output": str(Path(args.output).resolve()), **result}, indent=2))


if __name__ == "__main__":
    main()
