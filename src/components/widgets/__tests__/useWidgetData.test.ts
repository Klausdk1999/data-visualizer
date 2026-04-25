import { renderHook, waitFor, act } from "@testing-library/react";
import {
  useWidgetData,
  getTimespanRange,
  getLatestValue,
  getPreviousValue,
  formatShortTime,
  CHART_COLORS,
  ALL_TIMESPANS,
} from "@/components/widgets/useWidgetData";
import { getSignalValues } from "@/lib/requestHandlers";
import type { SignalValue } from "@/types";

jest.mock("@/lib/requestHandlers", () => ({
  getSignalValues: jest.fn(),
}));

const mockedGetSignalValues = getSignalValues as jest.MockedFunction<typeof getSignalValues>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ---- Pure utility function tests ----

describe("getTimespanRange", () => {
  it("returns valid ISO dates with ~1 hour difference for '1h'", () => {
    const { from_date, to_date } = getTimespanRange("1h");
    const from = new Date(from_date);
    const to = new Date(to_date);

    expect(from_date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(to_date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(isNaN(from.getTime())).toBe(false);
    expect(isNaN(to.getTime())).toBe(false);

    const diffMs = to.getTime() - from.getTime();
    // Should be approximately 1 hour (allow 100ms tolerance for execution time)
    expect(diffMs).toBeGreaterThanOrEqual(3600000 - 100);
    expect(diffMs).toBeLessThanOrEqual(3600000 + 100);
  });
});

describe("getLatestValue", () => {
  const values: SignalValue[] = [
    { id: 1, signal_id: 1, timestamp: "2026-01-01T00:00:00Z", value: 10 },
    { id: 2, signal_id: 1, timestamp: "2026-01-01T01:00:00Z", value: 20 },
    { id: 3, signal_id: 1, timestamp: "2026-01-01T02:00:00Z", value: 30 },
  ];

  it("returns last element", () => {
    expect(getLatestValue(values)).toEqual(values[2]);
  });

  it("returns undefined for empty array", () => {
    expect(getLatestValue([])).toBeUndefined();
  });
});

describe("getPreviousValue", () => {
  const values: SignalValue[] = [
    { id: 1, signal_id: 1, timestamp: "2026-01-01T00:00:00Z", value: 10 },
    { id: 2, signal_id: 1, timestamp: "2026-01-01T01:00:00Z", value: 20 },
  ];

  it("returns second to last", () => {
    expect(getPreviousValue(values)).toEqual(values[0]);
  });

  it("returns undefined for single element", () => {
    expect(getPreviousValue([values[0]])).toBeUndefined();
  });
});

describe("formatShortTime", () => {
  it("formats correctly as HH:MM", () => {
    // Use a date where we know the local hours/minutes
    const d = new Date(2026, 0, 15, 9, 5); // Jan 15, 2026, 09:05 local
    const result = formatShortTime(d.toISOString());
    expect(result).toBe("09:05");
  });
});

describe("CHART_COLORS", () => {
  it("has 8 entries", () => {
    expect(CHART_COLORS).toHaveLength(8);
  });
});

describe("ALL_TIMESPANS", () => {
  it("has 5 entries", () => {
    expect(ALL_TIMESPANS).toHaveLength(5);
  });
});

// ---- Hook tests ----

describe("useWidgetData", () => {
  const sampleValues: SignalValue[] = [
    { id: 1, signal_id: 1, timestamp: "2026-01-01T00:00:00Z", value: 10 },
    { id: 2, signal_id: 1, timestamp: "2026-01-01T01:00:00Z", value: 20 },
  ];

  it("fetches data for signal IDs", async () => {
    mockedGetSignalValues.mockResolvedValue(sampleValues);

    const { result } = renderHook(() =>
      useWidgetData({ signalIds: [1, 2], timespan: "1h", autoRefresh: false })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dataMap).toHaveProperty("1");
    expect(result.current.dataMap).toHaveProperty("2");
    expect(mockedGetSignalValues).toHaveBeenCalledTimes(2);
  });

  it("returns empty dataMap for empty signalIds", async () => {
    const { result } = renderHook(() =>
      useWidgetData({ signalIds: [], timespan: "1h", autoRefresh: false })
    );

    // With empty signalIds, loading stays false and dataMap is empty
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.dataMap).toEqual({});
    expect(mockedGetSignalValues).not.toHaveBeenCalled();
  });

  it("refresh triggers re-fetch", async () => {
    mockedGetSignalValues.mockResolvedValue(sampleValues);

    const { result } = renderHook(() =>
      useWidgetData({ signalIds: [1], timespan: "1h", autoRefresh: false })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const callsBefore = mockedGetSignalValues.mock.calls.length;

    // Trigger refresh
    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGetSignalValues.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});
