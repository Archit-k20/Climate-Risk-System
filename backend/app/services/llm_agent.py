"""Optional narrative generation; provenance is saved alongside the exact text."""

import os
import logging

log = logging.getLogger(__name__)


def template_report(risk):
    return (
        f"## Executive Summary\nThe image was classified as {risk['land_class']}. "
        f"The existing rule mapping assigns {risk['risk_level']} risk for {risk['risk_type']}. "
        "This heuristic index is not a probability or a site-specific risk assessment.\n\n"
        f"## Potential Impacts\n{risk['description']}\n\n"
        "## Actionable Mitigation Strategies\n"
        "- Validate the image classification against local observations.\n"
        "- Assess exposure using relevant environmental and historical data.\n"
        "- Review adaptation options with qualified local specialists."
    )


def generate_mitigation_report(risk):
    key, model = os.getenv("GEMINI_API_KEY"), os.getenv("GEMINI_MODEL")
    reason = "Gemini credentials or model are not configured."
    if key and model:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI

            llm = ChatGoogleGenerativeAI(
                model=model,
                google_api_key=key,
                temperature=0,
                timeout=45,
                max_retries=0,
            )
            response = llm.invoke(
                "Write a brief illustrative report with exactly these markdown headings: Executive Summary, Potential Impacts, Actionable Mitigation Strategies. "
                "This is an unvalidated land-cover heuristic, not measured climate risk. Do not invent locations, measurements, confidence or scientific validation. "
                f"Use only these inputs: {risk}"
            )
            if not isinstance(response.content, str) or not response.content.strip():
                raise ValueError("Empty narrative")
            return {"text": response.content, "source": "gemini", "reason": None}
        except Exception:
            log.exception("Optional narrative service unavailable")
            reason = (
                "Gemini could not generate a narrative; a structured template was used."
            )
    return {"text": template_report(risk), "source": "template", "reason": reason}
