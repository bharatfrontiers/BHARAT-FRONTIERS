import json
import os
import re
from datetime import datetime, timezone


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "output",
    "articles"
)


def create_slug(text):

    text = text.lower()

    text = re.sub(
        r"[^a-z0-9\s-]",
        "",
        text
    )

    text = re.sub(
        r"\s+",
        "-",
        text.strip()
    )

    return text[:100]


def publish_articles(articles):

    if not articles:

        print(
            "No articles to publish."
        )

        return

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    published_count = 0

    for article in articles:

        title = article.get(
            "title",
            "Untitled Article"
        )

        slug = article.get(
            "slug"
        )

        if not slug:

            slug = create_slug(
                title
            )

        filename = (
            f"{slug}.json"
        )

        output_path = os.path.join(
            OUTPUT_DIR,
            filename
        )

        publication_record = {

            "publication_status":
                "published",

            "published_at":
                datetime.now(
                    timezone.utc
                ).isoformat(),

            "title":
                title,

            "slug":
                slug,

            "category":
                article.get(
                    "category",
                    "General"
                ),

            "summary":
                article.get(
                    "summary",
                    ""
                ),

            "article":
                article.get(
                    "article",
                    ""
                ),

            "key_facts":
                article.get(
                    "key_facts",
                    []
                ),

            "verification_status":
                article.get(
                    "verification_status",
                    "needs_review"
                ),

            "confidence":
                article.get(
                    "confidence",
                    0
                ),

            "source":
                {
                    "name":
                        article.get(
                            "source_name",
                            ""
                        ),

                    "url":
                        article.get(
                            "source_url",
                            ""
                        ),

                    "original_source_url":
                        article.get(
                            "original_source_url",
                            ""
                        )
                },

            "automation":
                article.get(
                    "automation",
                    {}
                ),

            "admin_control":
                {
                    "editable":
                        True,

                    "admin_approval_required":
                        False
                }
        }

        with open(
            output_path,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                publication_record,
                file,
                indent=2,
                ensure_ascii=False
            )

        print(
            f"Published: {filename}"
        )

        published_count += 1

    print(
        f"\nPublished articles: "
        f"{published_count}"
    )