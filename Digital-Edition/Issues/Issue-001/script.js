/* =====================================================
   BHARAT FRONTIERS
   DIGITAL EDITION ENGINE
   ISSUE 001
===================================================== */

const DATA_PATH = "../../../Data/";

let articles = [];
let issue = null;

let currentPage = 1;


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initializeEdition();

});


/* =====================================================
   LOAD DATA
===================================================== */

async function initializeEdition() {

    try {

        const [articlesResponse, issuesResponse] =
            await Promise.all([

                fetch(DATA_PATH + "articles.json"),
                fetch(DATA_PATH + "issues.json")

            ]);


        if (!articlesResponse.ok) {

            throw new Error(
                "Unable to load articles.json"
            );

        }


        if (!issuesResponse.ok) {

            throw new Error(
                "Unable to load issues.json"
            );

        }


        articles =
            await articlesResponse.json();


        const issues =
            await issuesResponse.json();


        issue =
            issues.find(item => item.id === "001");


        if (!issue) {

            throw new Error(
                "Issue 001 was not found in issues.json"
            );

        }


        setupEdition();

        renderPage();

        renderContents();

        hideLoading();


    } catch (error) {

        console.error(error);

        showError(error.message);

    }

}


/* =====================================================
   SETUP
===================================================== */

function setupEdition() {

    document.title =
        `BHARAT FRONTIERS | Issue ${issue.id}`;


    document.getElementById("totalPages")
        .textContent =
        formatNumber(issue.pages);


    document.getElementById("previousButton")
        .addEventListener(
            "click",
            previousPage
        );


    document.getElementById("nextButton")
        .addEventListener(
            "click",
            nextPage
        );


    document.getElementById("contentsButton")
        .addEventListener(
            "click",
            openContents
        );


    document.getElementById("closeContents")
        .addEventListener(
            "click",
            closeContents
        );


    document.getElementById("overlay")
        .addEventListener(
            "click",
            closeContents
        );


    document.addEventListener(
        "keydown",
        keyboardNavigation
    );

}


/* =====================================================
   RENDER PAGE
===================================================== */

function renderPage() {

    const content =
        document.getElementById("pageContent");


    content.innerHTML = "";


    updatePageInformation();


    if (currentPage === 1) {

        renderCover(content);

    }

    else if (currentPage === 2) {

        renderContentsPage(content);

    }

    else {

        const section =
            getSectionForPage(currentPage);


        if (section) {

            renderSectionPage(
                content,
                section
            );

        }

        else {

            renderGenericPage(
                content
            );

        }

    }


    updateNavigation();

}


/* =====================================================
   COVER PAGE
===================================================== */

function renderCover(container) {

    const article =
        getArticle(issue.coverArticle);


    if (!article) {

        container.innerHTML = `
            <div class="empty-page">
                Cover story unavailable.
            </div>
        `;

        return;

    }


    container.innerHTML = `

        <div class="cover-page">

            <div class="cover-kicker">
                ${escapeHTML(article.type)}
            </div>

            <h1>

                <a
                    href="${getArticleURL(article.id)}"
                    class="cover-title-link"
                >
                    ${escapeHTML(article.title)}
                </a>

            </h1>

            <p class="cover-deck">
                ${escapeHTML(article.summary)}
            </p>

            <div class="cover-visual">

                <div>
                    BHARAT
                    <br>
                    FRONTIERS
                </div>

            </div>

            <div class="cover-meta">

                <span>
                    ISSUE ${escapeHTML(issue.id)}
                </span>

                <span>
                    ${escapeHTML(issue.month)}
                </span>

            </div>

        </div>

    `;

}


/* =====================================================
   CONTENTS PAGE
===================================================== */

