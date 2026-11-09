
import re


def clean_text(text: str) -> str:
    """
    Clean and normalize resume or job description text
    while preserving important technical keywords.
    """

    if not text:
        return ""

    text = text.lower()

    # Remove email addresses
    text = re.sub(
        r"\b[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}\b",
        " ",
        text
    )

    # Remove URLs
    text = re.sub(
        r"https?://\S+|www\.\S+",
        " ",
        text
    )

    # Normalize line breaks and tabs
    text = re.sub(r"[\n\r\t]+", " ", text)

    # Preserve technical terms before removing punctuation
    text = text.replace("c++", "cplusplus")
    text = text.replace("c#", "csharp")
    text = text.replace(".net", "dotnet")
    text = text.replace("node.js", "nodejs")

    # Remove remaining punctuation
    text = re.sub(r"[^\w\s]", " ", text)

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text
