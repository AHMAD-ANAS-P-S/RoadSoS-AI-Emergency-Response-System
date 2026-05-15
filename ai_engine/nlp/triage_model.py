"""
triage_model.py — DistilBERT fine-tuning for emergency severity classification.

This script fine-tunes a DistilBERT model on emergency text classification.
The trained model can be exported to ONNX for on-device inference via @xenova/transformers.

Usage:
  python triage_model.py --train   # train and save model
  python triage_model.py --export  # export to ONNX
  python triage_model.py --test    # run test predictions
"""
import argparse, json, os

# ─── TRAINING DATA ───────────────────────────────────────────
TRAINING_DATA = [
    # CRITICAL
    ("person is unconscious and not breathing", "CRITICAL"),
    ("bleeding heavily from head injury", "CRITICAL"),
    ("multiple victims trapped in car", "CRITICAL"),
    ("person collapsed, no pulse", "CRITICAL"),
    ("serious accident, person is dying", "CRITICAL"),
    ("chest pain and loss of consciousness", "CRITICAL"),
    ("severe head trauma, unresponsive", "CRITICAL"),
    ("child injured, not responding", "CRITICAL"),
    ("bus overturned, many injured critically", "CRITICAL"),
    ("lorry accident, person under vehicle", "CRITICAL"),
    # MODERATE
    ("injured in bike accident", "MODERATE"),
    ("bleeding from arm, conscious", "MODERATE"),
    ("broken leg, need ambulance", "MODERATE"),
    ("car collision, two people hurt", "MODERATE"),
    ("hit from behind, neck pain", "MODERATE"),
    ("fell from bike, road rash", "MODERATE"),
    ("moderate injuries, need hospital", "MODERATE"),
    ("pedestrian hit by car, awake", "MODERATE"),
    ("dizzy and confused after accident", "MODERATE"),
    ("shoulder injury, painful", "MODERATE"),
    # MINOR
    ("small scratch, no serious injury", "MINOR"),
    ("minor fender bender, everyone ok", "MINOR"),
    ("vehicle breakdown on highway", "MINOR"),
    ("flat tyre need towing", "MINOR"),
    ("engine stalled, need assistance", "MINOR"),
    ("minor collision, no injuries", "MINOR"),
    ("car broke down, everyone safe", "MINOR"),
    ("small dent, no one hurt", "MINOR"),
    ("puncture near Tambaram", "MINOR"),
    ("need towing service", "MINOR"),
]

LABEL_MAP = {"CRITICAL": 0, "MODERATE": 1, "MINOR": 2}
LABEL_NAMES = ["CRITICAL", "MODERATE", "MINOR"]


def train_model():
    """Fine-tune DistilBERT on emergency classification data."""
    try:
        from transformers import (DistilBertTokenizerFast, DistilBertForSequenceClassification,
                                   TrainingArguments, Trainer)
        from datasets import Dataset
        import torch

        print("Loading tokenizer...")
        tokenizer = DistilBertTokenizerFast.from_pretrained("distilbert-base-uncased")

        data = [{"text": t, "label": LABEL_MAP[l]} for t, l in TRAINING_DATA]
        dataset = Dataset.from_list(data)

        def tokenize(batch):
            return tokenizer(batch["text"], truncation=True, padding=True, max_length=64)

        dataset = dataset.map(tokenize, batched=True)
        split = dataset.train_test_split(test_size=0.15, seed=42)

        print("Loading model...")
        model = DistilBertForSequenceClassification.from_pretrained(
            "distilbert-base-uncased",
            num_labels=3,
            id2label={i: l for i, l in enumerate(LABEL_NAMES)},
            label2id=LABEL_MAP
        )

        args = TrainingArguments(
            output_dir="./model_output",
            num_train_epochs=10,
            per_device_train_batch_size=8,
            learning_rate=2e-5,
            evaluation_strategy="epoch",
            save_strategy="best",
            load_best_model_at_end=True,
            logging_steps=5,
        )

        trainer = Trainer(
            model=model,
            args=args,
            train_dataset=split["train"],
            eval_dataset=split["test"],
        )
        print("Training...")
        trainer.train()

        model.save_pretrained("./model_output/roadsos-triage")
        tokenizer.save_pretrained("./model_output/roadsos-triage")
        print("✅ Model saved to ./model_output/roadsos-triage")

    except ImportError:
        print("transformers/datasets not installed. Install with: pip install transformers datasets torch")


def export_onnx():
    """Export trained model to ONNX for browser inference via @xenova/transformers."""
    try:
        from transformers import DistilBertForSequenceClassification, DistilBertTokenizerFast
        import torch

        model_path = "./model_output/roadsos-triage"
        if not os.path.exists(model_path):
            print("Train model first with --train")
            return

        model = DistilBertForSequenceClassification.from_pretrained(model_path)
        tokenizer = DistilBertTokenizerFast.from_pretrained(model_path)
        model.eval()

        dummy = tokenizer("test accident", return_tensors="pt", padding="max_length", max_length=64, truncation=True)
        os.makedirs("./model_output/onnx", exist_ok=True)

        torch.onnx.export(
            model, (dummy["input_ids"], dummy["attention_mask"]),
            "./model_output/onnx/model.onnx",
            input_names=["input_ids", "attention_mask"],
            output_names=["logits"],
            dynamic_axes={"input_ids": {0: "batch"}, "attention_mask": {0: "batch"}},
            opset_version=11
        )
        tokenizer.save_pretrained("./model_output/onnx")
        print("✅ ONNX model exported to ./model_output/onnx/")
        print("   Copy to frontend/public/models/roadsos-triage/")

    except ImportError as e:
        print(f"ONNX export requires: pip install torch transformers optimum\nError: {e}")


def test_predictions():
    """Test predictions using keyword fallback (no model needed)."""
    test_cases = [
        "person is unconscious bleeding heavily",
        "bike accident near tambaram, person injured",
        "flat tyre on highway, no injuries",
        "head injury, not breathing, critical",
        "minor collision, everyone ok",
    ]

    from intent_classifier import keyword_classify
    print("\n── Test Predictions ─────────────────────")
    for text in test_cases:
        result = keyword_classify(text)
        print(f"Input:    {text}")
        print(f"Result:   severity={result['severity']} | intent={result['intent']} | conf={result['confidence']}")
        print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RoadSoS Triage Model")
    parser.add_argument("--train",  action="store_true", help="Fine-tune DistilBERT")
    parser.add_argument("--export", action="store_true", help="Export to ONNX")
    parser.add_argument("--test",   action="store_true", help="Test predictions")
    args = parser.parse_args()

    if args.train:  train_model()
    elif args.export: export_onnx()
    elif args.test:   test_predictions()
    else: parser.print_help()
