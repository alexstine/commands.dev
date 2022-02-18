import { connectSearchBox } from "react-instantsearch-dom";
import { Dispatch, SetStateAction } from "react";

function SearchBox({ refine }: { refine: Dispatch<SetStateAction<string>> }) {
  return (
    <input
      id="algolia_search"
      type="search"
      placeholder="Click or press 'Ctrl + K' to search"
      onChange={(e) => refine(e.currentTarget.value)}
      className="w-screen md:w-3/4 h-9 cursor-pointer border border-white/30 px-3 rounded-full text-sm focus:outline-none"
    />
  );
}

export default connectSearchBox(SearchBox);