function renderContentsPage(container) {

    let rows = "";


    issue.sections.forEach(section => {

        rows += `

            <div class="contents-row">

                <div class="contents-page-number">
                    ${formatNumber(section.page)}
                </div>

                <div class="contents-section-name">
                    ${escapeHTML(section.name)}
                </div>

                <div class="contents-articles">

                    ${section.articles
                        .map(id => {

                            const article =
                                getArticle(id);


                            return article
                                ? `
                                    <div>

                                        <a
                                            href="${getArticleURL(article.id)}"
                                            class="contents-article-link"
                                        >
                                            ${escapeHTML(article.title)}
                                        </a>

                                    </div>
                                  `
                                : "";

                        })
                        .join("")}

                </div>

            </div>

        `;

    });


    container.innerHTML = `

        <div class="contents-page">

            <div class="page-kicker">
                ISSUE ${escapeHTML(issue.id)}
            </div>

            <h1>
                Contents
            </h1>

            <p class="contents-intro">
                ${escapeHTML(issue.description)}
            </p>

            <div class="contents-table">

                ${rows}

            </div>

        </div>

    `;

}


/* =====================================================
   SECTION PAGE
===================================================== */

function renderSectionPage(
    container,
    section
) {

    const sectionArticles =
        section.articles
            .map(id => getArticle(id))
            .filter(Boolean);


    let articlesHTML = "";


    sectionArticles.forEach(
        (article, index) => {

            articlesHTML += `

                <article class="
                    newspaper-article
                    ${index === 0
                        ? "lead-article"
                        : ""}
                ">

                    <div class="article-category">

                        ${escapeHTML(
                            article.type
                        )}

                    </div>

                    <h2>

                        <a
                            href="${getArticleURL(article.id)}"
                            class="article-title-link"
                        >

                            ${escapeHTML(
                                article.title
                            )}

                        </a>

                    </h2>

                    <p class="article-summary">

                        ${escapeHTML(
                            article.summary
                        )}

                    </p>

                    <div class="article-meta">

                        <span>

                            ${escapeHTML(
                                article.author
                            )}

                        </span>

                        <span>

                            ${escapeHTML(
                                article.date
                            )}

                        </span>

                    </div>

                    <a
                        href="${getArticleURL(article.id)}"
                        class="read-full-article"
                    >

                        Read Full Article →

                    </a>

                </article>

            `;

        }
    );


    if (!articlesHTML) {

        articlesHTML = `

            <div class="empty-section">

                <h3>
                    Editorial section in development
                </h3>

                <p>
                    This section is reserved for
                    verified BHARAT FRONTIERS reporting.
                </p>

            </div>

        `;

    }


    container.innerHTML = `

        <div class="section-page">

            <div class="section-kicker">
                PAGE ${formatNumber(section.page)}
            </div>

            <h1>
                ${escapeHTML(section.name)}
            </h1>

            <div class="section-rule"></div>

            <div class="section-articles">

                ${articlesHTML}

            </div>

        </div>

    `;

}


/* =====================================================
   GENERIC PAGE
===================================================== */

function renderGenericPage(container) {

    container.innerHTML = `

        <div class="empty-page">

            <div class="page-kicker">
                PAGE ${formatNumber(currentPage)}
            </div>

            <h1>
                BHARAT FRONTIERS
            </h1>

            <p>
                This page is currently being prepared
                for publication.
            </p>

        </div>

    `;

}


/* =====================================================
   GET SECTION
===================================================== */

function getSectionForPage(page) {

    return issue.sections.find(
        section => section.page === page
    );

}


/* =====================================================
   GET ARTICLE
===================================================== */

function getArticle(id) {

    return articles.find(
        article => article.id === id
    );

}


/* =====================================================
   ARTICLE URL
===================================================== */

function getArticleURL(id) {

    return (
        `../../../Articles/article.html?id=` +
        `${encodeURIComponent(id)}`
    );

}


/* =====================================================
   OPEN ARTICLE
   BACKWARD COMPATIBILITY
===================================================== */

function openArticle(id) {

    const article =
        getArticle(id);


    if (!article) {

        alert(
            "Article is not available."
        );

        return;

    }


    window.location.href =
        getArticleURL(article.id);

}


/* =====================================================
   CONTENTS PANEL
===================================================== */

