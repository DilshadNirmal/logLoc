import { useSignals } from "@preact/signals-react/runtime";
import { chartData, selectedTabSignal } from "../signals/voltage";
import TabButton from "./TabButton";
import { useEffect } from "react";

const TabGroup = ({ tabOptions, variant = "horizontal" }) => {
  useSignals();
  const handleTabClick = (tabId) => {
    selectedTabSignal.value = tabId;
    chartData.value = [];
  };

  useEffect(() => {
    const tabExists = tabOptions.some(
      (tab) => tab.id === selectedTabSignal.value
    );
    if (!tabExists && tabOptions.length > 0) {
      selectedTabSignal.value = tabOptions[0].id;
    }
  }, [tabOptions]);

  return (
    <div
      className={`${
        variant === "vertical"
          ? "grid grid-cols-2 md:flex flex-col gap-2 justify-between h-full px-4 md:p-2 2xl:p-4 py-4 md:py-2 2xl:py-8 [&>*:last-child]:col-span-2 [&>*:last-child]:md:col-auto"
          : "grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-2.5 2xl:gap-4 md:mt-1.5 mb-4 md:m-1 xl:mx-4 xl:my-4"
      } `}
    >
      {tabOptions.map((tab) => (
        <TabButton
          variant={variant}
          key={tab.id}
          isSelected={selectedTabSignal.value === tab.id}
          onClick={() => handleTabClick(tab.id)}
          icon={tab.icon}
          label={tab.label}
        />
      ))}
    </div>
  );
};

export default TabGroup;
