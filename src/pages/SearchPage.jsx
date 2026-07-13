import BrowseBy from '../components/BrowseBy';
import SearchBar from '../components/SearchBar';
import './SearchPage.css';

export default function SearchPage() {
  function handleSearch(query) {
    if (query) {
      console.log('Search:', query);
    }
  }

  function handleBrowse(category) {
    console.log('Browse by:', category);
  }

  return (
    <div className="search-page">
      <div className="search-page__content">
        <div className="search-page__search">
          <SearchBar onSearch={handleSearch} />
          <div className="search-page__browse">
            <BrowseBy onSelect={handleBrowse} />
          </div>
        </div>
      </div>
    </div>
  );
}
