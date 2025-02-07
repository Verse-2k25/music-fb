import { useContext } from 'react';
import { PlayerContext } from './PlayerContext.tsx'; // Assuming you will create a context for the player

export const useSpotifyPlayer = () => {
    const { player } = useContext(PlayerContext);
    return player;
};