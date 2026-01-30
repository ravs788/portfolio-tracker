import React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { Controller, useFormContext } from 'react-hook-form';
import { useAppStore } from '../../store';
import type { PlanInput } from '../../schemas';
import {
  formatCurrencyIndian,
  formatNumberIndian,
  formatIntegerIndian,
  formatPercent,
  parseNumberIndian,
} from '../../utils/format';

type Mode = 'currency' | 'number' | 'percent' | 'integer';

export type FormattedTextFieldProps = Omit<TextFieldProps, 'name' | 'value' | 'onChange' | 'type'> & {
  name: string;
  label: string;
  mode: Mode;
  fractionDigits?: number; // for number/percent formatting
  currencyCode?: string;   // override store currency
  allowUndefinedEmpty?: boolean; // when true, empty input becomes undefined (useful for optional fields)
  groupThousands?: boolean; // enable/disable digit grouping for integer mode (e.g., years)
};

/**
 * RHF-aware TextField that:
 *  - Parses user input onChange to a plain number for form state
 *  - Formats value onBlur using Indian grouping
 *  - Uses type="text" to allow commas and symbols in display
 *  - On focus, shows unformatted numeric string for easy editing
 */
const FormattedTextField: React.FC<FormattedTextFieldProps> = (props) => {
  const { name, label, mode, fractionDigits = 2, currencyCode: currencyOverride, allowUndefinedEmpty = false, groupThousands = true, ...rest } = props;
  const { control } = useFormContext<PlanInput>();
  const storeCurrency = useAppStore((s) => s.plan.settings.currency);
  const currencyCode = currencyOverride || storeCurrency || 'INR';

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
        return groupThousands ? formatIntegerIndian(n) : String(Math.trunc(n));
      default:
        return String(n);
    }
  };

  const normalizeForMode = (val: number | null): number | null => {
    if (val === null) return null;
    if (mode === 'integer') return Math.trunc(val);
    // For number/percent/currency we keep as-is (schema/validators handle ranges)
    return val;
  };

  return (
    <Controller
      control={control}
      name={name as any}
      render={({ field, fieldState }) => {
        const [display, setDisplay] = React.useState<string>(() => formatForMode(field.value));
        const [isFocused, setIsFocused] = React.useState(false);

        // Keep display in sync if underlying value changes externally
        React.useEffect(() => {
          if (isFocused) return;
          setDisplay(formatForMode(field.value));
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [field.value, currencyCode, mode, fractionDigits, groupThousands, isFocused]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const raw = e.target.value;
          setDisplay(raw);
          const trimmed = raw.trim();
          if (trimmed === '') {
            // Empty input: allow undefined for optional fields
            if (allowUndefinedEmpty) {
              field.onChange(undefined as any);
            } else {
              field.onChange(0);
            }
            return;
          }
          const parsed = parseNumberIndian(raw);
          const normalized = normalizeForMode(parsed);
          // Use 0 for unparsable interim states
          field.onChange(normalized ?? 0);
        };

        const handleBlur = () => {
          setIsFocused(false);
          const trimmed = (display ?? '').trim();
          const parsed = parseNumberIndian(display);
          if (parsed === null) {
            if (allowUndefinedEmpty && trimmed === '') {
              field.onChange(undefined as any);
              setDisplay('');
            } else {
              field.onChange(0);
              setDisplay(formatForMode(0));
            }
            field.onBlur();
            return;
          }
          const normalized = normalizeForMode(parsed);
          field.onChange(normalized ?? 0);
          setDisplay(formatForMode(normalized ?? 0));
          field.onBlur();
        };

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
          setIsFocused(true);
          // Show plain numeric string for editing
          const current = field.value;
          if (current === null || current === undefined || Number.isNaN(current)) {
            setDisplay('');
          } else {
            setDisplay(String(current));
          }
          if (rest.onFocus) rest.onFocus(e);
        };

        return (
          <TextField
            {...rest}
            label={label}
            type="text"
            name={field.name}
            value={display}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            error={!!fieldState.error}
            helperText={fieldState.error?.message || rest.helperText}
            inputProps={{ inputMode: 'decimal', ...rest.inputProps }}
            fullWidth={rest.fullWidth ?? true}
          />
        );
      }}
    />
  );
};

export default FormattedTextField;
