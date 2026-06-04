export function stripMarkup(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countChineseWords(value: string) {
  const text = stripMarkup(value);
  const cjkChars = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const latinWords = text
    .replace(/[\u3400-\u9fff]/g, " ")
    .match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0;

  return cjkChars + latinWords;
}

export function parseTargetWordCount(value?: string | number | null) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  const compact = value.replace(/\s/g, "");
  const range = compact.match(/(\d+(?:\.\d+)?)(万|千|k|K)?[-~至到](\d+(?:\.\d+)?)(万|千|k|K)?/);
  const single = compact.match(/(\d+(?:\.\d+)?)(万|千|k|K)?/);

  const toNumber = (raw: string, unit?: string) => {
    const number = Number(raw);
    if (!Number.isFinite(number)) {
      return null;
    }
    if (unit === "万") {
      return Math.round(number * 10000);
    }
    if (unit === "千" || unit === "k" || unit === "K") {
      return Math.round(number * 1000);
    }
    return Math.round(number);
  };

  if (range) {
    const first = toNumber(range[1], range[2] || range[4]);
    const second = toNumber(range[3], range[4] || range[2]);
    if (first && second) {
      return Math.round((first + second) / 2);
    }
  }

  if (!single) {
    return null;
  }

  return toNumber(single[1], single[2]);
}

export function getWordCountReview(actual: number, target?: number | null) {
  if (!target) {
    return { status: "neutral" as const, label: `当前约 ${actual.toLocaleString()} 字` };
  }

  const min = Math.round(target * 0.9);
  const max = Math.round(target * 1.1);

  if (actual < min) {
    return {
      status: "low" as const,
      label: `当前约 ${actual.toLocaleString()} 字，低于目标 ${target.toLocaleString()} 字`,
    };
  }

  if (actual > max) {
    return {
      status: "high" as const,
      label: `当前约 ${actual.toLocaleString()} 字，高于目标 ${target.toLocaleString()} 字`,
    };
  }

  return {
    status: "ok" as const,
    label: `当前约 ${actual.toLocaleString()} 字，符合目标 ${target.toLocaleString()} 字`,
  };
}
