import React from "react";

const Input = ({
  label = "",
  name = "",
  type = "text",
  className = "",
  mainClassName = "",
  required = false,
  placeholder = "",
  value = "",
  onChange = () => {},
}) => {
  return (
    <div className={`${mainClassName}`}>
      <label htmlFor={name} className="block mb-2 text-sm font-medium">
        {label}
      </label>
      <input
        type={type}
        id={name}
        className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  dark:focus:ring-blue-500 dark:focus:border-blue-500 ${className}`}
        placeholder={placeholder}
        required={required}
        defaultValue={value}
        onChange={onChange}
      />
    </div>
  );
};

export default Input;
