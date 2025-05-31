import InputBox from "./InputBox";
import InputCheck from "./InputCheck";
import { useSignals } from "@preact/signals-react/runtime";

const DateTimeRangePanel = ({
  mode, // interval, date, count
  dateRange,
  averageBy,
  countOptions,
  customCount,
  onPlotGraph,
}) => {
  useSignals();

  // Render different content based on mode
  const renderContent = () => {
    switch (mode.value) {
      case "interval":
        return (
          <div className="py-6">
            <h3 className="text-lg md:text-base 2xl:text-2xl text-center font-semibold tracking-wider mt-4 md:mt-2 2xl:mt-4">
              Select Time Interval
            </h3>
            <div className="mt-12 md:mt-8 2xl:mt-12 flex flex-col items-center gap-6 md:gap-4 2xl:gap-6">
              {["from", "to"].map((label) => (
                <InputBox
                  labelName={label}
                  type={"date"}
                  name={label}
                  signalObject={dateRange}
                  signalProperty={label}
                  className={`flex gap-4 md:gap-2 2xl:gap-4 items-center`}
                  labelClassName={`text-text md:text-sm font-medium tracking-wide capitalize w-14 md:w-10 2xl:w-14`}
                  inputClassName={`bg-background/65 w-full p-2 md:p-1 2xl:p-2 md:text-xs 2xl:text-sm text-text/85 outline-none border border-secondary rounded`}
                />
              ))}
            </div>

            <div className="mt-12 md:mt-8 2xl:mt-12 flex items-start justify-center">
              <div className="">
                <h3 className="font-medium tracking-wider text-sm md:text-xs 2xl:text-lg mb-6 md:mb-3 2xl:mb-6">
                  Get one data for every-
                </h3>
                <div className="flex justify-center items-center gap-8 md:gap-4 2xl:gap-8">
                  <InputCheck
                    name="averageBy"
                    value="minute"
                    signal={averageBy}
                    checkBoxValue="Minute"
                  />
                  <InputCheck
                    name="averageBy"
                    value="hour"
                    signal={averageBy}
                    checkBoxValue="Hour"
                  />
                  <InputCheck
                    name="averageBy"
                    value="day"
                    signal={averageBy}
                    checkBoxValue="Day"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "date":
        return (
          <div className="py-6">
            <h3 className="text-lg md:text-base 2xl:text-2xl text-center font-semibold tracking-wider mt-4 md:mt-2 2xl:mt-4">
              Select Date Range
            </h3>
            <div className="mt-12 md:mt-8 2xl:mt-12 flex flex-col items-center gap-6 md:gap-4 2xl:gap-6">
              <InputBox
                labelName={"from"}
                type={"date"}
                name={"from"}
                signalObject={dateRange}
                signalProperty={"from"}
                className={`flex gap-4 md:gap-2 2xl:gap-4 items-center`}
                labelClassName={`text-text md:text-sm font-medium tracking-wide capitalize w-14 md:w-10 2xl:w-14`}
                inputClassName={`bg-background/65 w-full p-2 md:p-1 2xl:p-2 md:text-xs 2xl:text-sm text-text/85 outline-none border border-secondary rounded`}
              />
              <InputBox
                labelName={"to"}
                type={"date"}
                name={"to"}
                signalObject={dateRange}
                signalProperty={"to"}
                className={`flex gap-4 md:gap-2 2xl:gap-4 items-center`}
                labelClassName={`text-text md:text-sm font-medium tracking-wide capitalize w-14 md:w-10 2xl:w-14`}
                inputClassName={`bg-background/65 w-full p-2 md:p-1 2xl:p-2 md:text-xs 2xl:text-sm text-text/85 outline-none border border-secondary rounded`}
              />
            </div>
          </div>
        );

      case "count":
        return (
          <div className="py-6">
            <h3 className="text-lg md:text-base 2xl:text-2xl text-center font-semibold tracking-wider mt-4 md:mt-2 2xl:mt-4">
              Select Count
            </h3>
            <div className="mt-12 md:mt-8 2xl:mt-12 flex flex-col items-center gap-6 md:gap-4 2xl:gap-6">
              <div className="w-full max-w-xs space-y-7 md:space-y-4 2xl:space-y-7 flex flex-col justify-center items-center">
                <InputCheck
                  name="countOption"
                  value="last100"
                  signal={countOptions}
                  checkBoxValue="Last 100 Data"
                  labelClassName={`w-6/12  md:w-8/12 2xl:w-6/12`}
                />
                <InputCheck
                  name="countOption"
                  value="last500"
                  signal={countOptions}
                  checkBoxValue="Last 500 Data"
                  labelClassName={`w-6/12  md:w-8/12 2xl:w-6/12`}
                />
                <InputCheck
                  name="countOption"
                  value="last1000"
                  signal={countOptions}
                  checkBoxValue="Last 1000 Data"
                  labelClassName={`w-6/12  md:w-8/12 2xl:w-6/12`}
                />
                <InputCheck
                  name="countOption"
                  value="custom"
                  signal={countOptions}
                  checkBoxValue="Custom Count"
                  labelClassName={`w-6/12  md:w-8/12 2xl:w-6/12`}
                />

                {countOptions.value === "custom" && (
                  <InputBox
                    labelName={"count"}
                    type={"number"}
                    name={"customCount"}
                    value={customCount.value}
                    onChange={(e) => (customCount.value = e.target.value)}
                    className={`grid place-content-center gap-3 mx-12`}
                    labelClassName={`text-text md:text-xs font-medium tracking-wide capitalize w-14 md:w-10 2xl:w-14`}
                    inputClassName={`bg-background/65 w-9/12 p-2 md:p-1 2xl:p-2 md:text-xs 2xl:text-sm text-text/85 outline-none border border-secondary rounded`}
                  />
                )}
              </div>
            </div>
          </div>
        );

      case "average":
        return (
          <div className="py-6">
            <h3 className="text-lg md:text-base 2xl:text-2xl text-center font-semibold tracking-wider mt-4 md:mt-2 2xl:mt-4">
              Average Data
            </h3>
            <div className="mt-12 md:mt-8 2xl:mt-12 flex flex-col items-center gap-6 md:gap-4 2xl:gap-6">
              <InputBox
                labelName={"from"}
                type={"date"}
                name={"from"}
                signalObject={dateRange}
                signalProperty={"from"}
                className={`flex gap-4 md:gap-2 2xl:gap-4 items-center`}
                labelClassName={`text-text md:text-sm font-medium tracking-wide capitalize w-14 md:w-10 2xl:w-14`}
                inputClassName={`bg-background/65 w-full p-2 md:p-1 2xl:p-2 md:text-xs 2xl:text-sm text-text/85 outline-none border border-secondary rounded`}
              />
              <InputBox
                labelName={"to"}
                type={"date"}
                name={"to"}
                signalObject={dateRange}
                signalProperty={"to"}
                className={`flex gap-4 md:gap-2 2xl:gap-4 items-center`}
                labelClassName={`text-text md:text-sm font-medium tracking-wide capitalize w-14 md:w-10 2xl:w-14`}
                inputClassName={`bg-background/65 w-full p-2 md:p-1 2xl:p-2 md:text-xs 2xl:text-sm text-text/85 outline-none border border-secondary rounded`}
              />
            </div>

            <div className="mt-12 md:mt-8 2xl:mt-12 flex items-start justify-center">
              <div className="">
                <h3 className="font-medium tracking-wider text-sm md:text-xs 2xl:text-lg mb-6 md:mb-3 2xl:mb-6">
                  Average by
                </h3>
                <div className="flex justify-center items-center gap-8 md:gap-4 2xl:gap-8">
                  <InputCheck
                    name="averageBy"
                    value="minute"
                    signal={averageBy}
                    checkBoxValue="Minute"
                  />
                  <InputCheck
                    name="averageBy"
                    value="hour"
                    signal={averageBy}
                    checkBoxValue="Hour"
                  />
                  <InputCheck
                    name="averageBy"
                    value="day"
                    signal={averageBy}
                    checkBoxValue="Day"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-secondary text-white flex-1 p-4 2xl:pt-12 rounded-lg">
      {renderContent()}
      <div className="flex justify-center mt-6">
        <button
          onClick={onPlotGraph}
          className="mt-4 md:mt-2 2xl:mt-4 bg-primary hover:bg-primary/80 text-white px-8 md:px-4 2xl:px-8 py-2 md:py-1 2xl:py-2 text-sm md:text-xs 2xl:text-base rounded-lg md:rounded-md 2xl:rounded-lg transition-colors"
        >
          Plot Graph
        </button>
      </div>
    </div>
  );
};

export default DateTimeRangePanel;
