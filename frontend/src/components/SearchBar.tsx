import { ArrowRight, Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';

interface SearchBarProps {
  initialValue?: string;
  onSearch: (query: string) => void;
}

export function SearchBar({ initialValue = '', onSearch }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(query.trim());
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <label className="search-input-wrap">
        <Search size={20} aria-hidden="true" />
        <span className="sr-only">Nombre del hotel o ubicación</span>
        <input
          name="query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Busca un hotel, ciudad o municipio"
          autoComplete="off"
        />
      </label>
      <button className="button button-accent" type="submit">
        Buscar <ArrowRight size={16} aria-hidden="true" />
      </button>
    </form>
  );
}
