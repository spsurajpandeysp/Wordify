import React from 'react';

const FormInput = ({
    label,
    error,
    success,
    helperText,
    className = '',
    inputClassName = '',
    required = false,
    ...inputProps
}) => {
    const inputClass = `form-input ${inputClassName} ${error ? 'form-input-error' : ''} ${success ? 'form-input-success' : ''}`;

    return (
        <div className={`form-group ${className}`}>
            {label && (
                <label htmlFor={inputProps.id} className="form-label">
                    {label}
                    {required && <span className="form-required">*</span>}
                </label>
            )}

            <input
                className={inputClass}
                {...inputProps}
            />

            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}
            {helperText && !error && !success && (
                <div className="form-helper">{helperText}</div>
            )}
        </div>
    );
};

const FormTextarea = ({
    label,
    error,
    success,
    helperText,
    className = '',
    textareaClassName = '',
    required = false,
    ...textareaProps
}) => {
    const textareaClass = `form-input form-textarea ${textareaClassName} ${error ? 'form-input-error' : ''} ${success ? 'form-input-success' : ''}`;

    return (
        <div className={`form-group ${className}`}>
            {label && (
                <label htmlFor={textareaProps.id} className="form-label">
                    {label}
                    {required && <span className="form-required">*</span>}
                </label>
            )}

            <textarea
                className={textareaClass}
                {...textareaProps}
            />

            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}
            {helperText && !error && !success && (
                <div className="form-helper">{helperText}</div>
            )}
        </div>
    );
};

const FormSelect = ({
    label,
    error,
    success,
    helperText,
    options = [],
    className = '',
    selectClassName = '',
    required = false,
    ...selectProps
}) => {
    const selectClass = `form-input ${selectClassName} ${error ? 'form-input-error' : ''} ${success ? 'form-input-success' : ''}`;

    return (
        <div className={`form-group ${className}`}>
            {label && (
                <label htmlFor={selectProps.id} className="form-label">
                    {label}
                    {required && <span className="form-required">*</span>}
                </label>
            )}

            <select className={selectClass} {...selectProps}>
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}
            {helperText && !error && !success && (
                <div className="form-helper">{helperText}</div>
            )}
        </div>
    );
};

// Add form styles
const styles = `
.form-required {
  color: #ef4444;
  margin-left: 2px;
}

.form-input-error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

.form-input-success {
  border-color: #10b981 !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
}

.form-helper {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Select styling */
select.form-input {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px 16px;
  padding-right: 40px;
  appearance: none;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

export { FormInput, FormTextarea, FormSelect };
export default FormInput;