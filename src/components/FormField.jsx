/**
 * FormField — a small, focused, reusable wrapper for labelled form inputs.
 *
 * Prop contract:
 *   id          {string}   required — links <label> to the control via htmlFor/id.
 *   label       {string}   required — visible label text.
 *   error       {string}   optional — when non-empty an aria-described error message is shown.
 *   srOnly      {boolean}  optional — hide the label visually (screen-reader only, default false).
 *   children    {ReactNode} required — the actual <input>, <select> or <textarea>.
 *   className   {string}   optional — extra class applied to the wrapper div.
 *
 * The component intentionally does NOT manage any state; it is purely presentational
 * and delegates all controlled-input state to the parent.
 */
import "./FormField.css";

const FormField = ({ id, label, error, srOnly = false, children, className = "" }) => {
    const errorId = error ? `${id}-error` : undefined;

    return (
        <div className={`form-field${className ? ` ${className}` : ""}`}>
            <label
                htmlFor={id}
                className={srOnly ? "sr-only" : "form-field__label"}
            >
                {label}
            </label>

            {/* Clone children to inject aria-describedby / aria-invalid when there is an error */}
            {error
                ? (() => {
                    // Pass aria attributes to the first child element via a wrapper pattern.
                    // This keeps FormField generic without importing React.cloneElement complexities.
                    return (
                        <div
                            aria-invalid="true"
                            aria-describedby={errorId}
                            className="form-field__control-wrap form-field__control-wrap--error"
                        >
                            {children}
                        </div>
                    );
                })()
                : <div className="form-field__control-wrap">{children}</div>}

            {error ? (
                <span id={errorId} className="form-field__error" role="alert">
                    {error}
                </span>
            ) : null}
        </div>
    );
};

export default FormField;
