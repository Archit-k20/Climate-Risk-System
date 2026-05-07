import os
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate

load_dotenv()

# Models to try in order, from most to least quota-friendly
GEMINI_MODELS = [
    "gemini-1.5-flash-8b",   # highest free quota (1500 req/day)
    "gemini-1.5-flash",       # medium free quota (1500 req/day)
    "gemini-2.0-flash-lite",  # newer lite variant
    "gemini-2.0-flash",       # may have 0 free quota
]

PROMPT_TEMPLATE = PromptTemplate(
    input_variables=["land_class", "risk_level", "risk_type", "description"],
    template="""
You are an expert environmental consultant and urban planner.
Based on the following satellite image analysis, generate a concise, professional mitigation report.

Analysis Data:
- Land Class Detected: {land_class}
- Computed Risk Level: {risk_level}
- Primary Risk Type: {risk_type}
- AI Context: {description}

Format the report into exactly three distinct sections:
1. Executive Summary: Briefly explain the detected environment and its associated risk.
2. Potential Impacts: What are the real-world environmental or urban consequences if left unmanaged?
3. Actionable Mitigation Strategies: Provide 3 bullet points of specific, actionable advice for city planners or environmental agencies.
"""
)


def _template_fallback(risk_info: dict) -> str:
    """Rule-based report when the Gemini API is unavailable."""
    land  = risk_info.get("land_class", "Unknown")
    level = risk_info.get("risk_level", "Unknown")
    rtype = risk_info.get("risk_type", "Unknown")
    desc  = risk_info.get("description", "")

    return (
        f"## Executive Summary\n"
        f"Satellite analysis identified a **{land}** land classification with a **{level}** "
        f"climate risk level. The primary risk type is **{rtype}**. {desc}\n\n"
        f"## Potential Impacts\n"
        f"Without intervention, {rtype.lower()} risks in {land.lower()} environments can lead "
        f"to ecosystem degradation, increased vulnerability to extreme weather events, and "
        f"long-term economic impacts on surrounding communities.\n\n"
        f"## Actionable Mitigation Strategies\n"
        f"• Conduct detailed environmental impact assessments to quantify {rtype.lower()} exposure.\n"
        f"• Engage local government and urban planners to integrate climate adaptation measures into land-use policy.\n"
        f"• Implement real-time monitoring systems to track ongoing changes in the {land.lower()} zone.\n\n"
        f"*(AI-generated narrative unavailable — Gemini API quota exceeded. This report was generated from structured templates.)*"
    )


def generate_mitigation_report(risk_info: dict) -> str:
    """
    Generates a dynamic mitigation report using Gemini.
    Tries multiple models in order and falls back to a template if all fail.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        return _template_fallback(risk_info)

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
    except ImportError:
        return _template_fallback(risk_info)

    prompt_input = {
        "land_class":  risk_info.get("land_class", "Unknown"),
        "risk_level":  risk_info.get("risk_level", "Unknown"),
        "risk_type":   risk_info.get("risk_type", "Unknown"),
        "description": risk_info.get("description", "Unknown"),
    }

    last_error = None
    for model_name in GEMINI_MODELS:
        try:
            llm = ChatGoogleGenerativeAI(
                model=model_name,
                temperature=0.7,
                google_api_key=api_key
            )
            chain = PROMPT_TEMPLATE | llm
            response = chain.invoke(prompt_input)
            print(f"[LLM] Generated report using {model_name}")
            return response.content
        except Exception as e:
            last_error = e
            print(f"[LLM] {model_name} failed: {e}")
            continue

    # All models failed — return a useful structured fallback
    print(f"[LLM] All models failed, using template fallback. Last error: {last_error}")
    return _template_fallback(risk_info)