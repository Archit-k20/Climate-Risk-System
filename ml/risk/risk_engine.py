from ml.risk.risk_mapper import RISK_MAPPING


def get_risk_assessment(predicted_class):

    if predicted_class not in RISK_MAPPING:

        return {
            "risk_level": "Unknown",
            "risk_type": "Unknown",
            "description": "No risk mapping available."
        }

    risk_info = RISK_MAPPING[predicted_class]

    return {
        "land_class": predicted_class,
        "risk_level": risk_info["risk_level"],
        "risk_type": risk_info["risk_type"],
        "description": risk_info["description"]
    }