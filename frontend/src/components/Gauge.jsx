import * as React from "react";
import {
  CircularGaugeComponent,
  AxesDirective,
  AxisDirective,
  Inject,
  Annotations,
  AnnotationsDirective,
  AnnotationDirective,
  PointersDirective,
  PointerDirective,
  RangesDirective,
  RangeDirective,
} from "@syncfusion/ej2-react-circulargauge";

const Gauge = ({ value, lowThreshold, highThreshold }) => {
  return (
    <CircularGaugeComponent
      // id="voltage-gauge"
      background="transparent"
      animationDuration={2000}
    >
      <Inject services={[Annotations]} />
      <AxesDirective>
        <AxisDirective
          startAngle={230}
          endAngle={130}
          radius="90%"
          minimum={0}
          maximum={500}
          majorTicks={{ width: 0, interval: 50 }}
          lineStyle={{ width: 0 }}
          minorTicks={{ width: 0 }}
          labelStyle={{
            offset: 50,
            position: "Inside",
            autoAngle: true,
            font: { fontFamily: "inherit" },
          }}
        >
          <AnnotationsDirective>
            <AnnotationDirective
              content={`<div style="font-size:18px;color:#9DD55A">${value}V</div>`}
              angle={180}
              radius="20%"
              zIndex="1"
            />
          </AnnotationsDirective>
          <PointersDirective>
            <PointerDirective
              radius="45%"
              value={value}
              pointerWidth={7}
              color="#F7B194"
              cap={{
                radius: 10,
                color: "white",
                border: { width: 4, color: "#F7B194" },
              }}
              animation={{ enable: true }}
              needleTail={{ length: "25%", color: "#F7B194" }}
            />
          </PointersDirective>
          <RangesDirective>
            <RangeDirective
              start={0}
              end={lowThreshold}
              radius="90%"
              color="#58ABD5"
              startWidth={35}
              endWidth={35}
            />
            <RangeDirective
              start={lowThreshold}
              end={highThreshold}
              radius="90%"
              color="#9DD55A"
              startWidth={35}
              endWidth={35}
            />
            <RangeDirective
              start={highThreshold}
              end={500}
              radius="90%"
              color="#F48C6F"
              startWidth={35}
              endWidth={35}
            />
          </RangesDirective>
        </AxisDirective>
      </AxesDirective>
    </CircularGaugeComponent>
  );
};

export default Gauge;
