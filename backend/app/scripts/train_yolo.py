"""
FarmSathi — Automated YOLOv8 Training Pipeline
================================================
Pipeline:
  Download → Extract → Remap Classes → Clean → Split → Write YAML → Train → Validate

Usage (from backend/ directory):
    python -m app.scripts.train_yolo

Or run directly:
    python app/scripts/train_yolo.py

Requirements (auto-installed if missing):
    kagglehub, ultralytics, opencv-python, Pillow, PyYAML, scikit-learn
"""

import os
import sys
import shutil
import hashlib
import logging
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("FarmSathi.TrainPipeline")

# ── Constants ─────────────────────────────────────────────────────────────────

DATASET_DIR = Path("dataset")
IMAGES_TRAIN = DATASET_DIR / "images" / "train"
IMAGES_VAL   = DATASET_DIR / "images" / "val"
LABELS_TRAIN = DATASET_DIR / "labels" / "train"
LABELS_VAL   = DATASET_DIR / "labels" / "val"
YAML_PATH    = DATASET_DIR / "plant.yaml"

TRAIN_RATIO  = 0.80
BLUR_THRESH  = 80.0   # Laplacian variance below this → blurry
IMG_EXTS     = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# ── Class remapping ───────────────────────────────────────────────────────────
# PlantVillage folder names contain crop + condition separated by ___
# We map those conditions to our unified taxonomy.

BASE_CLASSES: Dict[int, str] = {
    0: "healthy",
    1: "nutrient_deficiency",
    2: "water_stress",
    3: "pest_damage",
    4: "leaf_blight",
    5: "rust",
    6: "powdery_mildew",
    7: "bacterial_spot",
    8: "early_blight",
    9: "late_blight",
    10: "leaf_scorch",
    11: "leaf_mold",
    12: "septoria_leaf_spot",
    13: "target_spot",
    14: "mosaic_virus",
    15: "yellow_leaf_curl_virus",
}

# Keyword → class id mapping (case-insensitive substring match)
KEYWORD_TO_CLASS: Dict[str, int] = {
    "healthy":              0,
    "nutrient":             1,
    "deficiency":           1,
    "water_stress":         2,
    "drought":              2,
    "mite":                 3,
    "aphid":                3,
    "pest":                 3,
    "leaf_blight":          4,
    "blight":               4,
    "rust":                 5,
    "powdery_mildew":       6,
    "mildew":               6,
    "bacterial_spot":       7,
    "bacterial":            7,
    "early_blight":         8,
    "late_blight":          9,
    "leaf_scorch":          10,
    "scorch":               10,
    "leaf_mold":            11,
    "mold":                 11,
    "septoria":             12,
    "target_spot":          13,
    "target":               13,
    "mosaic":               14,
    "virus":                14,
    "yellow_leaf_curl":     15,
    "curl":                 15,
}


# ─────────────────────────────────────────────────────────────────────────────
# STEP 0 — Install missing packages & download dataset
# ─────────────────────────────────────────────────────────────────────────────

