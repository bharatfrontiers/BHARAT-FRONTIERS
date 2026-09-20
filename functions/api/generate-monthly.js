import {
  json,
  readJson,
  safeUrl,
  requireAdmin
} from "./_utils.js";

const TEXT_MODEL =
  "@cf/meta/llama-3.1-8b-instruct-fast";

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

function info(url) {

  try {

    const hostname =
      new URL(url)
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

const strip = s =>
  String(s || "")
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      " "
    )
    .replace(
      /<style[\s\S]*?<\/style>/gi,
      " "
    )
    .replace(
      /<noscript[\s\S]*?<\/noscript>/gi,
      " "
    )
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);

function decodeXml(value = "") {

  return String(value)
    .replace(
      /<!\[CDATA\[([\s\S]*?)\]\]>/gi,
      "$1"
    )
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

    const finalUrl =
      safeUrl(response.url || valid);

    if (!finalUrl) return null;

    /*
      Validate the FINAL URL, not the
      Google News redirect URL.
    */
    const trusted =
      info(finalUrl);

    if (!trusted) return null;

    const contentType =
      response.headers.get("content-type") || "";

    if (
      !contentType
        .toLowerCase()
        .includes("text/html")
    ) {
      return null;
    }

    const html =
      await response.text();

    const title =
      html.match(
        /<title[^>]*>([\s\S]*?)<\/title>/i
      )?.[1]
        ?.replace(/\s+/g, " ")
        .trim()
      || finalUrl;

    return {
      title,
      url: finalUrl,
      publisher: trusted.domain,
      source_type: trusted.type,
      verified: 1,
      retrieved_at:
        new Date().toISOString(),
      excerpt: strip(html)
    };

  } catch {

    return null;

  }

}

async function discover(topic) {

  const feed =
    `https://news.google.com/rss/search?q=${
      encodeURIComponent(topic + " India")
    }&hl=en-IN&gl=IN&ceid=IN:en`;

  try {

    const response =
      await fetch(feed, {
        headers: {
          "User-Agent":
            "BHARAT-FRONTIERS/1.0"
        }
      });

    if (!response.ok) {
      return [];
    }

    const xml =
      await response.text();

    const urls = [
      ...xml.matchAll(
        /<item>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<\/item>/gi
      )
    ]
      .map(match =>
        decodeXml(match[1]).trim()
      )
      .filter(Boolean);

    const out = [];

    for (
      const url
      of [...new Set(urls)].slice(0, 20)
    ) {

      const source =
        await inspect(url);

      if (source) {
        out.push(source);
      }

      if (out.length >= 8) {
        break;
      }

    }

    return out;

  } catch {

    return [];

  }

}

const slugify = s =>
  String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);

