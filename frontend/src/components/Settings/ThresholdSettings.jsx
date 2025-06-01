import React from "react";
import InputBox from "../form/InputBox";
import { thresholdValues } from "../../signals/voltage";

const ThresholdSettings = () => {
  return (
    <div className="p-4 pt-12 md:pt-6 2xl:pt-12 bg-primary/25 rounded-lg shadow-lg h-full">
      <h2 className="text-xl md:text-lg 2xl:text-xl font-semibold tracking-wider text-text mb-6 md:mb-4 2xl:mb-6">
        Customize Values by colours - for Dashboard visuals
      </h2>
      <div className=" bg-background rounded-md h-[80%] p-6 mt-10">
        <div className="flex items-center justify-around h-full">
          <div className="flex flex-col items-center justify-around w-[40%] h-[60%]">
            <InputBox
              htmlFor={"max"}
              type={"number"}
              name={"max"}
              id={"max_value"}
              labelName={"Max Value"}
              signalObject={thresholdValues}
              signalProperty={"max"}
              labelClassName={
                "text-text/75 font-medium text-base tracking-wide w-fit"
              }
              inputClassName={`bg-primary/25 text-text/85 p-2 rounded inset-shadow-sm/50 inset-shadow-primary/35 w-80 md:w-40 2xl:w-80 h-12 outline-none`}
              className={`flex items-center w-full justify-between mb-4`}
            />
            <InputBox
              htmlFor={"min"}
              type={"number"}
              name={"min"}
              id={"min_value"}
              labelName={"Min Value"}
              signalObject={thresholdValues}
              signalProperty={"min"}
              labelClassName={
                "text-text/75 font-medium text-base tracking-wide w-fit"
              }
              inputClassName={`bg-primary/25 text-text/85 p-2 rounded inset-shadow-sm/50 inset-shadow-primary/35 w-80 md:w-40 2xl:w-80 h-12 outline-none`}
              className={`flex items-center w-full justify-between mb-4`}
            />

            <div className="flex justify-center mt-8">
              <button
                className="px-6 py-2 bg-primary text-text rounded hover:bg-primary/80"
                onClick={() => {
                  thresholdValues.value.min = parseInt(
                    document.getElementById("min_value").value
                  );
                  thresholdValues.value.max = parseInt(
                    document.getElementById("max_value").value
                  );
                }}
              >
                Set Value
              </button>
            </div>
          </div>
          <div className="w-1 h-[300px] bg-primary/35 rounded-lg mx-8" />
          <div className="w-5/12 h-full grid grid-cols-3">
            <div className="flex flex-col items-center justify-center gap-12">
              <span className="w-20 h-9 bg-green-500 rounded"></span>
              <span className="w-20 h-9 bg-yellow-500 rounded"></span>
              <span className="w-20 h-9 bg-red-500 rounded"></span>
            </div>
            <div className="flex flex-col items-center justify-center gap-12">
              <span className="text-text h-9">
                {" "}
                {`< ${thresholdValues.value.min} mv`}
              </span>
              <span className="text-text h-9">{`${thresholdValues.value.min} mv - ${thresholdValues.value.max} mv`}</span>
              <span className="text-text h-9">{`> ${thresholdValues.value.max} mv`}</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-12">
              <span className="text-text h-9">Low</span>
              <span className="text-text h-9">Medium</span>
              <span className="text-text h-9">High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThresholdSettings;
