"use client";

import React, { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface TimeMaskInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

/**
 * TimeMaskInput - Input rápido para digitação de horários (HH:MM)
 *
 * Funcionalidades:
 * - Aceita digitação direta de 4 dígitos sem precisar digitar ':' (ex: digita '0800' -> '08:00', '1330' -> '13:30')
 * - Aceita digitação de 1 ou 2 dígitos seguida de Tab/Enter/Blur (ex: digita '8' e sai -> '08:00', '14' -> '14:00')
 * - Suporta Backspace natural.
 * - Valida horas (00 a 23) e minutos (00 a 59).
 */
export function TimeMaskInput({
  id,
  name,
  value,
  onChange,
  required,
  className = "",
  placeholder = "08:00",
  onKeyDown,
  autoFocus,
}: TimeMaskInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const formatDigits = (digits: string): string => {
    const clean = digits.replace(/\D/g, "").slice(0, 4);

    if (clean.length === 0) return "";

    if (clean.length === 1) {
      return clean;
    }

    if (clean.length === 2) {
      let h = parseInt(clean, 10);
      if (h > 23) h = 23;
      return clean;
    }

    if (clean.length === 3) {
      const h = clean.slice(0, 2);
      const m = clean.slice(2, 3);
      return `${h}:${m}`;
    }

    // 4 digits: HH:MM
    let h = parseInt(clean.slice(0, 2), 10);
    let m = parseInt(clean.slice(2, 4), 10);

    if (h > 23) h = 23;
    if (m > 59) m = 59;

    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatDigits(raw);
    onChange(formatted);
  };

  const handleBlur = () => {
    if (!value) return;
    const clean = value.replace(/\D/g, "");

    // Se digitou apenas "8" -> vira "08:00"
    if (clean.length === 1 || clean.length === 2) {
      let h = parseInt(clean, 10);
      if (h > 23) h = 23;
      const hh = String(h).padStart(2, "0");
      onChange(`${hh}:00`);
    } else if (clean.length === 3) {
      // Ex: "830" -> "08:30"
      let h = parseInt(clean.slice(0, 1), 10);
      let m = parseInt(clean.slice(1, 3), 10);
      if (h > 23) h = 23;
      if (m > 59) m = 59;
      onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    } else if (clean.length >= 4) {
      let h = parseInt(clean.slice(0, 2), 10);
      let m = parseInt(clean.slice(2, 4), 10);
      if (h > 23) h = 23;
      if (m > 59) m = 59;
      onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  };

  return (
    <Input
      ref={inputRef}
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      required={required}
      value={value}
      onChange={handleInputChange}
      onBlur={handleBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      maxLength={5}
      className={`font-mono text-center tracking-wider ${className}`}
    />
  );
}
