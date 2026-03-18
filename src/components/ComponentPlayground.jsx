import { useEffect, useMemo, useState } from "react";
import { getShowcaseDemo } from "@/demos/showcaseRegistry";
import "./ComponentPlayground.css";

function buildDefaultValues(controls) {
  return controls.reduce((accumulator, control) => {
    accumulator[control.id] = control.defaultValue;
    return accumulator;
  }, {});
}

function parseControlValue(control, eventTarget) {
  if (control.type === "checkbox") {
    return Boolean(eventTarget.checked);
  }
  if (control.type === "number" || control.type === "range") {
    return Number(eventTarget.value);
  }
  return eventTarget.value;
}

const ComponentPlayground = ({
  componentId,
  componentName,
  fallbackSrc,
  onFallbackError,
  values: controlledValues,
  onValuesChange,
}) => {
  const definition = useMemo(() => getShowcaseDemo(componentId), [componentId]);
  const controls = useMemo(() => definition?.controls ?? [], [definition]);
  const initialValues = useMemo(() => buildDefaultValues(controls), [controls]);
  const [internalValues, setInternalValues] = useState(initialValues);
  const values = controlledValues ?? internalValues;

  useEffect(() => {
    if (controlledValues) {
      return;
    }
    setInternalValues(initialValues);
  }, [initialValues, controlledValues]);

  if (!definition) {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={`${componentName} screenshot`}
          className="preview-screenshot"
          onError={onFallbackError}
        />
      );
    }

    return <p>Preview not available for this component.</p>;
  }

  const DemoComponent = definition.Component;

  const handleControlChange = (control, eventTarget) => {
    const nextValue = parseControlValue(control, eventTarget);
    const nextValues = {
      ...values,
      [control.id]: nextValue,
    };

    if (onValuesChange) {
      onValuesChange(nextValues);
      return;
    }

    setInternalValues((previous) => ({
      ...previous,
      [control.id]: nextValue,
    }));
  };

  return (
    <div className="playground-shell">
      <div className="playground-preview">
        <DemoComponent values={values} />
      </div>
      <div className="playground-controls">
        <h3>Component Configuration</h3>
        <p>{definition.summary}</p>
        <div className="playground-control-grid">
          {controls.map((control) => (
            <label
              key={control.id}
              className={control.type === "checkbox" ? "playground-control playground-control--checkbox" : "playground-control"}
            >
              <span>{control.label}</span>
              {(() => {
                const controlValue = values[control.id] ?? control.defaultValue;

                if (control.type === "textarea") {
                  return (
                    <textarea
                      value={String(controlValue ?? "")}
                      onChange={(event) => handleControlChange(control, event.target)}
                      rows={3}
                    />
                  );
                }

                if (control.type === "select") {
                  return (
                    <select
                      value={String(controlValue ?? "")}
                      onChange={(event) => handleControlChange(control, event.target)}
                    >
                      {control.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  );
                }

                if (control.type === "checkbox") {
                  return (
                    <div className="playground-checkbox-field">
                      <input
                        type="checkbox"
                        checked={Boolean(controlValue)}
                        onChange={(event) => handleControlChange(control, event.target)}
                      />
                    </div>
                  );
                }

                return (
                  <div className="playground-control-input">
                    <input
                      type={control.type}
                      value={controlValue}
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      onChange={(event) => handleControlChange(control, event.target)}
                    />
                    {control.type === "range" ? <strong>{controlValue}</strong> : null}
                  </div>
                );
              })()}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComponentPlayground;
