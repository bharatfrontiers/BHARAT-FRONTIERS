import json
import os
from datetime import datetime, timezone

from openai import OpenAI


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CONFIG_FILE = os.path.join(
    BASE_DIR,
    "config.json"
)

PROCESSED_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed_items.json"
)


def load_json(path, default):

    if not os.path.exists(path):
        return default

    try:
        with open(
            path,
            "r",
            encoding="utf-8"
        ) as file:
            return json.load(file)

    except Exception:
        return default


def save_json(path, data):

    os.makedirs(
        os.path.dirname(path),
        exist_ok=True
    )

    with open(
        path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            indent=2,
            ensure_ascii=False
        )


def get_client():

    api_key = os.getenv(
        "OPENAI_API_KEY"
    )

    if not api_key:

        raise RuntimeError(
            "OPENAI_API_KEY is not configured."
        )

    return OpenAI(
        api_key=api_key
    )


def process_items(items):

    if not items:
        return []

    client = get_client()

    config = load_json(
        CONFIG_FILE,
        {}
    )

    model = config.get(
        "ai_model",
        "gpt-5.6-luna"
    )

    processed = load_json(
        PROCESSED_FILE,
        []
    )

    processed_set = set(processed)

    articles = []

    for item in items:

        if item["id"] in processed_set:
            continue

        print(
            f"\nAI processing: "
            f"{item['title']}"
        )

        prompt = f"""
You are the editorial intelligence system
for BHARAT FRONTIERS.

Your job is to create an ORIGINAL news
article using the supplied source information.

IMPORTANT RULES:

1. Do not copy the source article.
2. Do not reproduce long passages.
3. Do not invent facts.
4. Do not present speculation as fact.
5. Clearly distinguish verified facts from
   uncertainty.
6. Preserve important names, dates,
   numbers and official statements accurately.
7. Use neutral journalistic language.
8. Do not add political persuasion.
9. Do not create unsupported allegations.
10. The source is evidence, not text to rewrite.

SOURCE:

Name:
{item['source']}

Official source URL:
{item['source_url']}

Original article URL:
{item['link']}

Headline:
{item['title']}

Summary:
{item['summary']}

Return JSON with exactly these fields:

title
slug
category
summary
article
key_facts
verification_status
confidence
source_name
source_url
original_source_url

verification_status must be one of:

verified
needs_review

confidence must be a number from 0 to 1.

The article should be original BHARAT
FRONTIERS editorial content.

If the available information is insufficient,
use "needs_review" rather than inventing details.
"""

        try:

            response = client.responses.create(
                model=model,
                input=prompt
            )

            text = response.output_text.strip()

            try:

                article = json.loads(text)

            except json.JSONDecodeError:

                print(
                    "AI returned invalid JSON."
                )

                continue

            article["automation"] = {
                "generated_by":
                    "BHARAT FRONTIERS AI",
                "version":
                    config.get(
                        "automation_version",
                        "1.0"
                    ),
                "generated_at":
                    datetime.now(
                        timezone.utc
                    ).isoformat()
            }

            article["original_item_id"] = (
                item["id"]
            )

            articles.append(article)

            processed_set.add(
                item["id"]
            )

            print(
                "AI article generated."
            )

        except Exception as error:

            print(
                f"AI processing error: {error}"
            )

    save_json(
        PROCESSED_FILE,
        list(processed_set)
    )

    return articles