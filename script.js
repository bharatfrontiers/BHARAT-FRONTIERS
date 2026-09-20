/* =====================================================
   BHARAT FRONTIERS
   MAIN WEBSITE JAVASCRIPT
===================================================== */


/* =====================================================
   MOBILE MENU
===================================================== */

const menuButton = document.getElementById("menuButton");
const navigation = document.getElementById("navigation");

if (menuButton) {

    menuButton.addEventListener("click", function () {

        navigation.classList.toggle("open");

    });

}


/* =====================================================
   SEARCH
===================================================== */

const searchButton =
    document.getElementById("searchButton");

const searchPanel =
    document.getElementById("searchPanel");

const closeSearch =
    document.getElementById("closeSearch");

const searchInput =
    document.getElementById("searchInput");


if (searchButton) {

    searchButton.addEventListener("click", function () {

        if (searchPanel) {

            searchPanel.classList.toggle("show");

            if (
                searchPanel.classList.contains("show") &&
                searchInput
            ) {

                searchInput.focus();

            }

        }

    });

}


if (closeSearch) {

    closeSearch.addEventListener("click", function () {

        if (searchPanel) {

            searchPanel.classList.remove("show");

        }

        if (searchInput) {

            searchInput.value = "";

        }

    });

}


/* =====================================================
   SEARCH
===================================================== */

if (searchInput) {

    searchInput.addEventListener(
        "keypress",
        function (event) {

            if (event.key !== "Enter") {

                return;

            }

            const searchTerm =
                searchInput.value.trim();

            if (searchTerm === "") {

                alert(
                    "Please enter a search term."
                );

                return;

            }

            alert(
                "Search functionality will be connected to the Bharat Frontiers article database."
            );

        }
    );

}


/* =====================================================
   NEWSLETTER
===================================================== */

const newsletterForm =
    document.getElementById("newsletterForm");

const emailInput =
    document.getElementById("emailInput");

const subscribeMessage =
    document.getElementById("subscribeMessage");


if (newsletterForm) {

    newsletterForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";

            if (email === "") {

                if (subscribeMessage) {

                    subscribeMessage.textContent =
                        "Please enter your email address.";

                }

                return;

            }

            if (subscribeMessage) {

                subscribeMessage.textContent =
                    "Thank you for subscribing to Bharat Frontiers.";

            }

            if (emailInput) {

                emailInput.value = "";

            }

        }
    );

}


/* =====================================================
   CLOSE MOBILE MENU AFTER CLICK
===================================================== */

const navigationLinks =
    document.querySelectorAll(
        ".navigation a"
    );


navigationLinks.forEach(function (link) {

    link.addEventListener(
        "click",
        function () {

            if (
                window.innerWidth <= 650 &&
                navigation
            ) {

                navigation.classList.remove(
                    "open"
                );

            }

        }
    );

});


/* =====================================================
   CURRENT YEAR
===================================================== */

const yearElements =
    document.querySelectorAll(
        ".current-year"
    );

const currentYear =
    new Date().getFullYear();


yearElements.forEach(function (element) {

    element.textContent =
        currentYear;

});


/* =====================================================
   BHARAT FRONTIERS
   HOMEPAGE ARTICLE DATABASE
===================================================== */

const HOMEPAGE_DATA_PATH =
    "./Data/articles.json";


/* =====================================================
   LOAD HOMEPAGE ARTICLES
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadHomepageArticles();

    }
);


/* =====================================================
   LOAD ARTICLES.JSON
===================================================== */

async function loadHomepageArticles() {

    try {

        const response =
            await fetch(
                HOMEPAGE_DATA_PATH,
                {
                    cache: "no-cache"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load Data/articles.json"
            );

        }


        const data =
            await response.json();


        let articles = [];


        /*
         * Supported JSON structures:
         *
         * 1. [ ... ]
         *
         * 2. {
         *      "articles": [ ... ]
         *    }
         *
         * 3. {
         *      "items": [ ... ]
         *    }
         */


        if (Array.isArray(data)) {

            articles = data;

        }

        else if (
            data &&
            Array.isArray(data.articles)
        ) {

            articles = data.articles;

        }

        else if (
            data &&
            Array.isArray(data.items)
        ) {

            articles = data.items;

        }

        else {

            throw new Error(
                "Invalid articles.json structure."
            );

        }


        /*
         * Keep only usable articles.
         */

        articles =
            articles.filter(
                function (article) {

                    return (
                        article &&
                        getArticleId(article) &&
                        getArticleTitle(article)
                    );

                }
            );


        if (!articles.length) {

            return;

        }


        articles =
            sortHomepageArticles(
                articles
            );


        updateHomepage(
            articles
        );


    }

    catch (error) {

        console.error(
            "BHARAT FRONTIERS article database:",
            error
        );

    }

}


