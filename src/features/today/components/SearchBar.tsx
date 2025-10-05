import React from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder, inputRef }) => {
  return (
    <label className="search-bar">
      <span className="visually-hidden">Search celebrations</span>
      <input
        ref={inputRef}
        className="search-bar__input"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
};
