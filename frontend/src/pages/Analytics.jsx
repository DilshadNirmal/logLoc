import { useState, useEffect } from "react";
import { CiCalendar, CiHashtag } from "react-icons/ci";
import { TbClockCode } from "react-icons/tb";
import { LuSigma } from "react-icons/lu";

const Analytics = () => {
  const [navHeight, setNavHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [selectedTab, setSelectedTab] = useState("average");

  useEffect(() => {
    const updateDimensions = () => {
      const header = document.querySelector("header");
      if (header) setNavHeight(header.offsetHeight);
      if (window.innerWidth >= 1024) {
        setContentHeight(window.innerHeight - 100);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const tabOptions = [
    { id: "average", label: "Average Data", icon: LuSigma },
    { id: "interval", label: "Interval Data", icon: TbClockCode },
    { id: "date", label: "Date Picker", icon: CiCalendar },
    { id: "count", label: "Count-wise Data", icon: CiHashtag },
  ];

  return (
    <section
      className="bg-background min-h-screen w-full overflow-x-hidden"
      style={{ marginTop: `${navHeight}px` }}
    >
      <div
        className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{
          height: window.innerWidth >= 1024 ? `${contentHeight}px` : "auto",
        }}
      >
        <fieldset className="border border-primary/75 rounded-lg p-2 py-1 h-full">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 m-4 2xl:m-8">
            {tabOptions.map((tab) => (
              <TabButton
                key={tab.id}
                isSelected={selectedTab === tab.id}
                onClick={() => setSelectedTab(tab.id)}
                icon={tab.icon}
                label={tab.label}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  );
};

const TabButton = ({ isSelected, onClick, icon: Icon, label }) => (
  <button
    className={`flex items-center justify-center gap-3 p-3 md:p-2 lg:p-3 rounded-lg transition-all ${
      isSelected
        ? "bg-primary text-white"
        : "bg-secondary text-text hover:bg-secondary/70"
    }`}
    onClick={onClick}
  >
    <Icon className="w-5 h-5 lg:w-6 lg:h-6 2xl:w-8 2xl:h-8" />
    <span className="text-base 2xl:text-lg font-medium tracking-wide">
      {label}
    </span>
  </button>
);

export default Analytics;
