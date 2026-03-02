import React, { Component } from "react";
import { Search } from "lucide-react";
import "./ShowcaseComponents.css";

// Props contract: parent provides value + onChange; SearchBar stays declarative and reusable.
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
        <label htmlFor="component-search" className="sr-only">
          Search components
        </label>
        <Search className="search-bar-icon" />
        <input
          id="component-search"
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
