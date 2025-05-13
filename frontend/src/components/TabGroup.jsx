import { useSignals } from "@preact/signals-react/runtime";
import { effect } from "@preact/signals-react";
import { chartData, selectedTabSignal } from "../signals/voltage";
import TabButton from "./TabButton";

const TabGroup = ({ tabOptions }) => {
  useSignals();
  const handleTabClick = (tabId) => {
    selectedTabSignal.value = tabId;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 m-4 2xl:mx-6 2xl:my-4">
      {tabOptions.map((tab) => (
        <TabButton
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