/* =====================================================
   UPDATE HOMEPAGE
===================================================== */

function updateHomepage(articles) {

    updateFeaturedStory(
        articles
    );


    updateTopStories(
        articles
    );


    updateLatestNews(
        articles
    );


    updateCategoryCards(
        "science",
        articles
    );


    updateCategoryCards(
        "technology",
        articles
    );


    updateCategoryCards(
        "policy",
        articles
    );


    updateCategoryCards(
        "business",
        articles
    );


    updateAnalysisCards(
        articles
    );


    updateExplainedCards(
        articles
    );

}


/* =====================================================
   FEATURED STORY
===================================================== */

function updateFeaturedStory(
    articles
) {

    const featured =
        document.querySelector(
            ".featured-story"
        );


    if (!featured) {

        return;

    }


    const article =
        articles.find(
            function (item) {

                return item.featured === true;

            }
        ) || articles[0];


    if (!article) {

        return;

    }


    const category =
        featured.querySelector(
            ".category"
        );


    const title =
        featured.querySelector(
            "h2"
        );


    const summary =
        featured.querySelector(
            ".story-content p"
        );


    const meta =
        featured.querySelector(
            ".story-meta"
        );


    const link =
        featured.querySelector(
            ".read-more"
        );


    if (category) {

        category.textContent =
            formatLabel(
                getArticleSection(article)
            );

    }


    if (title) {

        title.textContent =
            getArticleTitle(article);

    }


    if (summary) {

        summary.textContent =
            getArticleSummary(article);

    }


    if (meta) {

        meta.textContent =
            getArticleAuthor(article) +
            (
                getArticleDate(article)
                    ? " · " +
                      formatHomepageDate(
                          getArticleDate(article)
                      )
                    : ""
            );

    }


    if (link) {

        link.href =
            getArticleLink(article);

    }

}


/* =====================================================
   TOP STORIES
===================================================== */

function updateTopStories(
    articles
) {

    const stories =
        document.querySelectorAll(
            ".top-story"
        );


    if (!stories.length) {

        return;

    }


    const selected = [];
    const used = new Set();


    /*
     * Prefer different sections.
     */

    for (
        const article of articles
    ) {

        const section =
            getArticleSection(
                article
            );


        const id =
            getArticleId(
                article
            );


        if (used.has(id)) {

            continue;

        }


        const sectionAlreadyUsed =
            selected.some(
                function (item) {

                    return (
                        getArticleSection(
                            item
                        ) === section
                    );

                }
            );


        if (
            section &&
            sectionAlreadyUsed
        ) {

            continue;

        }


        selected.push(
            article
        );


        used.add(
            id
        );


        if (
            selected.length >=
            stories.length
        ) {

            break;

        }

    }


    /*
     * Fill remaining positions.
     */

    if (
        selected.length <
        stories.length
    ) {

        for (
            const article of articles
        ) {

            if (
                selected.length >=
                stories.length
            ) {

                break;

            }


            const id =
                getArticleId(
                    article
                );


            if (
                !used.has(id)
            ) {

                selected.push(
                    article
                );


                used.add(
                    id
                );

            }

        }

    }


    stories.forEach(
        function (
            story,
            index
        ) {

            const article =
                selected[index];


            if (!article) {

                story.style.display =
                    "none";

                return;

            }


            story.style.display =
                "";


            const category =
                story.querySelector(
                    ".category"
                );


            const title =
                story.querySelector(
                    "h3"
                );


            const summary =
                story.querySelector(
                    "p"
                );


            const link =
                story.querySelector(
                    "a"
                );


            if (category) {

                category.textContent =
                    formatLabel(
                        getArticleSection(
                            article
                        )
                    );

            }


            if (title) {

                title.textContent =
                    getArticleTitle(
                        article
                    );

            }


            if (summary) {

                summary.textContent =
                    getArticleSummary(
                        article
                    );

            }


            if (link) {

                link.href =
                    getArticleLink(
                        article
                    );

            }


            makeHomepageCardClickable(
                story,
                getArticleLink(
                    article
                )
            );

        }
    );

}


