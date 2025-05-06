const SensorCheckbox = ({ sensorId, isChecked, onChange }) => (
  <label className="container relative flex items-center gap-1 md:gap-0.5 2xl:gap-1 cursor-pointer select-none text-text text-[10px] md:text-[8px] 2xl:text-[10px] pl-4 md:pl-2 2xl:pl-4">
    <input
      type="checkbox"
      checked={isChecked}
      onChange={onChange}
      className="absolute opacity-0 cursor-pointer h-0 w-0"
    />
    <span className="checkmark absolute left-0 top-1/2 -translate-y-1/2 h-3 w-3 md:h-1.5 md:w-1.5 bg-text/20 rounded transition-colors duration-200 hover:bg-text/30 peer-checked:bg-primary peer-checked:before:block"></span>
    <span>S{sensorId}</span>
  </label>
);

export default SensorCheckbox;
