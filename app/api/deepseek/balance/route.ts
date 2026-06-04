import { NextResponse } from "next/server";

export const runtime = "edge";

type DeepSeekBalanceInfo = {
  currency?: string;
  total_balance?: string;
  granted_balance?: string;
  topped_up_balance?: string;
};

type DeepSeekBalanceResponse = {
  is_available?: boolean;
  balance_infos?: DeepSeekBalanceInfo[];
};

function formatBalanceDisplay(balanceInfos: DeepSeekBalanceInfo[] = []) {
  if (!balanceInfos.length) {
    return "0";
  }

  return balanceInfos
    .map((item) => {
      const total = item.total_balance ?? "0";
      const currency = item.currency ?? "CNY";
      return `${total} ${currency}`;
    })
    .join(" / ");
}

export async function GET(request: Request) {
  const apiKey = request.headers.get("x-deepseek-api-key") ?? process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "未检测到 DeepSeek API Key。" }, { status: 401 });
  }

  try {
    const response = await fetch("https://api.deepseek.com/user/balance", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await response.text();
    const payload = text
      ? (JSON.parse(text) as DeepSeekBalanceResponse & { error?: { message?: string } })
      : null;

    if (!response.ok) {
      const message = payload?.error?.message ?? `DeepSeek 余额查询失败：${response.status}`;
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const balanceInfos = payload?.balance_infos ?? [];

    return NextResponse.json({
      isAvailable: payload?.is_available ?? false,
      balanceInfos,
      display: formatBalanceDisplay(balanceInfos),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `DeepSeek 余额查询失败：${error.message}`
            : "DeepSeek 余额查询失败。",
      },
      { status: 500 },
    );
  }
}
