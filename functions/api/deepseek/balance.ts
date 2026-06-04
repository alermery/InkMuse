type Env = {
  DEEPSEEK_API_KEY?: string;
};

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
    .map((item) => `${item.total_balance ?? "0"} ${item.currency ?? "CNY"}`)
    .join(" / ");
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = request.headers.get("x-deepseek-api-key") ?? env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "未检测到 DeepSeek API Key。" }, { status: 401 });
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
      return Response.json({ error: message }, { status: response.status });
    }

    const balanceInfos = payload?.balance_infos ?? [];

    return Response.json({
      isAvailable: payload?.is_available ?? false,
      balanceInfos,
      display: formatBalanceDisplay(balanceInfos),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `DeepSeek 余额查询失败：${error.message}`
            : "DeepSeek 余额查询失败。",
      },
      { status: 500 },
    );
  }
};
