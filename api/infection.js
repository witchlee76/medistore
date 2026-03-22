
export async function GET() {
  const serviceKey = process.env.DATA_GO_KR_API_KEY;

  if (!serviceKey) {
    return Response.json(
      { error: 'DATA_GO_KR_API_KEY 환경변수가 없습니다.' },
      { status: 500 }
    );
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const stdDay = "2023-08-01";

  const url =
    `http://apis.data.go.kr/1352000/ODMS_COVID_04/callCovid04Api` +
    `?serviceKey=${encodeURIComponent(serviceKey)}` +
    `&pageNo=1&numOfRows=500&apiType=JSON&std_day=${stdDay}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  });

  if (!response.ok) {
    return Response.json(
      { error: `감염병 API 호출 실패: ${response.status}` },
      { status: 500 }
    );
  }

  const raw = await response.json();
  const items = raw?.items || raw?.response?.body?.items || [];

  const normalized = items
    .filter(item => item.gubun && item.gubun !== '합계')
    .map(item => ({
      gubun: item.gubun,
      incDec: Number(item.incDec || 0),
      defCnt: Number(item.defCnt || 0),
      stdDay: item.stdDay || stdDay
    }))
    .sort((a, b) => b.incDec - a.incDec)
    .slice(0, 10);

  const total = items.find(item => item.gubun === '합계');

  return Response.json({
    stdDay: total?.stdDay || stdDay,
    totalIncDec: Number(total?.incDec || 0),
    totalDefCnt: Number(total?.defCnt || 0),
    items: normalized
  });
}
