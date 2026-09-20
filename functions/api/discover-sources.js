import { json, readJson, safeUrl, requireAdmin } from "./_utils.js";

const TRUSTED = [
  { domain: "gov.in", type: "government" },
  { domain: "nic.in", type: "government" },
  { domain: "isro.gov.in", type: "primary" },
  { domain: "dst.gov.in", type: "government" },
  { domain: "meity.gov.in", type: "government" },
  { domain: "pib.gov.in", type: "government" },
  { domain: "niti.gov.in", type: "government" },
  { domain: "education.gov.in", type: "government" },
  { domain: "dos.gov.in", type: "government" },
  { domain: "drdo.gov.in", type: "primary" },
  { domain: "csir.res.in", type: "research" },
  { domain: "iisc.ac.in", type: "research" },
  { domain: "iit.ac.in", type: "research" },
  { domain: "who.int", type: "international" },
  { domain: "un.org", type: "international" },
  { domain: "worldbank.org", type: "international" },
  { domain: "oecd.org", type: "international" },
  { domain: "wto.org", type: "international" },
  { domain: "nature.com", type: "research" },
  { domain: "science.org", type: "research" },
  { domain: "ieee.org", type: "research" },
  { domain: "acm.org", type: "research" }
];

function domainInfo(url) {
  try {
    const hostname = new URL(url)
      .hostname
      .toLowerCase()
      .replace(/^www\./, "");

    return TRUSTED.find(
      item =>
        hostname === item.domain ||
        hostname.endsWith("." + item.domain)
    ) || null;
  } catch {
    return null;
  }
}

function strip(html = "") {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

function meta(html, name) {
  const regex = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>`,
    "i"
  );

  return html.match(regex)?.[1] || "";
}

function decodeXml(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'");
}

async function inspect(url) {
  const valid = safeUrl(url);

  if (!valid) return null;

  try {
    const response = await fetch(valid, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "BHARAT-FRONTIERS/1.0 source-verifier"
      }
    });

    if (!response.ok) return null;

    const finalUrl = safeUrl(response.url || valid);

    if (!finalUrl) return null;

    /*
      IMPORTANT:
      The initial URL may be a Google News redirect.
      Validate the FINAL URL after redirect.
    */
    const info = domainInfo(finalUrl);

    if (!info) return null;

    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("text/html")) {
      return null;
    }

    const html = await response.text();

    const title =
      (
        html.match(
          /<title[^>]*>([\s\S]*?)<\/title>/i
        )?.[1] ||
        meta(html, "og:title") ||
        finalUrl
      )
        .replace(/\s+/g, " ")
        .trim();

    const description =
      meta(html, "description") ||
      meta(html, "og:description");

    const published =
      meta(html, "article:published_time") ||
      meta(html, "date") ||
      "";

    return {
      title,
      description,
      excerpt: strip(html),
      url: finalUrl,
      publisher: info.domain,
      source_type: info.type,
      verified: 1,
      published_at: published,
      retrieved_at: new Date().toISOString()
    };

  } catch {
    return null;
  }
}

async function discoverGoogleNews(topic) {

  const feed =
    `https://news.google.com/rss/search?q=${
      encodeURIComponent(topic + " India")
    }&hl=en-IN&gl=IN&ceid=IN:en`;

  try {

    const response = await fetch(feed, {
      headers: {
        "User-Agent":
          "BHARAT-FRONTIERS/1.0"
      }
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();

    const links = [
      ...xml.matchAll(
        /<item>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<\/item>/gi
      )
    ]
      .map(match => decodeXml(match[1]).trim())
      .filter(Boolean);

    return links;

  } catch {
    return [];
  }
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {

  const auth =
    requireAdmin(
      context.request,
      context.env
    );

  if (!auth.ok) {
    return auth.response;
  }

  const body =
    await readJson(context.request);

  const urls =
    Array.isArray(body.urls)
      ? body.urls
      : [];

  const topic =
    String(body.topic || "").trim();

  let candidates = urls.filter(Boolean);

  if (topic) {

    const discovered =
      await discoverGoogleNews(topic);

    candidates.push(...discovered);

  }

  const uniqueCandidates = [
    ...new Set(candidates)
  ];

  const sources = [];

  for (
    const candidate
    of uniqueCandidates.slice(0, 20)
  ) {

    const source =
      await inspect(candidate);

    if (source) {
      sources.push(source);
    }

    if (sources.length >= 10) {
      break;
    }
  }

  return json({
    ok: true,
    topic,
    sources: sources.slice(0, 10),
    message: sources.length
      ? "Verified source candidates returned."
      : "No verified trusted sources were found."
  });
}