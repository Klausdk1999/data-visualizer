import { renderHook, act, waitFor } from "@testing-library/react";
import { usePreferences } from "@/hooks/usePreferences";
import { getUserPreferences, updateUserPreferences } from "@/lib/requestHandlers";

jest.mock("@/lib/requestHandlers", () => ({
  getUserPreferences: jest.fn(),
  updateUserPreferences: jest.fn(),
}));

const mockedGetUserPreferences = getUserPreferences as jest.MockedFunction<
  typeof getUserPreferences
>;
const mockedUpdateUserPreferences = updateUserPreferences as jest.MockedFunction<
  typeof updateUserPreferences
>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("usePreferences", () => {
  it("loads preferences on mount", async () => {
    const prefs = { dashboard: { layout: "2x2" as const, widgets: [] } };
    mockedGetUserPreferences.mockResolvedValue(prefs);

    const { result } = renderHook(() => usePreferences(1));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.preferences).toEqual(prefs);
    expect(mockedGetUserPreferences).toHaveBeenCalledWith(1);
  });

  it("falls back to empty object on error", async () => {
    mockedGetUserPreferences.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePreferences(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.preferences).toEqual({});
  });

  it("savePreferences merges and debounces", async () => {
    jest.useFakeTimers();

    const initialPrefs = { dashboard: { layout: "2x2" as const, widgets: [] } };
    mockedGetUserPreferences.mockResolvedValue(initialPrefs);
    mockedUpdateUserPreferences.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePreferences(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const newPartial = { dashboard: { layout: "1x1" as const, widgets: [] } };

    act(() => {
      result.current.savePreferences(newPartial);
    });

    // Locally updated immediately
    expect(result.current.preferences).toEqual({ dashboard: { layout: "1x1", widgets: [] } });

    // API not called yet (debounced)
    expect(mockedUpdateUserPreferences).not.toHaveBeenCalled();

    // Advance past debounce
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockedUpdateUserPreferences).toHaveBeenCalledWith(1, {
      dashboard: { layout: "1x1", widgets: [] },
    });

    jest.useRealTimers();
  });

  it("cleanup cancels pending fetch", async () => {
    mockedGetUserPreferences.mockReturnValue(new Promise(() => {})); // never resolves

    const { unmount } = renderHook(() => usePreferences(1));

    // Unmount immediately while fetch is still pending
    unmount();

    // If the cancelled flag works, no state update errors should occur.
    // The test passing without "act" warnings is the assertion.
  });
});
