import * as React from "react";

const TOAST_LIMIT = 10;
const DEFAULT_TOAST_DURATION = 4000;
const TOAST_REMOVE_DELAY = 300;

let toastCounter = 0;
let stateMemory = { toasts: [] };

const listeners = [];
const removeTimers = new Map();

function getToastId() {
  toastCounter = (toastCounter + 1) % Number.MAX_SAFE_INTEGER;
  return toastCounter.toString();
}

function notifyListeners() {
  listeners.forEach((listener) => listener(stateMemory));
}

function dispatch(action) {
  stateMemory = reducer(stateMemory, action);
  notifyListeners();
}

function addRemoveTimer(toastId) {
  if (removeTimers.has(toastId)) {
    return;
  }

  const timerId = setTimeout(() => {
    removeTimers.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);

  removeTimers.set(toastId, timerId);
}

function dismissToastById(toastId) {
  dispatch({ type: "DISMISS_TOAST", toastId });
}

function createToast(toastData) {
  const id = getToastId();
  const duration = toastData.duration ?? DEFAULT_TOAST_DURATION;
  const createdAt = Date.now();
  const showTimer = toastData.showTimer ?? true;

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...toastData,
      id,
      duration,
      createdAt,
      showTimer,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
          dismissToastById(id);
        }
      },
    },
  });

  return {
    id,
    dismiss: () => dismissToastById(id),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((toastItem) => {
          return toastItem.id === action.toast.id
            ? { ...toastItem, ...action.toast }
            : toastItem;
        }),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addRemoveTimer(toastId);
      } else {
        state.toasts.forEach((toastItem) => addRemoveTimer(toastItem.id));
      }

      return {
        ...state,
        toasts: state.toasts.map((toastItem) => {
          if (!toastId || toastItem.id === toastId) {
            return { ...toastItem, open: false };
          }
          return toastItem;
        }),
      };
    }

    case "REMOVE_TOAST": {
      if (!action.toastId) {
        return {
          ...state,
          toasts: [],
        };
      }

      return {
        ...state,
        toasts: state.toasts.filter((toastItem) => toastItem.id !== action.toastId),
      };
    }

    default:
      return state;
  }
}

function toast(toastData) {
  return createToast(toastData);
}

function useToast() {
  const [state, setState] = React.useState(stateMemory);

  React.useEffect(() => {
    listeners.push(setState);

    return () => {
      const index = listeners.indexOf(setState);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: dismissToastById,
  };
}

export { useToast };