/* =====================================================
   LATEST NEWS
===================================================== */

function updateLatestNews(
    articles
) {

    const cards =
        document.querySelectorAll(
            ".news-card"
        );


    if (!cards.length) {

        return;

    }


    cards.forEach(
        function (
            card,
            index
        ) {

            const article =
                articles[index];


            if (!article) {

                card.style.display =
                    "none";

                return;

            }


            card.style.display =
                "";


            const category =
                card.querySelector(
                    ".category"
                );


            const title =
                card.querySelector(
                    "h3"
                );


            const summary =
                card.querySelector(
                    "p"
                );


            const meta =
                card.querySelector(
                    ".news-meta"
                );


            if (category) {

                category.textContent =
                    formatLabel(
                        getArticleSection(
                            article
                        )
                    );

            }


            if (title) {

                title.textContent =
                    getArticleTitle(
                        article
                    );

            }


            if (summary) {

                summary.textContent =
                    getArticleSummary(
                        article
                    );

            }


            if (meta) {

                meta.textContent =
                    formatHomepageDate(
                        getArticleDate(
                            article
                        )
                    );

            }


            makeHomepageCardClickable(
                card,
                getArticleLink(
                    article
                )
            );

        }
    );

}


/* =====================================================
   CATEGORY CARDS
===================================================== */

function updateCategoryCards(
    sectionName,
    articles
) {

    const section =
        document.getElementById(
            sectionName
        );


    if (!section) {

        return;

    }


    const matching =
        articles.filter(
            function (article) {

                return (
                    getArticleSection(
                        article
                    ) === sectionName
                );

            }
        );


    const cards =
        section.querySelectorAll(
            ".category-card, .policy-card"
        );


    cards.forEach(
        function (
            card,
            index
        ) {

            const article =
                matching[index];


            if (!article) {

                card.style.display =
                    "none";

                return;

            }


            card.style.display =
                "";


            const category =
                card.querySelector(
                    ".category"
                );


            const title =
                card.querySelector(
                    "h3"
                );


            const summary =
                card.querySelector(
                    "p"
                );


            const link =
                card.querySelector(
                    "a"
                );


            if (category) {

                category.textContent =
                    formatLabel(
                        getArticleSection(
                            article
                        )
                    );

            }


            if (title) {

                title.textContent =
                    getArticleTitle(
                        article
                    );

            }


            if (summary) {

                summary.textContent =
                    getArticleSummary(
                        article
                    );

            }


            if (link) {

                link.href =
                    getArticleLink(
                        article
                    );

            }


            makeHomepageCardClickable(
                card,
                getArticleLink(
                    article
                )
            );

        }
    );

}


/* =====================================================
   ANALYSIS CARDS
===================================================== */

function updateAnalysisCards(
    articles
) {

    const section =
        document.getElementById(
            "analysis"
        );


    if (!section) {

        return;

    }


    const matching =
        articles.filter(
            function (article) {

                return (
                    getArticleType(
                        article
                    ) === "analysis"
                );

            }
        );


    const cards =
        section.querySelectorAll(
            ".analysis-card"
        );


    cards.forEach(
        function (
            card,
            index
        ) {

            const article =
                matching[index];


            if (!article) {

                card.style.display =
                    "none";

                return;

            }


            card.style.display =
                "";


            const category =
                card.querySelector(
                    ".category"
                );


            const title =
                card.querySelector(
                    "h3"
                );


            const summary =
                card.querySelector(
                    "p"
                );


            const link =
                card.querySelector(
                    "a"
                );


            if (category) {

                category.textContent =
                    formatLabel(
                        getArticleSection(
                            article
                        )
                    );

            }


            if (title) {

                title.textContent =
                    getArticleTitle(
                        article
                    );

            }


            if (summary) {

                summary.textContent =
                    getArticleSummary(
                        article
                    );

            }


            if (link) {

                link.href =
                    getArticleLink(
                        article
                    );

            }


            makeHomepageCardClickable(
                card,
                getArticleLink(
                    article
                )
            );

        }
    );

}


/* =====================================================
   EXPLAINED CARDS
===================================================== */