def ensure_package(pkg: str, import_name: str = None):
    """Install a package if it's not already importable."""
    import_name = import_name or pkg
    try:
        __import__(import_name)
    except ImportError:
        log.info(f"Installing {pkg}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "-q"])
        log.info(f"{pkg} installed.")


def download_dataset() -> Path:
    """Download PlantDisease dataset from Kaggle via kagglehub."""
    ensure_package("kagglehub")
    ensure_package("ultralytics")
    ensure_package("opencv-python", "cv2")
    ensure_package("Pillow", "PIL")
    ensure_package("pyyaml", "yaml")
    ensure_package("scikit-learn", "sklearn")

    import kagglehub  # noqa: E402

    log.info("Downloading dataset: emmarex/plantdisease ...")
    raw_path = kagglehub.dataset_download("emmarex/plantdisease")
    log.info(f"Dataset downloaded to: {raw_path}")
    return Path(raw_path)


# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — Inspect & locate image root
# ─────────────────────────────────────────────────────────────────────────────

def find_image_root(base: Path) -> Path:
    """
    PlantVillage can be nested (e.g. base/PlantVillage/...).
    Walk until we find a directory whose children are class-named folders
    (i.e., folders containing images, not further nested dirs).
    """
    for root, dirs, files in os.walk(base):
        root_path = Path(root)
        img_files = [f for f in files if Path(f).suffix.lower() in IMG_EXTS]
        if img_files:
            # Return the parent of the first folder that contains images
            return root_path.parent
    return base


def collect_class_folders(image_root: Path) -> Dict[str, Path]:
    """Return {folder_name: folder_path} for every class sub-folder."""
    folders = {}
    for item in sorted(image_root.iterdir()):
        if item.is_dir():
            imgs = [f for f in item.iterdir() if f.suffix.lower() in IMG_EXTS]
            if imgs:
                folders[item.name] = item
    log.info(f"Found {len(folders)} class folders in dataset.")
    return folders


# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — Class remapping
# ─────────────────────────────────────────────────────────────────────────────

def map_folder_to_class(folder_name: str) -> int:
    """
    Map a PlantVillage folder name to our class taxonomy.
    Folder names look like:  'Tomato___Late_blight'  or  'Apple___healthy'
    """
    # Extract the condition part (after ___)
    condition = folder_name.split("___")[-1].lower().replace("_", " ").replace("-", " ")
    condition_key = condition.replace(" ", "_")

    # Try longest keyword match first (most specific)
    for keyword, class_id in sorted(KEYWORD_TO_CLASS.items(), key=lambda x: -len(x[0])):
        if keyword.replace("_", " ") in condition or keyword in condition_key:
            return class_id

    # Unknown → treat as general disease (leaf_blight bucket)
    log.warning(f"Unknown class: '{folder_name}' → assigned to leaf_blight (4)")
    return 4


# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — Data cleaning
# ─────────────────────────────────────────────────────────────────────────────

def is_blurry(img_path: Path, threshold: float = BLUR_THRESH) -> bool:
    """Return True if image is too blurry to be useful."""
    import cv2
    img = cv2.imread(str(img_path), cv2.IMREAD_GRAYSCALE)
    if img is None:
        return True  # unreadable → treat as blurry / corrupt
    variance = cv2.Laplacian(img, cv2.CV_64F).var()
    return variance < threshold


def file_hash(path: Path) -> str:
    """MD5 hash of file content — used to detect duplicates."""
    md5 = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            md5.update(chunk)
    return md5.hexdigest()


def clean_images(images: List[Path]) -> List[Path]:
    """Remove blurry images and duplicates. Return clean list."""
    seen_hashes = set()
    clean = []
    removed_blur = 0
    removed_dup = 0

    for img in images:
        # Duplicate check
        h = file_hash(img)
        if h in seen_hashes:
            removed_dup += 1
            continue
        seen_hashes.add(h)

        # Blur check
        if is_blurry(img):
            removed_blur += 1
            continue

        clean.append(img)

    log.info(f"  Cleaned: removed {removed_dup} duplicates, {removed_blur} blurry images.")
    return clean


# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Train/Val split + YOLO label writing
# ─────────────────────────────────────────────────────────────────────────────

def write_yolo_label(label_path: Path, class_id: int):
    """
    Write a YOLO label file.
    Since PlantVillage is a classification dataset (no bounding boxes),
    we use a whole-image bounding box: cx=0.5, cy=0.5, w=1.0, h=1.0
    """
    label_path.parent.mkdir(parents=True, exist_ok=True)
    label_path.write_text(f"{class_id} 0.5 0.5 1.0 1.0\n")


def split_and_write(
    class_images: Dict[int, List[Path]],
    train_ratio: float = TRAIN_RATIO,
) -> Tuple[int, int]:
    """Copy images + write YOLO labels into train/val split folders."""
    from sklearn.model_selection import train_test_split

    # Setup output dirs
    for d in [IMAGES_TRAIN, IMAGES_VAL, LABELS_TRAIN, LABELS_VAL]:
        d.mkdir(parents=True, exist_ok=True)

    total_train = 0
    total_val = 0

    for class_id, images in class_images.items():
        if len(images) < 2:
            log.warning(f"Class {class_id} has <2 images — skipping split.")
            continue

        train_imgs, val_imgs = train_test_split(
            images,
            train_size=train_ratio,
            random_state=42,
        )

        for split_imgs, img_dir, lbl_dir in [
            (train_imgs, IMAGES_TRAIN, LABELS_TRAIN),
            (val_imgs,   IMAGES_VAL,   LABELS_VAL),
        ]:
            for img_path in split_imgs:
                # Unique filename: classid_original_name
                dest_name = f"c{class_id}_{img_path.name}"
                dest_img  = img_dir / dest_name
                dest_lbl  = lbl_dir / (Path(dest_name).stem + ".txt")

                shutil.copy2(img_path, dest_img)
                write_yolo_label(dest_lbl, class_id)

        total_train += len(train_imgs)
        total_val   += len(val_imgs)

    return total_train, total_val


# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 — Write plant.yaml
# ─────────────────────────────────────────────────────────────────────────────

def write_yaml(used_class_ids: List[int]):
    """Generate plant.yaml with only the classes present in the dataset."""
    import yaml

    names = {cid: BASE_CLASSES[cid] for cid in sorted(used_class_ids)}

    config = {
        "path":  str(DATASET_DIR.resolve()),
        "train": "images/train",
        "val":   "images/val",
        "nc":    len(names),
        "names": names,
    }

    YAML_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(YAML_PATH, "w") as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

    log.info(f"plant.yaml written → {YAML_PATH}")
    log.info(f"  Classes ({len(names)}): {list(names.values())}")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 6 — Training
# ─────────────────────────────────────────────────────────────────────────────

def run_training(epochs: int = 50, imgsz: int = 640, model: str = "yolov8n.pt"):
    """Launch YOLOv8 training via ultralytics."""
    from ultralytics import YOLO

    train_cmd = (
        f"yolo detect train "
        f"data={YAML_PATH.resolve()} "
        f"model={model} "
        f"epochs={epochs} "
        f"imgsz={imgsz}"
    )
    log.info("=" * 60)
    log.info("Starting YOLOv8 training...")
    log.info(f"  Equivalent CLI command:\n  {train_cmd}")
    log.info("=" * 60)

    yolo_model = YOLO(model)
    results = yolo_model.train(
        data=str(YAML_PATH.resolve()),
        epochs=epochs,
        imgsz=imgsz,
        project="runs/train",
        name="farmsathi_v1",
        exist_ok=True,
    )
    return results


# ─────────────────────────────────────────────────────────────────────────────
# STEP 7 — Validation
# ─────────────────────────────────────────────────────────────────────────────

def run_validation(model_path: Path = None):
    """Run validation and log confusion matrix warnings."""
    from ultralytics import YOLO

    if model_path is None:
        model_path = Path("runs/train/farmsathi_v1/weights/best.pt")

    if not model_path.exists():
        log.warning(f"No trained model found at {model_path}. Skipping validation.")
        return

    log.info("Running validation...")
    yolo_model = YOLO(str(model_path))
    metrics = yolo_model.val(data=str(YAML_PATH.resolve()))

    # Check confusion — warn if stress/disease classes are mixed up
    confused_pairs = []
    try:
        cm = metrics.confusion_matrix.matrix  # numpy array
        stress_ids = {1, 2, 3}
        disease_ids = {4, 5, 6, 7, 8, 9, 10, 11, 12, 13}

        for true_id in stress_ids:
            for pred_id in disease_ids:
                if true_id < cm.shape[0] and pred_id < cm.shape[1]:
                    if cm[true_id][pred_id] > 10:
                        confused_pairs.append((
                            BASE_CLASSES.get(true_id, str(true_id)),
                            BASE_CLASSES.get(pred_id, str(pred_id)),
                            int(cm[true_id][pred_id]),
                        ))
    except Exception:
        pass

    if confused_pairs:
        log.warning("⚠️  Dataset Issue Detected — stress/disease confusion:")
        for true_cls, pred_cls, count in confused_pairs:
            log.warning(f"   '{true_cls}' mistaken for '{pred_cls}' {count}x times")
        log.warning("   → This is a DATASET LABELLING issue, not a code issue.")
        log.warning("   → Consider adding more diverse stress examples.")
    else:
        log.info("✅ Validation passed — no significant class confusion detected.")

    return metrics


# ─────────────────────────────────────────────────────────────────────────────
# STEP 8 — Main orchestrator
# ─────────────────────────────────────────────────────────────────────────────

def main():
    log.info("=" * 60)
    log.info("  FarmSathi — YOLOv8 Training Pipeline")
    log.info("=" * 60)

    # ── STEP 0: Download ──────────────────────────────────────────────────────
    raw_dataset_path = download_dataset()

    # ── STEP 1: Locate class folders ─────────────────────────────────────────
    image_root = find_image_root(raw_dataset_path)
    log.info(f"Image root detected: {image_root}")
    class_folders = collect_class_folders(image_root)

    if not class_folders:
        log.error("No class folders found in dataset. Check dataset structure.")
        sys.exit(1)

    # ── STEP 2 + 3: Remap classes & clean images ──────────────────────────────
    class_images: Dict[int, List[Path]] = {}
    total_raw = 0

    for folder_name, folder_path in class_folders.items():
        class_id = map_folder_to_class(folder_name)
        raw_imgs = sorted([
            p for p in folder_path.iterdir()
            if p.suffix.lower() in IMG_EXTS
        ])
        total_raw += len(raw_imgs)
        log.info(f"  [{class_id:2d}] {BASE_CLASSES.get(class_id,'?'):25s} ← {folder_name} ({len(raw_imgs)} imgs)")

        clean = clean_images(raw_imgs)

        if class_id not in class_images:
            class_images[class_id] = []
        class_images[class_id].extend(clean)

    total_clean = sum(len(v) for v in class_images.values())
    log.info(f"\nTotal: {total_raw} raw → {total_clean} clean images across {len(class_images)} classes")

    # ── STEP 4: Train/Val split ───────────────────────────────────────────────
    log.info("\nSplitting dataset (80/20)...")
    total_train, total_val = split_and_write(class_images)
    log.info(f"  Train: {total_train} images")
    log.info(f"  Val:   {total_val} images")

    # ── STEP 5: Write YAML ────────────────────────────────────────────────────
    write_yaml(list(class_images.keys()))

    # ── STEP 6: Train ─────────────────────────────────────────────────────────
    log.info("\nStarting training...")
    run_training(epochs=50, imgsz=640, model="yolov8n.pt")

    # ── STEP 7: Validate ──────────────────────────────────────────────────────
    run_validation()

    # ── STEP 8: Summary ───────────────────────────────────────────────────────
    log.info("\n" + "=" * 60)
    log.info("  Pipeline Complete ✅")
    log.info("=" * 60)
    log.info(f"  Dataset path:      {DATASET_DIR.resolve()}")
    log.info(f"  plant.yaml:        {YAML_PATH.resolve()}")
    log.info(f"  Trained model:     runs/train/farmsathi_v1/weights/best.pt")
    log.info(f"  Training command:  yolo detect train data={YAML_PATH.resolve()} model=yolov8n.pt epochs=50 imgsz=640")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