function renderContents() {

    const list =
        document.getElementById("contentsList");


    list.innerHTML = `

        <button
            class="contents-item"
            onclick="goToPage(1)"
        >

            <span>
                01
            </span>

            <strong>
                Cover
            </strong>

        </button>


        <button
            class="contents-item"
            onclick="goToPage(2)"
        >

            <span>
                02
            </span>

            <strong>
                Contents
            </strong>

        </button>

    `;


    issue.sections.forEach(
        section => {

            list.innerHTML += `

                <button
                    class="contents-item"
                    onclick="goToPage(${section.page})"
                >

                    <span>
                        ${formatNumber(section.page)}
                    </span>

                    <strong>
                        ${escapeHTML(
                            section.name
                        )}
                    </strong>

                </button>

            `;

        }
    );

}


/* =====================================================
   NAVIGATION
===================================================== */

function nextPage() {

    if (
        currentPage <
        issue.pages
    ) {

        currentPage++;

        renderPage();

        scrollToTop();

    }

}


/* =====================================================
   PREVIOUS PAGE
===================================================== */

function previousPage() {

    if (currentPage > 1) {

        currentPage--;

        renderPage();

        scrollToTop();

    }

}


/* =====================================================
   GO TO PAGE
===================================================== */

function goToPage(page) {

    if (
        page < 1 ||
        page > issue.pages
    ) {

        return;

    }


    currentPage = page;

    renderPage();

    closeContents();

    scrollToTop();

}


/* =====================================================
   KEYBOARD NAVIGATION
===================================================== */

function keyboardNavigation(event) {

    if (event.key === "ArrowRight") {

        nextPage();

    }


    if (event.key === "ArrowLeft") {

        previousPage();

    }

}


/* =====================================================
   UPDATE PAGE INFORMATION
===================================================== */

function updatePageInformation() {

    const section =
        getSectionForPage(currentPage);


    document.getElementById("pageSection")
        .textContent =
        section
            ? section.name.toUpperCase()
            : currentPage === 1
                ? "COVER"
                : currentPage === 2
                    ? "CONTENTS"
                    : "BHARAT FRONTIERS";


    document.getElementById("pageNumber")
        .textContent =
        `PAGE ${formatNumber(currentPage)} / ${formatNumber(issue.pages)}`;


    document.getElementById("currentPage")
        .textContent =
        formatNumber(currentPage);

}


/* =====================================================
   NAVIGATION STATE
===================================================== */

function updateNavigation() {

    const previous =
        document.getElementById(
            "previousButton"
        );


    const next =
        document.getElementById(
            "nextButton"
        );


    previous.disabled =
        currentPage === 1;


    next.disabled =
        currentPage === issue.pages;

}


/* =====================================================
   CONTENTS PANEL
===================================================== */

function openContents() {

    const panel =
        document.getElementById(
            "contentsPanel"
        );


    const overlay =
        document.getElementById(
            "overlay"
        );


    panel.classList.add("open");


    panel.setAttribute(
        "aria-hidden",
        "false"
    );


    overlay.hidden = false;

}


/* =====================================================
   CLOSE CONTENTS
===================================================== */

function closeContents() {

    const panel =
        document.getElementById(
            "contentsPanel"
        );


    const overlay =
        document.getElementById(
            "overlay"
        );


    panel.classList.remove("open");


    panel.setAttribute(
        "aria-hidden",
        "true"
    );


    overlay.hidden = true;

}


/* =====================================================
   LOADING
===================================================== */

function hideLoading() {

    document.getElementById(
        "loading"
    ).hidden = true;


    document.getElementById(
        "newspaperPage"
    ).hidden = false;


    document.getElementById(
        "readerControls"
    ).hidden = false;

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
    ).textContent = message;

}


/* =====================================================
   UTILITIES
===================================================== */

function formatNumber(number) {

    return String(number).padStart(2, "0");

}


/* =====================================================
   SCROLL TO TOP
===================================================== */

function scrollToTop() {

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

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