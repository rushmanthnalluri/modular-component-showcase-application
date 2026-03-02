import { useEffect, useRef, useState } from "react";
import { useToast } from "@/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/Toast";

function ToastTimer({ createdAt, duration, open, onExpire }) {
  const [remainingMs, setRemainingMs] = useState(duration);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    hasExpiredRef.current = false;

    const updateRemaining = () => {
      const elapsed = Date.now() - createdAt;
      const nextRemaining = Math.max(0, duration - elapsed);
      setRemainingMs(nextRemaining);

      if (nextRemaining === 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpire();
      }
    };

    updateRemaining();

    const intervalId = setInterval(updateRemaining, 100);
    return () => clearInterval(intervalId);
  }, [createdAt, duration, onExpire, open]);

  const progress = duration > 0 ? (remainingMs / duration) * 100 : 0;

  return (
    <div className="toast-timer">
      <div className="toast-timer-track">
        <div
          className="toast-timer-fill"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
}

function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        duration = 4000,
        createdAt = Date.now(),
        showTimer = true,
        ...props
      }) {
        return (
          <Toast key={id} duration={duration} {...props}>
            <div className="toast-content">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? <ToastDescription>{description}</ToastDescription> : null}
              {showTimer ? (
                <ToastTimer
                  createdAt={createdAt}
                  duration={duration}
                  open={Boolean(props.open)}
                  onExpire={() => dismiss(id)}
                />
              ) : null}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

export { Toaster };
