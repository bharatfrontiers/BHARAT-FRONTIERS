import json
import os
import hashlib
from datetime import datetime, timezone

import feedparser


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SOURCES_FILE = os.path.join(BASE_DIR, "sources.json")
DATA_DIR = os.path.join(BASE_DIR, "data")
SEEN_FILE = os.path.join(DATA_DIR, "seen_items.json")


def load_json(path, default):
    if not os.path.exists(path):
        return default

    try:
        with open(path, "r", encoding="utf-8") as file:
            return json.load(file)
    except Exception:
        return default


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)

    with open(path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)


def generate_id(text):
    return hashlib.sha256(
        text.encode("utf-8")
    ).hexdigest()


def clean_text(text):
    if not text:
        return ""

    return " ".join(text.split())


def monitor_sources():

    print("\n--------------------------------------")
    print("BHARAT FRONTIERS SOURCE MONITOR")
    print("--------------------------------------")

    sources_data = load_json(
        SOURCES_FILE,
        {"sources": []}
    )

    seen_items = load_json(
        SEEN_FILE,
        []
    )

    seen_set = set(seen_items)

    new_items = []

    for source in sources_data.get("sources", []):

        if not source.get("enabled", False):
            continue

        source_name = source.get("name", "Unknown Source")
        feed_url = source.get("feed_url", "")

        print(f"\nChecking: {source_name}")

        if not feed_url:
            print("  No RSS feed configured.")
            continue

        try:

            feed = feedparser.parse(feed_url)

            if feed.bozo and not feed.entries:
                print("  Feed could not be read.")
                continue

            count = 0

            for entry in feed.entries[:5]:

                title = clean_text(
                    entry.get("title", "")
                )

                link = entry.get("link", "")

                summary = clean_text(
                    entry.get(
                        "summary",
                        entry.get("description", "")
                    )
                )

                if not title or not link:
                    continue

                item_id = generate_id(
                    source_name + "|" + link
                )

                if item_id in seen_set:
                    continue

                item = {
                    "id": item_id,
                    "source": source_name,
                    "source_type": source.get(
                        "type",
                        "unknown"
                    ),
                    "source_url": source.get(
                        "url",
                        ""
                    ),
                    "title": title,
                    "link": link,
                    "summary": summary,
                    "detected_at": datetime.now(
                        timezone.utc
                    ).isoformat()
                }

                new_items.append(item)

                seen_set.add(item_id)
                count += 1

            print(
                f"  New items found: {count}"
            )

        except Exception as error:

            print(
                f"  ERROR: {error}"
            )

    save_json(
        SEEN_FILE,
        list(seen_set)
    )

    print(
        f"\nTotal new items: {len(new_items)}"
    )

    return new_items


if __name__ == "__main__":

    items = monitor_sources()

    print("\n--------------------------------------")
    print("MONITOR COMPLETE")
    print("--------------------------------------")

    for item in items:
        print(
            f"- {item['source']}: "
            f"{item['title']}"
        )