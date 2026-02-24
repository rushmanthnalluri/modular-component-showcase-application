import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

function ToastTimer({ createdAt, duration, open }) {
  const [remainingMs, setRemainingMs] = useState(duration);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updateRemaining = () => {
      const elapsed = Date.now() - createdAt;
      setRemainingMs(Math.max(0, duration - elapsed));
    };

    updateRemaining();

    const intervalId = setInterval(updateRemaining, 100);
    return () => clearInterval(intervalId);
  }, [createdAt, duration, open]);

  const progress = duration > 0 ? (remainingMs / duration) * 100 : 0;

  return (
    <div className="mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/60 transition-[width] duration-100"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
}

function Toaster() {
  const { toasts } = useToast();

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
            <div className="grid gap-1">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? <ToastDescription>{description}</ToastDescription> : null}
              {showTimer ? (
                <ToastTimer
                  createdAt={createdAt}
                  duration={duration}
                  open={Boolean(props.open)}
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
