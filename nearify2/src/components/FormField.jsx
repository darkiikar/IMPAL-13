import styles from './FormField.module.css'

/**
 * FormField — input dengan label dan pesan error
 */
export default function FormField({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required,
  minLength,
  autoComplete,
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
      />
      <span
        id={`${id}-error`}
        className={styles.error}
        role="alert"
        aria-live="polite"
      >
        {error || ''}
      </span>
    </div>
  )
}
