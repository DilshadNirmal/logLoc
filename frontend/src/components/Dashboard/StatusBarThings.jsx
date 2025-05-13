import { useSignals } from "@preact/signals-react/runtime";

const StatusBarThings = ({ data, side }) => {
  useSignals();
  return (
    <div className="flex flex-col sm:flex-row gap-2 md:gap-1 2xl:gap-2 mx-2 md:mx-1 2xl:mx-2 items-center">
      <div className="flex gap-1">
        <p className="text-sm md:text-[8px] lg:text-[10px] 2xl:text-sm">
          Active:{" "}
          <span className="text-primary font-medium text-sm md:text-[9px] lg:text-[10px] 2xl:text-base ml-1">
            {side === "A"
              ? Object.entries(data.value.voltages).filter(
                  ([key, value]) =>
                    parseInt(key.slice(1)) <= 20 && value !== undefined
                ).length
              : Object.entries(data.value.voltages).filter(
                  ([key, value]) =>
                    parseInt(key.slice(1)) > 20 && value !== undefined
                ).length}
          </span>{" "}
        </p>
        <p className="text-sm md:text-[8px] lg:text-[10px] 2xl:text-sm">
          Inactive:{" "}
          <span className="text-primary font-medium text-sm md:text-[9px] lg:text-[10px] 2xl:text-base ml-1">
            {side === "A"
              ? Object.entries(data.value.voltages).filter(
                  ([key, value]) =>
                    parseInt(key.slice(1)) <= 20 && value === undefined
                ).length
              : Object.entries(data.value.voltages).filter(
                  ([key, value]) =>
                    parseInt(key.slice(1)) > 20 && value === undefined
                ).length}
          </span>{" "}
        </p>
      </div>
      <p className="text-sm md:text-[8px] lg:text-[10px] 2xl:text-sm">
        Lt.Upd:{" "}
        <span className="text-primary font-medium text-sm md:text-[8px] lg:text-[10px] 2xl:text-base ml-1">
          {data.value.timestamp?.toLocaleString() || "--:--:--"}
        </span>{" "}
      </p>
    </div>
  );
};

export default StatusBarThings;
