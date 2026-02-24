import React, { Component } from "react";
import { Search } from "lucide-react";
import "./SearchBar.css";

class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    const { onChange } = this.props;
    if (onChange) onChange(event.target.value);
  }

  render() {
    const { value = "" } = this.props;

    return (
      <div className="search-bar">
        <Search className="search-bar-icon" />
        <input
          type="text"
          placeholder="Search components..."
          aria-label="Search components"
          value={value}
          onChange={this.handleChange}
          className="search-bar-input"
        />
      </div>
    );
  }
}

export default SearchBar;
