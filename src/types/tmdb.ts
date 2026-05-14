export type MediaType = "movie" | "tv";

export type Production = {
  id: number;
  type: MediaType;
  title: string;
  posterPath: string | null;
  year?: string;
};

export type PersonSearchResult = {
  id: number;
  name: string;
  profilePath: string | null;
  knownFor: string;
};

export type DiscoverMovieRaw = {
  page: number;
  total_pages: number;
  total_results: number;
  results: {
    id: number;
    title: string;
    poster_path: string | null;
    release_date?: string;
    popularity: number;
  }[];
};

export type DiscoverTvRaw = {
  page: number;
  total_pages: number;
  total_results: number;
  results: {
    id: number;
    name: string;
    poster_path: string | null;
    first_air_date?: string;
    popularity: number;
  }[];
};

export type PersonSearchRaw = {
  page: number;
  results: {
    id: number;
    name: string;
    profile_path: string | null;
    known_for_department?: string;
    known_for?: { title?: string; name?: string; media_type?: string }[];
    popularity?: number;
  }[];
};

export type CombinedCreditsRaw = {
  id: number;
  cast: {
    id: number; // production id
    media_type: "movie" | "tv";
    title?: string;
    name?: string;
    character?: string;
  }[];
  crew: unknown[];
};

export type PersonDetailRaw = {
  id: number;
  name: string;
};
