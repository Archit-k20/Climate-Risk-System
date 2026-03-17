import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate


load_dotenv()

def generate_mitigation_report(risk_info: dict) -> str:
    """
    Takes the static risk dictionary and generates a dynamic mitigation report using an LLM.
    """
    
    try:
        llm = ChatOpenAI(temperature=0.7, model="gpt-3.5-turbo")
    except Exception as e:
        return f"LLM Initialization Error. Make sure OPENAI_API_KEY is set in your .env file. Error: {str(e)}"

    
    prompt = PromptTemplate(
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
    
   
    chain = prompt | llm
    
    try:
        
        response = chain.invoke({
            "land_class": risk_info.get("land_class", "Unknown"),
            "risk_level": risk_info.get("risk_level", "Unknown"),
            "risk_type": risk_info.get("risk_type", "Unknown"),
            "description": risk_info.get("description", "Unknown")
        })
        return response.content
    except Exception as e:
        return f"Notice: Could not generate AI report due to an API error: {str(e)}"