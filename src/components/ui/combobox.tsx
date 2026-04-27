"use client";

import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  notFoundText?: string;
  searchPlaceholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  notFoundText = "No results found",
  searchPlaceholder = "Search...",
  required,
  className = "",
  id,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const listboxId = `${generatedId}-listbox`;

  const selectedOption = options.find((o) => o.value === value);

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const openDropdown = useCallback(() => {
    setOpen(true);
    setQuery("");
    // Allow DOM to settle before focusing the search input
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const selectOption = useCallback(
    (option: SelectOption) => {
      onChange(option.value);
      setOpen(false);
      setQuery("");
    },
    [onChange]
  );

  const clear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
      setOpen(false);
    },
    [onChange]
  );

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) selectOption(filtered[0]);
    }
  };

  const triggerClasses = [
    "mt-1 w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900",
    "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100",
    "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1",
    "cursor-pointer select-none transition-colors",
    "hover:border-gray-400 dark:hover:border-gray-500",
    className,
  ].join(" ");

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        role="combobox"
        id={id}
        onClick={openDropdown}
        className={triggerClasses}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
      >
        <span
          className={
            selectedOption ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"
          }
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="flex items-center gap-1 ml-2 shrink-0">
          {value && (
            <X
              className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={clear}
              aria-label="Clear"
            />
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          required
          value={value}
          onChange={() => {}}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 w-full opacity-0 pointer-events-none"
        />
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[100] mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 px-3 py-2">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto" role="listbox" id={listboxId}>
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-center text-gray-400 dark:text-gray-500">
                {notFoundText}
              </p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => selectOption(option)}
                  className={[
                    "w-full text-left px-3 py-2 text-sm transition-colors",
                    option.value === value
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium"
                      : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