function updateExplainedCards(
    articles
) {

    const section =
        document.getElementById(
            "explained"
        );


    if (!section) {

        return;

    }


    const matching =
        articles.filter(
            function (article) {

                return (
                    getArticleType(
                        article
                    ) === "explainer"
                );

            }
        );


    const cards =
        section.querySelectorAll(
            ".explained-grid article"
        );


    cards.forEach(
        function (
            card,
            index
        ) {

            const article =
                matching[index];


            if (!article) {

                card.style.display =
                    "none";

                return;

            }


            card.style.display =
                "";


            const category =
                card.querySelector(
                    ".category"
                );


            const title =
                card.querySelector(
                    "h3"
                );


            const summary =
                card.querySelector(
                    "p"
                );


            const link =
                card.querySelector(
                    "a"
                );


            if (category) {

                category.textContent =
                    formatLabel(
                        getArticleType(
                            article
                        )
                    );

            }


            if (title) {

                title.textContent =
                    getArticleTitle(
                        article
                    );

            }


            if (summary) {

                summary.textContent =
                    getArticleSummary(
                        article
                    );

            }


            if (link) {

                link.href =
                    getArticleLink(
                        article
                    );

            }


            makeHomepageCardClickable(
                card,
                getArticleLink(
                    article
                )
            );

        }
    );

}


/* =====================================================
   ARTICLE ID
===================================================== */

function getArticleId(
    article
) {

    return (
        article.id ||
        article.article_id ||
        article.slug ||
        ""
    );

}


/* =====================================================
   ARTICLE TITLE
===================================================== */

function getArticleTitle(
    article
) {

    return (
        article.title ||
        article.headline ||
        ""
    );

}


/* =====================================================
   ARTICLE SECTION
===================================================== */

function getArticleSection(
    article
) {

    return (
        article.section ||
        article.category ||
        article.topic ||
        ""
    )
        .toString()
        .toLowerCase();

}


/* =====================================================
   ARTICLE TYPE
===================================================== */

function getArticleType(
    article
) {

    return (
        article.type ||
        article.editorial_type ||
        ""
    )
        .toString()
        .toLowerCase();

}


/* =====================================================
   ARTICLE SUMMARY
===================================================== */

function getArticleSummary(
    article
) {

    return (
        article.summary ||
        article.excerpt ||
        article.deck ||
        article.description ||
        ""
    );

}


/* =====================================================
   ARTICLE AUTHOR
===================================================== */

function getArticleAuthor(
    article
) {

    return (
        article.author ||
        article.byline ||
        article.writer ||
        "BHARAT FRONTIERS Editorial Desk"
    );

}


/* =====================================================
   ARTICLE DATE
===================================================== */

function getArticleDate(
    article
) {

    return (
        article.published_date ||
        article.published ||
        article.date ||
        ""
    );

}


/* =====================================================
   ARTICLE LINK
===================================================== */

function getArticleLink(
    article
) {

    return (
        "./Articles/article.html?id=" +
        encodeURIComponent(
            getArticleId(
                article
            )
        )
    );

}


/* =====================================================
   SORT ARTICLES
===================================================== */

function sortHomepageArticles(
    articles
) {

    return [...articles].sort(
        function (a, b) {

            const featuredA =
                a.featured === true
                    ? 1
                    : 0;


            const featuredB =
                b.featured === true
                    ? 1
                    : 0;


            const dateA =
                new Date(
                    getArticleDate(a) || 0
                ).getTime();


            const dateB =
                new Date(
                    getArticleDate(b) || 0
                ).getTime();


            if (
                dateB !== dateA
            ) {

                return dateB - dateA;

            }


            return (
                featuredB -
                featuredA
            );

        }
    );

}


/* =====================================================
   FORMAT LABEL
===================================================== */

function formatLabel(
    value
) {

    if (!value) {

        return "";

    }


    return String(value)
        .replace(
            /-/g,
            " "
        )
        .replace(
            /\b\w/g,
            function (letter) {

                return letter.toUpperCase();

            }
        );

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatHomepageDate(
    value
) {

    if (!value) {

        return "";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =====================================================
   MAKE HOMEPAGE CARD CLICKABLE
===================================================== */

function makeHomepageCardClickable(
    card,
    url
) {

    if (
        !card ||
        !url
    ) {

        return;

    }


    /*
     * Prevent duplicate event handlers.
     */

    if (
        card.dataset.articleLinkBound ===
        "true"
    ) {

        return;

    }


    card.dataset.articleLinkBound =
        "true";


    card.style.cursor =
        "pointer";


    card.addEventListener(
        "click",
        function (event) {

            /*
             * Existing links and buttons
             * should continue working normally.
             */

            if (
                event.target.closest("a") ||
                event.target.closest("button")
            ) {

                return;

            }


            window.location.href =
                url;

        }
    );

}