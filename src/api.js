import axios from "axios";

// Mapping of human-readable platform names to their corresponding IGDB platform IDs
const platformIdMapping = {
  "PC": 6,
  "PlayStation 4": 48,
  "PlayStation 5": 167,
  "Xbox One": 49,
  "Xbox Series": 169,
  "Nintendo Switch": 130,
  "Nintendo 3DS": 37,
};

// Main function to fetch games from the IGDB API based on filters
export const fetchGames = async (genre = "", platform = "", releaseDate = "", searchQuery = "") => {
  let filters = [];

  // If genre is provided, construct a filter query for IGDB using genre names
  if (genre) {
    const genreList = genre.split(",").map((g) => `"${g}"`).join(",");
    filters.push(`genres.name = (${genreList})`);
  }

  // If platform(s) are provided, map them to IGDB IDs and build filter query
  if (platform) {
    const platformIds = platform
      .split(",")
      .map((p) => platformIdMapping[p.trim()]) // Convert each platform name to its corresponding ID
      .filter(Boolean) // Remove any undefined or invalid mappings
      .join(",");

    if (platformIds.length > 0) {
      filters.push(`platforms.id = (${platformIds})`);
    }
  }

  // If release year is specified, convert it to a UNIX timestamp and filter games released after that
  if (releaseDate) {
    const start = new Date(`${releaseDate}-01-01`).getTime() / 1000; // Start of the year
    filters.push(`release_dates.date >= ${start}`);
  }

  // If a search query is entered, use fuzzy matching on the game's name
  if (searchQuery) {
    filters.push(`name ~ *"${searchQuery}"*`);
  }

  // Construct final IGDB query string with optional filters
  const query = `
    fields name, summary, cover.url, platforms.name, release_dates.date, genres.name, keywords.name;
    sort release_dates.date desc;
    ${filters.length > 0 ? `where ${filters.join(" & ")};` : ""}
    limit 20;
  `;

  try {
    // Send a POST request to the IGDB API endpoint using a proxy (thingproxy) to bypass CORS
    const response = await axios.post(
      "https://thingproxy.freeboard.io/fetch/https://api.igdb.com/v4/games",
      query,
      {
        headers: {
          "Client-ID": "dx6f0y4a58zxqjdyot9j5wbb0tpqh2", // Your IGDB client ID
          Authorization: "Bearer ve1gaiv6aa86dlu06mf3o7wd2pwm7x", // Your IGDB access token
          "Content-Type": "text/plain",
        },
      }
    );

    // Format and normalize the returned game data
    const games = response.data.map((game) => {
      const releaseDate = game.release_dates?.[0]?.date;

      return {
        id: game.id,
        name: game.name,
        summary: game.summary,
        cover: game.cover ? game.cover.url : null,
        release_date: releaseDate
          ? new Date(releaseDate * 1000).toLocaleDateString()
          : "Not Available",
        genre: game.genres?.map((g) => g.name).join(", ") || "Not Available",
        platforms: game.platforms?.map((p) => p.name).join(", ") || "Not Available",
        keywords: game.keywords?.map((k) => k.name) || [], // Additional keyword info
        genreArray: game.genres?.map((g) => g.name) || [], // Used for match scoring later
        keywordArray: game.keywords?.map((k) => k.name) || [], // Also used for filtering/scoring
      };
    });

    return games; // Return processed game list
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return []; // Fallback if request fails
  }
};
