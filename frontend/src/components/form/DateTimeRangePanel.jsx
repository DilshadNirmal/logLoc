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
          <>
            <h3 className="text-lg 2xl:text-2xl text-center font-semibold tracking-wider mt-4">
              Select Time Interval
            </h3>
            <div className="mt-12 flex flex-col items-center gap-6">
              {["from", "to"].map((label) => (
                <InputBox
                  labelName={label}
                  type={"date"}
                  name={label}
                  signalObject={dateRange}
                  signalProperty={label}
                  className={`flex gap-4 items-center`}
                  labelClassName={`text-text font-medium tracking-wide capitalize w-14`}
                  inputClassName={`bg-background/65 w-full p-2 text-text/85 outline-none border border-secondary rounded`}
                />
              ))}
            </div>

            <div className="mt-12 flex items-start justify-center">
              <div className="">
                <h3 className="font-medium tracking-wider text-sm 2xl:text-lg mb-6">
                  Get one data for every-
                </h3>
                <div className="flex justify-center items-center gap-8">
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
          </>
        );

      case "date":
        return (
          <>
            <h3 className="text-lg 2xl:text-2xl text-center font-semibold tracking-wider mt-4">
              Select Date Range
            </h3>
            <div className="mt-8 flex flex-col items-center gap-6">
              <InputBox
                labelName={"from"}
                type={"date"}
                name={"from"}
                signalObject={dateRange}
                signalProperty={"from"}
                className={`flex gap-4 items-center`}
                labelClassName={`text-text font-medium tracking-wide capitalize w-14`}
                inputClassName={`bg-background/65 w-full p-2 text-text/85 outline-none border border-secondary rounded`}
              />
              <InputBox
                labelName={"to"}
                type={"date"}
                name={"to"}
                signalObject={dateRange}
                signalProperty={"to"}
                className={`flex gap-4 items-center`}
                labelClassName={`text-text font-medium tracking-wide capitalize w-14`}
                inputClassName={`bg-background/65 w-full p-2 text-text/85 outline-none border border-secondary rounded`}
              />
            </div>
          </>
        );

      case "count":
        return (
          <>
            <h3 className="text-lg 2xl:text-2xl text-center font-semibold tracking-wider mt-4">
              Select Count
            </h3>
            <div className="mt-12 flex flex-col items-center  gap-6">
              <div className="w-full max-w-xs space-y-7 flex flex-col justify-center items-center">
                <InputCheck
                  name="countOption"
                  value="last100"
                  signal={countOptions}
                  checkBoxValue="Last 100 Data"
                  labelClassName={`w-6/12`}
                />
                <InputCheck
                  name="countOption"
                  value="last500"
                  signal={countOptions}
                  checkBoxValue="Last 500 Data"
                  labelClassName={`w-6/12`}
                />
                <InputCheck
                  name="countOption"
                  value="last1000"
                  signal={countOptions}
                  checkBoxValue="Last 1000 Data"
                  labelClassName={`w-6/12`}
                />
                <InputCheck
                  name="countOption"
                  value="custom"
                  signal={countOptions}
                  checkBoxValue="Custom Count"
                  labelClassName={`w-6/12`}
                />

                {countOptions.value === "custom" && (
                  <InputBox
                    labelName={"count"}
                    type={"number"}
                    name={"customCount"}
                    value={customCount.value}
                    onChange={(e) => (customCount.value = e.target.value)}
                    className={`flex gap-4 items-center mt-2`}
                    labelClassName={`text-text font-medium tracking-wide capitalize w-14`}
                    inputClassName={`bg-background/65 w-full p-2 text-text/85 outline-none border border-secondary rounded`}
                  />
                )}
              </div>
            </div>
          </>
        );

      case "average":
        return (
          <>
            <h3 className="text-lg 2xl:text-2xl text-center font-semibold tracking-wider mt-4">
              Average Data
            </h3>
            <div className="mt-12 flex flex-col items-center gap-6">
              <InputBox
                labelName={"from"}
                type={"date"}
                name={"from"}
                signalObject={dateRange}
                signalProperty={"from"}
                className={`flex gap-4 items-center`}
                labelClassName={`text-text font-medium tracking-wide capitalize w-14`}
                inputClassName={`bg-background/65 w-full p-2 text-text/85 outline-none border border-secondary rounded`}
              />
              <InputBox
                labelName={"to"}
                type={"date"}
                name={"to"}
                signalObject={dateRange}
                signalProperty={"to"}
                className={`flex gap-4 items-center`}
                labelClassName={`text-text font-medium tracking-wide capitalize w-14`}
                inputClassName={`bg-background/65 w-full p-2 text-text/85 outline-none border border-secondary rounded`}
              />
            </div>

            <div className="mt-12 flex items-start justify-center">
              <div className="">
                <h3 className="font-medium tracking-wider text-sm 2xl:text-lg mb-6">
                  Average by
                </h3>
                <div className="flex justify-center items-center gap-8">
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
          </>
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
          className="mt-4 bg-primary hover:bg-primary/80 text-white px-8 py-2 rounded-lg transition-colors"
        >
          Plot Graph
        </button>
      </div>
    </div>
  );
};

export default DateTimeRangePanel;
