import re
import string


def clean_text(text: str) -> str:
    """
    Clean and normalize resume or job description text.
    """

    if not text:
        return ""

    # Convert to lowercase
    text = text.lower()

    # Remove email addresses
    text = re.sub(
        r"\b[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}\b",
        " ",
        text
    )

    # Remove URLs
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)

    # Replace line breaks and tabs
    text = re.sub(r"[\n\r\t]+", " ", text)

    # Remove punctuation
    text = text.translate(
        str.maketrans("", "", string.punctuation)
    )

    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text