import math

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

def normalize_risk_score(logit, min_logit=3.34, max_logit=3.40):
    """
    Normalize model logit into a 0–100 relative risk score
    using observed demo bounds.
    """
    clipped = max(min(logit, max_logit), min_logit)
    normalized = (clipped - min_logit) / (max_logit - min_logit)
    return round(normalized * 100, 2)

def categorize_risk(risk_score):
    if risk_score < 35:
        return "Low Risk"
    elif risk_score < 80:
        return "Medium Risk"
    else:
        return "High Risk"

def generate_explanation(risk_level, risk_score):
    if risk_level == "Low Risk":
        return f"Land conditions appear stable (relative risk {risk_score})."
    elif risk_level == "Medium Risk":
        return f"Moderate environmental stress detected (relative risk {risk_score})."
    else:
        return f"High environmental risk detected (relative risk {risk_score})."
