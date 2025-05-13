import { useSignal } from "@preact/signals-react";
import { useEffect } from "react";

export function useSyncedSignal(externalSignal) {
  const localSignal = useSignal(externalSignal.value);

  useEffect(() => {
    localSignal.value = externalSignal.value;
  }, [externalSignal.value]);

  return localSignal;
}
