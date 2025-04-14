import React, { useState, useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@supabase/supabase-js";
import { fetchGames } from "./api";
import "./App.css";

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_ANON_KEY
);

const App = () => {
  // State to track the currently authenticated user
  const [user, setUser] = useState(null);

  // User's preference form data
  const [formData, setFormData] = useState({
    platforms: [],
    genres: [],
    releaseDate: "",
  });

  // Game recommendations and loading state
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);

  // User's saved preferences from the database
  const [userPreferences, setUserPreferences] = useState(null);

  // Search-specific filters and query
  const [searchFilters, setSearchFilters] = useState({
    genres: [],
    platforms: [],
    releaseYear: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Games returned from the search
  const [searchResults, setSearchResults] = useState([]);

  // Available filter options
  const genres = ["RPG", "Puzzle", "Action", "Adventure", "Shooter", "Racing", "FPS", "Fighting", "Battle Royale", "Survival", "Simulation"];
  const platforms = ["PC", "PS4", "PS5", "Xbox One", "Xbox Series", "Nintendo Switch", "Nintendo"];
  const releaseYears = ["2025", "2024", "2023", "2022"];

  // Runs once on component mount
  useEffect(() => {
    const checkSession = async () => {
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) fetchUserPreferences(session.user.id);
    };

    checkSession();

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) fetchUserPreferences(session.user.id);
    });

    // Cleanup the subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  // Fetches stored user preferences from Supabase
  const fetchUserPreferences = async (userId) => {
    const { data, error } = await supabase
      .from("game_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Handle errors (ignore "no rows" error)
    if (error && error.code !== "PGRST116") {
      console.error("Error fetching preferences:", error.message);
    } else if (data) {
      setUserPreferences(data);
      // Set form data using saved preferences
      setFormData({
        platforms: data.platforms ? data.platforms.split(",") : [],
        genres: data.genres ? data.genres.split(",") : [],
        releaseDate: data.release_date || "",
      });
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // Reset form state
    setFormData({ platforms: [], genres: [], releaseDate: "" });
  };

  // Handles checkbox changes for both preferences and search filters
  const handleCheckboxChange = (e, context = "form") => {
    const { name, value, checked } = e.target;
    const targetState = context === "form" ? formData : searchFilters;
    const updateFunc = context === "form" ? setFormData : setSearchFilters;

    // Add or remove value from the corresponding array
    updateFunc((prev) => {
      const updatedArray = checked
        ? [...prev[name], value]
        : prev[name].filter((item) => item !== value);
      return { ...prev, [name]: updatedArray };
    });
  };

  // Submit handler to fetch recommended games based on preferences
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call backend API with selected filters
      const data = await fetchGames(
        formData.genres.join(","),
        formData.platforms.join(","),
        formData.releaseDate
      );

      // Calculate match percentage for each game
      const updatedData = data.map((game) => {
        const genreMatchCount = game.genreArray
          ? game.genreArray.filter((genre) => formData.genres.includes(genre)).length
          : 0;
        const platformMatchCount = game.platforms
          ? game.platforms.split(",").filter((platform) => formData.platforms.includes(platform)).length
          : 0;

        // Genre and platform each contribute 50% to the match score
        const genreMatchPercentage = genreMatchCount ? (genreMatchCount / formData.genres.length) * 50 : 0;
        const platformMatchPercentage = platformMatchCount ? (platformMatchCount / formData.platforms.length) * 50 : 0;

        const totalMatchPercentage = genreMatchPercentage + platformMatchPercentage;

        return {
          ...game,
          matchPercentage: totalMatchPercentage.toFixed(2),
        };
      });

      setGames(updatedData);
    } catch (error) {
      console.error("Error fetching games:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Saves user preferences to Supabase
  const handleSavePreferences = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to save preferences!");
      return;
    }

    setLoading(true);
    try {
      // Upsert preferences based on user_id
      const { error } = await supabase
        .from("game_preferences")
        .upsert([{
          user_id: user.id,
          platforms: formData.platforms.join(","),
          genres: formData.genres.join(","),
          release_date: formData.releaseDate,
        }], { onConflict: ["user_id"] });

      if (error) throw error;
      alert("Preferences saved successfully!");
    } catch (error) {
      console.error("Error saving preferences:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Searches games with filters and query
  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await fetchGames(
        searchFilters.genres.join(","),
        searchFilters.platforms.join(","),
        searchFilters.releaseYear,
        searchQuery
      );

      // Add match percentage to search results
      const updatedData = data.map((game) => {
        const genreMatchCount = game.genreArray
          ? game.genreArray.filter((genre) => searchFilters.genres.includes(genre)).length
          : 0;

        const platformMatchCount = game.platforms
          ? game.platforms.split(",").filter((platform) => searchFilters.platforms.includes(platform)).length
          : 0;

        const genreMatchPercentage = genreMatchCount ? (genreMatchCount / searchFilters.genres.length) * 50 : 0;
        const platformMatchPercentage = platformMatchCount ? (platformMatchCount / searchFilters.platforms.length) * 50 : 0;

        const totalMatchPercentage = genreMatchPercentage + platformMatchPercentage;

        return {
          ...game,
          matchPercentage: totalMatchPercentage.toFixed(2),
        };
      });

      setSearchResults(updatedData);
    } catch (error) {
      console.error("Search error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sorting helpers for recommendation and search result lists
  const sortGamesByMatchPercentage = () => {
    const sortedGames = [...games].sort((a, b) => b.matchPercentage - a.matchPercentage);
    setGames(sortedGames);
  };

  const sortSearchResultsByMatchPercentage = () => {
    const sortedSearchResults = [...searchResults].sort((a, b) => b.matchPercentage - a.matchPercentage);
    setSearchResults(sortedSearchResults);
  };

  // JSX UI starts here
  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome, {user ? user.email : "Guest"}!</h1>

      {/* Authentication Section */}
      {!user ? (
        <div>
          <h2>Please Log In</h2>
          <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
        </div>
      ) : (
        <div>
          {/* Logged in view */}
          <button onClick={handleLogout} className="logout-button">Logout</button>

          {/* Preferences Form */}
          <div>
            <h2>Game Preferences</h2>
            <form onSubmit={handleSubmit}>
              {/* Platform checkboxes */}
              <div className="form-group">
                <label>Platform:</label>
                {platforms.map((platform) => (
                  <label key={platform} className="checkbox-label">
                    <input
                      type="checkbox"
                      name="platforms"
                      value={platform}
                      checked={formData.platforms.includes(platform)}
                      onChange={(e) => handleCheckboxChange(e, "form")}
                    />
                    {platform}
                  </label>
                ))}
              </div>

              {/* Genre checkboxes */}
              <div className="form-group">
                <label>Genre:</label>
                {genres.map((genre) => (
                  <label key={genre} className="checkbox-label">
                    <input
                      type="checkbox"
                      name="genres"
                      value={genre}
                      checked={formData.genres.includes(genre)}
                      onChange={(e) => handleCheckboxChange(e, "form")}
                    />
                    {genre}
                  </label>
                ))}
              </div>

              {/* Release year dropdown */}
              <div className="form-group">
                <label htmlFor="releaseDate">Release Year:</label>
                <select
                  id="releaseDate"
                  name="releaseDate"
                  value={formData.releaseDate}
                  onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                >
                  <option value="">Select a year</option>
                  {releaseYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="submit-button">Fetch Games</button>
              <button onClick={handleSavePreferences} className="save-button">Save Preferences</button>
            </form>
          </div>

          {/* Recommended Games Section */}
          <div>
            <h2>Recommended Games</h2>
            <button onClick={sortGamesByMatchPercentage} className="sort-button">
              Sort by Match Percentage (High to Low)
            </button>
            {loading ? <p>Loading...</p> : (
              <ul className="game-list">
                {games.length > 0 ? games.map((game) => (
                  <li key={game.id} className="game-item">
                    <h3>{game.name}</h3>
                    {game.cover && <img src={game.cover} alt={game.name} />}
                    <p>{game.summary}</p>
                    <p><strong>Release Date:</strong> {game.release_date}</p>
                    <p><strong>Genre:</strong> {game.genre}</p>
                    <p><strong>Platform:</strong> {game.platforms}</p>
                    <p><strong>Match Percentage:</strong> {game.matchPercentage}%</p>
                  </li>
                )) : <p>No games found based on your preferences.</p>}
              </ul>
            )}
          </div>

          {/* Search Section */}
          <div>
            <h2>Search Games</h2>

            {/* Text search */}
            <div className="form-group">
              <label htmlFor="searchQuery">Search by Title:</label>
              <input
                type="text"
                id="searchQuery"
                placeholder="Enter game title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Genre filter */}
            <div className="form-group">
              <label>Filter by Genre:</label>
              {genres.map((genre) => (
                <label key={genre} className="checkbox-label">
                  <input
                    type="checkbox"
                    name="genres"
                    value={genre}
                    checked={searchFilters.genres.includes(genre)}
                    onChange={(e) => handleCheckboxChange(e, "search")}
                  />
                  {genre}
                </label>
              ))}
            </div>

            {/* Platform filter */}
            <div className="form-group">
              <label>Filter by Platform:</label>
              {platforms.map((platform) => (
                <label key={platform} className="checkbox-label">
                  <input
                    type="checkbox"
                    name="platforms"
                    value={platform}
                    checked={searchFilters.platforms.includes(platform)}
                    onChange={(e) => handleCheckboxChange(e, "search")}
                  />
                  {platform}
                </label>
              ))}
            </div>

            {/* Release year filter */}
            <div className="form-group">
              <label htmlFor="releaseYear">Filter by Release Year:</label>
              <select
                id="releaseYear"
                value={searchFilters.releaseYear}
                onChange={(e) => setSearchFilters({ ...searchFilters, releaseYear: e.target.value })}
              >
                <option value="">Select a year</option>
                {releaseYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <button onClick={handleSearch}>Search</button>
            <button onClick={sortSearchResultsByMatchPercentage} className="sort-button">Sort by Match Percentage (High to Low)</button>

            {/* Search Results */}
            <h3>Search Results</h3>
            {loading ? <p>Loading...</p> : (
              <ul className="game-list">
                {searchResults.length > 0 ? searchResults.map((game) => (
                  <li key={game.id} className="game-item">
                    <h3>{game.name}</h3>
                    {game.cover && <img src={game.cover} alt={game.name} />}
                    <p>{game.summary}</p>
                    <p><strong>Release Date:</strong> {game.release_date}</p>
                    <p><strong>Genre:</strong> {game.genre}</p>
                    <p><strong>Platform:</strong> {game.platforms}</p>
                    <p><strong>Match Percentage:</strong> {game.matchPercentage}%</p>
                  </li>
                )) : <p>No games found.</p>}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
