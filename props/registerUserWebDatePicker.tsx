import React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface WebDatePickerProps {
  label: string;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
}

const WebDatePicker: React.FC<WebDatePickerProps> = ({
  label,
  selectedDate,
  setSelectedDate,
}) => {
  return (
    <div className="mb-5 bg-white p-4 rounded-2xl shadow-sm">
      <label className="text-gray-700 mb-2 font-medium block">{label}</label>
      <ReactDatePicker
        selected={selectedDate}
        onChange={(date) => setSelectedDate(date)}
        dateFormat="dd/MM/yyyy"
        placeholderText={`Select ${label}`}
        className="border border-gray-300 rounded-xl px-3 py-2 w-full"
        readOnly
        showPopperArrow={false}
      />
    </div>
  );
};

export default WebDatePicker;
