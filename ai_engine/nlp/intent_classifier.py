"""
intent_classifier.py — Keyword-based emergency intent + severity classification.
Works 100% offline. Used as fallback when DistilBERT model is not loaded.
"""
from typing import Dict, List

SEVERITY_KEYWORDS: Dict[str, List[str]] = {
    "CRITICAL": [
        "unconscious", "not breathing", "no pulse", "bleeding heavily",
        "dying", "collapsed", "critical", "severe head", "trapped under",
        "multiple victims", "fire", "explosion", "drowning", "heart attack",
        "stroke", "seizure", "anaphylaxis", "unresponsive", "coma"
    ],
    "MODERATE": [
        "injured", "hurt", "bleeding", "broken", "fracture", "pain",
        "dizzy", "breathless", "confused", "semi-conscious", "limping", 
        "road rash", "bruised", "cut", "moderate", "ambulance needed"
    ],
    "MINOR": [
        "minor", "scratch", "small", "ok", "stable", "awake", "safe",
        "dent", "breakdown", "stalled", "tyre", "puncture", "flat",
        "engine", "towing", "no injuries", "everyone ok"
    ]
}

INTENT_KEYWORDS: Dict[str, List[str]] = {
    "accident":   ["accident", "crash", "collision", "hit", "struck", "fell", "rolled", "overturned", "smash"],
    "breakdown":  ["breakdown", "stalled", "engine", "flat tyre", "puncture", "towing", "stranded", "battery", "fuel"],
    "medical":    ["medical", "seizure", "heart", "stroke", "breathing", "unconscious", "diabetic", "allergy", "chest pain"],
    "harassment": ["harassment", "fight", "violence", "attack", "rob", "theft", "threat", "eve teasing"],
}

FIRST_AID_STEPS: Dict[str, List[str]] = {
    "CRITICAL": [
        "Apply firm pressure to any wounds with clean cloth — do not remove",
        "Check breathing — if absent, start CPR: 30 chest compressions + 2 rescue breaths",
        "Do NOT move the person unless in immediate danger (fire, traffic)",
        "Keep airway open — tilt head back gently",
        "Talk to them continuously to maintain consciousness",
    ],
    "MODERATE": [
        "Keep the person still and calm — do not move unnecessarily",
        "Do not give food, water, or medication",
        "Keep them warm if showing signs of shock",
        "Monitor breathing and pulse every 2 minutes",
        "Document injuries for medical team",
    ],
    "MINOR": [
        "Move person to safety away from traffic",
        "Collect vehicle numbers, witness contacts, insurance details",
        "Take photos of the scene for insurance/police report",
        "Call police if needed (100)",
        "Seek medical checkup even for minor impacts",
    ]
}

PRIORITY_SERVICE: Dict[str, str] = {
    "accident":   "ambulance",
    "breakdown":  "towing",
    "medical":    "ambulance",
    "harassment": "police",
}


def keyword_classify(text: str) -> dict:
    """Rule-based classification — always works offline."""
    lower = text.lower()

    # Severity
    severity = "MODERATE"
    for sev in ["CRITICAL", "MODERATE", "MINOR"]:
        if any(k in lower for k in SEVERITY_KEYWORDS[sev]):
            severity = sev
            break

    # Intent
    intent = "accident"
    for intent_key, keywords in INTENT_KEYWORDS.items():
        if any(k in lower for k in keywords):
            intent = intent_key
            break

    return {
        "severity":        severity,
        "intent":          intent,
        "confidence":      0.78,
        "method":          "keyword",
        "first_aid":       FIRST_AID_STEPS[severity],
        "priority_service": PRIORITY_SERVICE.get(intent, "hospital"),
        "reasoning":       f"Matched {severity} severity indicators in input"
    }


if __name__ == "__main__":
    # Quick self-test
    test_inputs = [
        "person unconscious bleeding from head",
        "bike accident minor scratch",
        "flat tyre on NH44",
        "chest pain not breathing",
        "robbery at petrol pump",
    ]
    print("RoadSoS Intent Classifier — Self Test\n" + "="*40)
    for t in test_inputs:
        r = keyword_classify(t)
        print(f"Input:    {t}")
        print(f"Severity: {r['severity']} | Intent: {r['intent']} | Priority: {r['priority_service']}")
        print()
