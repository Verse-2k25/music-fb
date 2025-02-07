import React, { useState } from 'react';

interface SearchProps {
    token: string;
    playTrack: (uri: string) => void;
    setTracks: (tracks: any[]) => void; // Function to set the tracks
}

const Search: React.FC<SearchProps> = ({ token, playTrack, setTracks }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    const fetchResults = async () => {
        if (!query) return;

        try {
            const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            const newTracks = data.tracks.items.slice(0, 10); // Get top 10 tracks
            setResults(newTracks);
            setTracks(newTracks); // Send top tracks to the WebPlayback component
            if (newTracks.length > 0) {
                playTrack(newTracks[0].uri); // Automatically play the first track
            }
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    };

    const handleSearch = async (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            await fetchResults(); // Fetch results on pressing Enter
        }
    };

    const handleSubmit = async () => {
        await fetchResults(); // Fetch results when submit button is clicked
    };

    return (
        <div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleSearch}
                placeholder="Search for a song, album, or artist"
            />
            <button onClick={handleSubmit}>Submit</button> {/* Submit Button */}
        </div>
    );
};

export default Search;
