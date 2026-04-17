from ml.risk.risk_interpreter import (
    compute_risk_score,
    categorize_risk,
    generate_explanation
)

def run_demo():
    logits = [-2.0, 0.3, 2.5]

    for logit in logits:
        score = compute_risk_score(logit)
        level = categorize_risk(score)
        explanation = generate_explanation(level, score)

        print(f"Logit: {logit}")
        print(f"Risk Score: {score}")
        print(f"Risk Level: {level}")
        print(f"Explanation: {explanation}")
        print("-" * 40)

if __name__ == "__main__":
    run_demo()
