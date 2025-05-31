import React from "react";
import UtMaps from "../../assets/images/utmaps.png";

const InfoSettings = () => {
  return (
    <div className="p-4 md:p-2 2xl:p-4 bg-primary/25 rounded-lg shadow-lg h-full flex flex-col justify-around items-center">
      <div className="h-[50%]">
        <img src={UtMaps} alt="ut maps" className="h-full" />
      </div>
      <div>
        <p className="first-letter:float-left first-letter:mr-3 first-letter:text-7xl first-letter:font-bold text-lg w-[65ch] text-justify">
          <span className="text-primary font-semibold tracking-wider">
            µTMapS
          </span>{" "}
          <code className="bg-background/30 p-1.5 px-2 text-sm rounded-md">
            &
          </code>{" "}
          <em className="text-text/80 font-bold tracking-wider">µTMapS</em> are
          IIoT-enabled temperature measurement and temperature profiling sensors
          that captures continuous measurements at multiple points with a single
          customizable waveguide with multiple configurations in contrast to
          contact based thermocouples/RTDs or contactless IR guns.
        </p>
      </div>
    </div>
  );
};

export default InfoSettings;