const uid = () =>
  crypto.randomUUID();

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

  if (!context.env.DB) {
    return json(
      {
        error:
          "D1 binding DB is not configured"
      },
      503
    );
  }

  if (!context.env.AI) {
    return json(
      {
        error:
          "Workers AI binding AI is not configured"
      },
      503
    );
  }

  const body =
    await readJson(context.request);

  const month =
    String(
      body.issue ||
      new Date()
        .toISOString()
        .slice(0, 7)
    );

  const topics =
    Array.isArray(body.topics)
      ? body.topics
          .map(String)
          .filter(Boolean)
      : [];

  if (!topics.length) {

    return json(
      {
        error:
          "topics[] is required"
      },
      400
    );

  }

  const runId = uid();

  const now =
    new Date().toISOString();

  await context.env.DB
    .prepare(
      `INSERT INTO agent_runs
       (id,command,status,started_at,message)
       VALUES(?,?,?,?,?)`
    )
    .bind(
      runId,
      "prepare-monthly",
      "running",
      now,
      "Editor command received."
    )
    .run();

  const generated = [];
  const failed = [];

  for (const topic of topics) {

    const sources =
      await discover(topic);

    if (sources.length < 2) {

      failed.push({
        topic,
        reason:
          "Fewer than two verified trusted sources were found. No article will be generated."
      });

      continue;
    }

    const evidence =
      sources
        .map(
          (source, index) =>
            `SOURCE ${index + 1}
TITLE:${source.title}
URL:${source.url}
PUBLISHER:${source.publisher}
EVIDENCE:${source.excerpt}`
        )
        .join("\n\n")
        .slice(0, 60000);

    const prompt =
      `You are the BHARAT FRONTIERS publication agent.

Topic: ${topic}

Create an original, neutral, evidence-led article using ONLY the supplied source evidence.

NEVER invent facts, dates, figures, quotes, events or references.

Every factual claim must be supported by one or more source numbers.

If evidence is insufficient, omit the claim.

Return JSON only:
title,
subtitle,
summary,
content_html,
more_info.

content_html uses <h2> and <p>.

Add [1], [2] source markers after factual claims.

more_info is an array of objects:
{about,url,title}

Use only supplied source URLs.

Do not mention AI in the article.

${evidence}`;

    let out;

    try {

      const result =
        await context.env.AI.run(
          TEXT_MODEL,
          {
            messages: [
              {
                role: "system",
                content:
                  "Return valid JSON only. No unsupported claims."
              },
              {
                role: "user",
                content: prompt
              }
            ]
          }
        );

      const raw =
        typeof result === "string"
          ? result
          : result.response ||
            result.output ||
            JSON.stringify(result);

      out =
        JSON.parse(raw);

    } catch {

      failed.push({
        topic,
        reason:
          "AI generation/JSON validation failed."
      });

      continue;

    }

    if (
      !out?.title ||
      !out?.content_html ||
      !Array.isArray(out.more_info) ||
      !/^([\s\S]*\[\d+\])/.test(
        String(out.content_html)
      )
    ) {

      failed.push({
        topic,
        reason:
          "Generated output failed the publication schema or contains no source markers."
      });

      continue;

    }

    const markerNums = [
      ...String(
        out.content_html
      ).matchAll(/\[(\d+)\]/g)
    ].map(
      match => Number(match[1])
    );

    if (
      markerNums.some(
        number =>
          number < 1 ||
          number > sources.length
      )
    ) {

      failed.push({
        topic,
        reason:
          "Generated output contains an invalid source marker."
      });

      continue;

    }

    const id = uid();

    const slug =
      slugify(out.title) +
      "-" +
      id.slice(0, 8);

    await context.env.DB
      .prepare(
        `INSERT INTO articles
        (
          id,
          slug,
          title,
          subtitle,
          section,
          type,
          author,
          published_at,
          summary,
          image,
          content_html,
          more_info_json,
          source_gate,
          status,
          featured,
          issue,
          created_at,
          updated_at
        )
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .bind(
        id,
        slug,
        out.title,
        out.subtitle || "",
        String(
          body.section ||
          "technology"
        ),
        String(
          body.type ||
          "feature"
        ),
        "BHARAT FRONTIERS Editorial Desk",
        null,
        out.summary || "",
        String(
          body.image || ""
        ),
        String(
          out.content_html
        ),
        "[]",
        "verified",
        "draft",
        0,
        month,
        now,
        now
      )
      .run();

    for (
      const [index, source]
      of sources.entries()
    ) {

      const sourceId =
        uid();

      await context.env.DB
        .prepare(
          `INSERT INTO sources
          (
            id,
            article_id,
            title,
            publisher,
            url,
            published_at,
            retrieved_at,
            source_type,
            verified
          )
          VALUES(?,?,?,?,?,?,?,?,?)`
        )
        .bind(
          sourceId,
          id,
          source.title,
          source.publisher,
          source.url,
          null,
          source.retrieved_at,
          source.source_type,
          1
        )
        .run();

    }

    const more =
      (out.more_info || [])
        .filter(
          item =>
            item &&
            safeUrl(item.url)
        )
        .slice(0, 8);

    await context.env.DB
      .prepare(
        `UPDATE articles
         SET more_info_json=?
         WHERE id=?`
      )
      .bind(
        JSON.stringify(more),
        id
      )
      .run();

    generated.push({
      id,
      slug,
      title: out.title,
      source_count: sources.length
    });

  }

  await context.env.DB
    .prepare(
      `INSERT OR REPLACE INTO agent_runs
      (
        id,
        command,
        status,
        started_at,
        finished_at,
        message
      )
      VALUES(?,?,?,?,?,?)`
    )
    .bind(
      runId,
      "prepare-monthly",
      failed.length
        ? "completed-with-blocks"
        : "completed",
      now,
      new Date().toISOString(),
      JSON.stringify({
        generated: generated.length,
        blocked: failed.length
      })
    )
    .run();

  return json({
    ok: true,
    issue: month,
    generated,
    blocked: failed,
    publication_rule:
      "No source-verified evidence = no article publication."
  });

}