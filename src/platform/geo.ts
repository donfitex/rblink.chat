// Country list built from the browser's own data (no big hard-coded list), plus currencies and price formatting.
const FALLBACK = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United States', 'United Kingdom', 'India', 'Canada', 'Australia', 'Germany', 'France'];

function makeCountries(): string[] {
  try {
    const dn = new (Intl as any).DisplayNames(['en'], { type: 'region' });
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const out: string[] = [];
    for (const a of A) {
      for (const b of A) {
        const code = a + b;
        let name: any;
        try { name = dn.of(code); } catch { continue; }
        if (name && name !== code && !/unknown region/i.test(name)) out.push(name);
      }
    }
    const list = Array.from(new Set(out)).sort((x, y) => x.localeCompare(y));
    return list.length > 100 ? list : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export const COUNTRIES: string[] = makeCountries();
export const CURRENCIES = ['USD', 'NGN', 'GHS', 'KES', 'ZAR', 'UGX', 'TZS', 'XOF', 'EGP', 'MAD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'AED', 'SAR', 'CNY', 'JPY', 'BRL', 'MXN'];

export const money = (n: number, cur: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${cur} ${Number(n).toLocaleString()}`;
  }
};
