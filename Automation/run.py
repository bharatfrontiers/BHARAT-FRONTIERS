from monitor import monitor_sources
from processor import process_items
from publisher import publish_articles


def main():

    print("======================================")
    print(" BHARAT FRONTIERS AI AUTOMATION V1")
    print("======================================")

    try:

        print("\n[1] Monitoring authentic sources...")

        items = monitor_sources()

        if not items:

            print(
                "\nNo new stories found."
            )

            return

        print(
            f"\nNew stories found: "
            f"{len(items)}"
        )

        print(
            "\n[2] AI verification "
            "and article generation..."
        )

        articles = process_items(
            items
        )

        if not articles:

            print(
                "\nNo articles were generated."
            )

            return

        print(
            f"\nArticles generated: "
            f"{len(articles)}"
        )

        print(
            "\n[3] Automatic publishing..."
        )

        publish_articles(
            articles
        )

        print(
            "\n======================================"
        )

        print(
            " BHARAT FRONTIERS AUTOMATION COMPLETE"
        )

        print(
            "======================================"
        )

    except Exception as error:

        print(
            "\nAUTOMATION ERROR:"
        )

        print(error)


if __name__ == "__main__":

    main()