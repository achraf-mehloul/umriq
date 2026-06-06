/**
 * Real OHLC daily aggregation over public offers — drives the trading-style
 * market overview chart. RLS allows authenticated reads on active offers.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Candle {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // number of offers that day
}

function toDay(d: string | Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

export function useMarketCandles(days = 14) {
  return useQuery({
    queryKey: ["market-candles", days],
    staleTime: 60_000,
    queryFn: async (): Promise<Candle[]> => {
      const since = new Date();
      since.setDate(since.getDate() - days - 1);
      const { data, error } = await supabase
        .from("offers")
        .select("price, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as { price: number; created_at: string }[];

      // group by day
      const groups = new Map<string, number[]>();
      for (const r of rows) {
        const day = toDay(r.created_at);
        const arr = groups.get(day) ?? [];
        arr.push(Number(r.price));
        groups.set(day, arr);
      }

      // build last N days continuous, carry close-forward
      const out: Candle[] = [];
      let prevClose: number | null = null;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = toDay(d);
        const prices = groups.get(key);
        if (prices && prices.length > 0) {
          const open = prevClose ?? prices[0];
          const close = prices[prices.length - 1];
          const high = Math.max(open, close, ...prices);
          const low = Math.min(open, close, ...prices);
          out.push({ date: key, open, high, low, close, volume: prices.length });
          prevClose = close;
        } else if (prevClose !== null) {
          out.push({ date: key, open: prevClose, high: prevClose, low: prevClose, close: prevClose, volume: 0 });
        } else {
          out.push({ date: key, open: 0, high: 0, low: 0, close: 0, volume: 0 });
        }
      }
      return out;
    },
  });
}
