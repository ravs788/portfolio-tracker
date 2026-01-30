import React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { useAppStore } from '../../store';
import {
  formatCurrencyIndian,
  formatNumberIndian,
  formatIntegerIndian,
  formatPercent,
  parseNumberIndian,
} from '../../utils/format';

type Mode = 'currency' | 'number' | 'percent' | 'integer';

type InlineFormattedInputProps = {
  value: number | null | undefined;
  onValueChange: (val: number) => void;
  mode: Mode;
  fractionDigits?: number;
  currencyCode?: string;
  textFieldProps?: Omit<TextFieldProps, 'value' | 'onChange' | 'onBlur' | 'onFocus' | 'type'>;
};

/**
 * A lightweight, non-RHF formatted input using MUI TextField.
 * - Parses user input onChange to a plain number and calls onValueChange
 * - Formats onBlur using Indian grouping for the selected mode
 * - type="text" allows commas and symbols; onFocus shows raw number for editing
 */
const InlineFormattedInput: React.FC<InlineFormattedInputProps> = ({
  value,
  onValueChange,
  mode,
  fractionDigits = 2,
  currencyCode: overrideCurrency,
  textFieldProps,
}) => {
  const storeCurrency = useAppStore((s) => s.plan.settings.currency);
  const currencyCode = overrideCurrency || storeCurrency || 'INR';

  const formatForMode = (val: number | null | undefined): string => {
    if (val === null || val === undefined || Number.isNaN(val as number)) return '';
    const n = Number(val);
    switch (mode) {
      case 'currency':
        return formatCurrencyIndian(n, currencyCode, fractionDigits);
      case 'number':
        return formatNumberIndian(n, fractionDigits);
      case 'percent':
        return formatPercent(n, fractionDigits);
      case 'integer':
        return formatIntegerIndian(n);
      default:
        return String(n);
    }
  };

  const normalizeForMode = (val: number | null): number | null => {
    if (val === null) return null;
    if (mode === 'integer') return Math.trunc(val);
    return val;
  };

  const [display, setDisplay] = React.useState<string>(() => formatForMode(value));
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (isFocused) return;
    setDisplay(formatForMode(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, currencyCode, mode, fractionDigits, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplay(raw);
    const trimmed = raw.trim();
    if (trimmed === '') {
      // Treat empty as 0 for inline controls
      onValueChange(0);
      return;
    }
    const parsed = parseNumberIndian(raw);
    const normalized = normalizeForMode(parsed);
    onValueChange((normalized ?? 0) as number);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseNumberIndian(display);
    const normalized = normalizeForMode(parsed) ?? 0;
    onValueChange(normalized);
    setDisplay(formatForMode(normalized));
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (value === null || value === undefined || Number.isNaN(value)) {
      setDisplay('');
    } else {
      setDisplay(String(value));
    }
  };

  return (
    <TextField
      {...textFieldProps}
      type="text"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      inputProps={{ inputMode: 'decimal', ...(textFieldProps?.inputProps || {}) }}
      size={textFieldProps?.size ?? 'small'}
    />
  );
};

export default InlineFormattedInput;
