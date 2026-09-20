/* =====================================================
   BHARAT FRONTIERS
   ARTICLE READER ENGINE
===================================================== */

const DATA_PATH = "../Data/";


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    loadArticle
);


/* =====================================================
   LOAD ARTICLE
===================================================== */

async function loadArticle() {

    try {

        const params =
            new URLSearchParams(
                window.location.search
            );


        const articleId =
            params.get("id");


        if (!articleId) {

            throw new Error(
                "No article ID was provided."
            );

        }


        const response =
            await fetch(
                DATA_PATH + "articles.json"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load articles.json"
            );

        }


        const articles =
            await response.json();


        const article =
            articles.find(
                item => item.id === articleId
            );


        if (!article) {

            throw new Error(
                `Article "${articleId}" was not found.`
            );

        }


        renderArticle(article);

    }

    catch (error) {

        console.error(error);

        showError(error.message);

    }

}


/* =====================================================
   RENDER ARTICLE
===================================================== */

function renderArticle(article) {

    document.title =
        `${article.title} | BHARAT FRONTIERS`;


    document.getElementById(
        "articleSection"
    ).textContent =
        article.section ||
        article.category ||
        "";


    document.getElementById(
        "articleType"
    ).textContent =
        article.type ||
        "";


    document.getElementById(
        "articleTitle"
    ).textContent =
        article.title ||
        "";


    document.getElementById(
        "articleSummary"
    ).textContent =
        article.summary ||
        "";


    document.getElementById(
        "articleAuthor"
    ).textContent =
        article.author ||
        "BHARAT FRONTIERS Editorial Desk";


    document.getElementById(
        "articleDate"
    ).textContent =
        article.date ||
        "";


    document.getElementById(
        "articleIssue"
    ).textContent =
        article.issue
            ? `Issue ${article.issue}`
            : "Issue 001";


    renderBody(article);


    renderSources(article);


    document.getElementById(
        "loading"
    ).hidden = true;


    document.getElementById(
        "article"
    ).hidden = false;

}


/* =====================================================
   ARTICLE BODY
===================================================== */

function renderBody(article) {

    const body =
        document.getElementById(
            "articleBody"
        );


    /*
       IMPORTANT:
       Current BHARAT FRONTIERS articles
       may still be drafts and may not yet
       contain article body content.
    */

    if (
        !article.content ||
        String(article.content).trim() === ""
    ) {

        body.innerHTML = `

            <div class="draft-notice">

                <strong>
                    Article in Editorial Development
                </strong>

                <p>
                    This article is currently being
                    prepared for publication by the
                    BHARAT FRONTIERS editorial team.
                    Verified reporting and supporting
                    sources will be added before
                    publication.
                </p>

            </div>

        `;

        return;

    }


    /*
       If content exists, render it.
    */

    if (Array.isArray(article.content)) {

        body.innerHTML =
            article.content
                .map(paragraph => {

                    return `
                        <p>
                            ${escapeHTML(paragraph)}
                        </p>
                    `;

                })
                .join("");

        return;

    }


    /*
       If content is a string,
       preserve paragraph breaks.
    */

    body.innerHTML =
        String(article.content)
            .split(/\n\s*\n/)
            .map(paragraph => {

                return `
                    <p>
                        ${escapeHTML(
                            paragraph.trim()
                        )}
                    </p>
                `;

            })
            .join("");

}


/* =====================================================
   SOURCES
===================================================== */

function renderSources(article) {

    const section =
        document.getElementById(
            "sourcesSection"
        );


    const container =
        document.getElementById(
            "articleSources"
        );


    if (
        !article.sources ||
        !Array.isArray(article.sources) ||
        article.sources.length === 0
    ) {

        section.hidden = true;

        return;

    }


    container.innerHTML =
        article.sources
            .map((source, index) => {

                /*
                   Supports either:
                   1. source as a string
                   2. source as an object
                */

                if (
                    typeof source === "string"
                ) {

                    return `
                        <div class="source-item">

                            ${index + 1}.
                            ${escapeHTML(source)}

                        </div>
                    `;

                }


                const title =
                    source.title ||
                    source.name ||
                    "Source";


                const url =
                    source.url ||
                    source.link ||
                    "";


                if (url) {

                    return `
                        <div class="source-item">

                            ${index + 1}.
                            <a
                                href="${escapeAttribute(url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                ${escapeHTML(title)}
                            </a>

                        </div>
                    `;

                }


                return `
                    <div class="source-item">

                        ${index + 1}.
                        ${escapeHTML(title)}

                    </div>
                `;

            })
            .join("");


    section.hidden = false;

}


/* =====================================================
   ERROR
===================================================== */

function showError(message) {

    document.getElementById(
        "loading"
    ).hidden = true;


    document.getElementById(
        "error"
    ).hidden = false;


    document.getElementById(
        "errorMessage"
    ).textContent =
        message;

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   ESCAPE ATTRIBUTE
===================================================== */

function escapeAttribute(value) {

    return escapeHTML(value);

}