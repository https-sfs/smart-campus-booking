export function TextField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  required = false,
  className = '',
  ...rest
}) {
  const errorId = error ? `${id}-error` : undefined
  const shared = {
    id,
    value,
    onChange,
    required,
    'aria-invalid': Boolean(error),
    'aria-describedby': errorId,
    ...rest,
  }

  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={id}>
        {label}
        {required ? <span className="req"> Required</span> : null}
      </label>
      {type === 'textarea' ? <textarea {...shared} /> : <input type={type} {...shared} />}
      {hint ? <p className="field-hint">{hint}</p> : null}
      {error ? (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  required = false,
  children,
}) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? <span className="req"> Required</span> : null}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
      >
        {children}
      </select>
      {hint ? <p className="field-hint">{hint}</p> : null}
      {error ? (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
