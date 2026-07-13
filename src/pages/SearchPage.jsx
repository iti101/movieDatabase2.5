import SearchBar from '../components/SearchBar';
import './SearchPage.css';

export default function SearchPage() {
  function handleSearch(query) {
    if (query) {
      console.log('Search:', query);
    }
  }

  return (
    <div className="search-page">
      <div className="search-page__content">
        <SearchBar onSearch={handleSearch} />
      </div>
    </div>
  );
}
