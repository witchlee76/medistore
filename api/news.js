
function stripCdata(text = '') {
  return text.replace('<![CDATA[', '').replace(']]>', '').trim();
}

function decodeHtml(text = '') {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractItems(xml = '') {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  return items.slice(0, 8).map((match) => {
    const itemXml = match[1];
    const get = (tag) => {
      const m = itemXml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return m ? decodeHtml(stripCdata(m[1])) : '';
    };

    const title = get('title');
    const link = get('link');
    const pubDate = get('pubDate');

    const sourceMatch = title.match(/\(([^)]+)\)\s*$/);
    const source = sourceMatch ? sourceMatch[1] : 'Google News';
    const cleanTitle = sourceMatch ? title.replace(/\s*\([^)]+\)\s*$/, '') : title;

    return {
      title: cleanTitle,
      link,
      pubDate,
      source
    };
  });
}

export async function GET() {
  const query = encodeURIComponent('의료계 OR 병원 OR 의약품 OR 백신');
  const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;

  const response = await fetch(rssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    return Response.json(
      { error: `뉴스 RSS 호출 실패: ${response.status}` },
      { status: 500 }
    );
  }

  const xml = await response.text();
  const items = extractItems(xml);

  return Response.json({ items });
}
