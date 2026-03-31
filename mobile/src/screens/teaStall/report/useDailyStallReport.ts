import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../services/api';
import { realtime } from '../../../services/realtime';

export type StallDailyTotals = {
  totalOrders: number;
  totalQty: number;
  totalAmount: number;
  cashSale: number;
  creditSale: number;
};

export type StallDailyOfficeRow = {
  officeId: string;
  officeName: string;
  phone: string;
  orders: number;
  qty: number;
  amount: number;
  cashAmount: number;
  creditAmount: number;
};

export type StallDailyItemRow = {
  menuItemId: string;
  itemName: string;
  category: string;
  qty: number;
  amount: number;
};

export type StallDailyDeliveryRow = {
  deliveryBoyId: string | null;
  name: string;
  phone: string;
  orders: number;
  saleAmount: number;
  cashCollected: number;
  creditAmount: number;
};

export type StallDailyReportResponse = {
  date: string;
  totals: StallDailyTotals;
  byOffice: StallDailyOfficeRow[];
  byItem: StallDailyItemRow[];
  byDeliveryBoy: StallDailyDeliveryRow[];
};

export function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isValidDateKey(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

export function useDailyStallReport(date: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StallDailyReportResponse | null>(null);

  const canLoad = useMemo(() => isValidDateKey(date), [date]);

  const load = useCallback(async () => {
    if (!canLoad) {
      setError('Enter date as YYYY-MM-DD');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<StallDailyReportResponse>('stall/report/daily', { params: { date: date.trim() } });
      setData(data);
    } catch (e: any) {
      setData(null);
      setError(String(e?.response?.data?.error ?? e?.message ?? 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [canLoad, date]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const unsub = realtime.onOrderEvent(() => {
      if (date.trim() !== todayKey()) return;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        load();
      }, 250);
    });
    return () => {
      if (timeout) clearTimeout(timeout);
      unsub();
    };
  }, [date, load]);

  return { loading, error, data, load, canLoad };
}

