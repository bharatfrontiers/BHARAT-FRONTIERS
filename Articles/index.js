/* =====================================================
   BHARAT FRONTIERS
   ARTICLES INDEX ENGINE
===================================================== */

const DATA_PATH = "../Data/";


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    loadArticles
);


/* =====================================================
   GLOBAL DATA
===================================================== */

let allArticles = [];


/* =====================================================
   LOAD ARTICLES
===================================================== */

async function loadArticles() {

    try {

        const response =
            await fetch(
                DATA_PATH + "articles.json"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load articles.json"
            );

        }


        const data =
            await response.json();


        /*
         * Support:
         *
         * 1. Direct array
         * 2. { articles: [] }
         * 3. { items: [] }
         */

        if (Array.isArray(data)) {

            allArticles = data;

        }

        else if (
            data &&
            Array.isArray(data.articles)
        ) {

            allArticles = data.articles;

        }

        else if (
            data &&
            Array.isArray(data.items)
        ) {

            allArticles = data.items;

        }

        else {

            throw new Error(
                "articles.json does not contain a valid article list."
            );

        }


        populateFilters();

        setupControls();

        renderArticles();


        document.getElementById(
            "loading"
        ).hidden = true;

    }

    catch (error) {

        console.error(error);

        showError(error.message);

    }

}


/* =====================================================
   FILTER OPTIONS
===================================================== */

function populateFilters() {

    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    const typeFilter =
        document.getElementById(
            "typeFilter"
        );


    const categories =
        uniqueValues(
            allArticles.map(
                article =>
                    article.category ||
                    article.section ||
                    article.topic ||
                    ""
            )
        );


    const types =
        uniqueValues(
            allArticles.map(
                article =>
                    article.type ||
                    article.editorial_type ||
                    ""
            )
        );


    categories
        .sort()
        .forEach(category => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                category;

            option.textContent =
                category;

            categoryFilter.appendChild(
                option
            );

        });


    types
        .sort()
        .forEach(type => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                type;

            option.textContent =
                type;

            typeFilter.appendChild(
                option
            );

        });

}


/* =====================================================
   CONTROLS
===================================================== */

function setupControls() {

    const search =
        document.getElementById(
            "articleSearch"
        );


    const category =
        document.getElementById(
            "categoryFilter"
        );


    const type =
        document.getElementById(
            "typeFilter"
        );


    search.addEventListener(
        "input",
        renderArticles
    );


    category.addEventListener(
        "change",
        renderArticles
    );


    type.addEventListener(
        "change",
        renderArticles
    );

}


/* =====================================================
   RENDER ARTICLES
===================================================== */

function renderArticles() {

    const grid =
        document.getElementById(
            "articlesGrid"
        );


    const empty =
        document.getElementById(
            "emptyState"
        );


    const searchValue =
        document.getElementById(
            "articleSearch"
        ).value
            .trim()
            .toLowerCase();


    const categoryValue =
        document.getElementById(
            "categoryFilter"
        ).value;


    const typeValue =
        document.getElementById(
            "typeFilter"
        ).value;


    const filtered =
        allArticles.filter(
            article => {

                const title =
                    getTitle(article)
                        .toLowerCase();


                const summary =
                    getSummary(article)
                        .toLowerCase();


                const category =
                    getCategory(article);


                const type =
                    getType(article);


                const matchesSearch =
                    !searchValue ||
                    title.includes(searchValue) ||
                    summary.includes(searchValue) ||
                    category.toLowerCase()
                        .includes(searchValue) ||
                    type.toLowerCase()
                        .includes(searchValue);


                const matchesCategory =
                    categoryValue === "all" ||
                    category === categoryValue;


                const matchesType =
                    typeValue === "all" ||
                    type === typeValue;


                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesType
                );

            }
        );


    grid.innerHTML = "";


    document.getElementById(
        "articleCount"
    ).textContent =
        `${filtered.length} article${filtered.length === 1 ? "" : "s"}`;


    if (filtered.length === 0) {

        empty.hidden = false;

        return;

    }


    empty.hidden = true;


    filtered.forEach(
        article => {

            grid.appendChild(
                createArticleCard(article)
            );

        }
    );

}


/* =====================================================
   CREATE ARTICLE CARD
===================================================== */

function createArticleCard(article) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "article-card";


    const id =
        getArticleId(article);


    const title =
        getTitle(article);


    const category =
        getCategory(article);


    const type =
        getType(article);


    const summary =
        getSummary(article);


    const date =
        getDate(article);


    const author =
        getAuthor(article);


    card.innerHTML = `

        <div class="article-card-content">

            <div class="card-top">

                <div class="card-category">
                    ${escapeHTML(category)}
                </div>

                ${
                    type
                        ? `
                            <div class="card-type">
                                ${escapeHTML(type)}
                            </div>
                          `
                        : ""
                }

            </div>


            <h3>

                <a href="article.html?id=${encodeURIComponent(id)}">

                    ${escapeHTML(title)}

                </a>

            </h3>


            ${
                summary
                    ? `
                        <p class="card-summary">
                            ${escapeHTML(summary)}
                        </p>
                      `
                    : ""
            }


            <div class="card-footer">

                <div class="card-date">

                    ${escapeHTML(date)}

                </div>


                <div class="card-author">

                    ${escapeHTML(author)}

                </div>

            </div>

        </div>

    `;


    return card;

}


/* =====================================================
   FIELD HELPERS
===================================================== */

function getArticleId(article) {

    return (
        article.id ||
        article.article_id ||
        article.slug ||
        ""
    );

}


function getTitle(article) {

    return (
        article.title ||
        article.headline ||
        "Untitled Article"
    );

}


function getCategory(article) {

    return (
        article.category ||
        article.section ||
        article.topic ||
        "BHARAT FRONTIERS"
    );

}


function getType(article) {

    return (
        article.type ||
        article.editorial_type ||
        ""
    );

}


function getSummary(article) {

    return (
        article.summary ||
        article.excerpt ||
        article.deck ||
        article.description ||
        ""
    );

}


function getDate(article) {

    return (
        article.published_date ||
        article.published ||
        article.date ||
        ""
    );

}


function getAuthor(article) {

    return (
        article.author ||
        article.byline ||
        article.writer ||
        "BHARAT FRONTIERS Editorial Desk"
    );

}


/* =====================================================
   UNIQUE VALUES
===================================================== */

function uniqueValues(values) {

    return [
        ...new Set(
            values
                .map(value =>
                    String(value).trim()
                )
                .filter(Boolean)
        )
    ];

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