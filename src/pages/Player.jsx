import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';

export default function Player() {
    const { type, id } = useParams();
    const location = useLocation();
    const [totalEpisodes, setTotalEpisodes] = useState(0);
    const [totalSeasons, setTotalSeasons] = useState(0);
    const [season, setSeason] = useState(null);
    const [episode, setEpisode] = useState(null);
    const [selectedServer, setSelectedServer] = useState('PRO');

    const apiKey = import.meta.env.VITE_API_KEY;

    const serverURLs = {
    };

    const getServerURL = () => {
        let url = serverURLs[selectedServer];
        if (type === 'tv' && season && episode) {
            if (selectedServer === 'MULTI' || selectedServer === 'TWO') {
                url += `&s=${season}&e=${episode}`;
            } else if (selectedServer === 'BINGE' || selectedServer === 'SS') {
                url += `?s=${season}&e=${episode}`;
            } else if (selectedServer === 'CLUB') {
                url += `-${season}-${episode}`;
            } else {
                url += `/${season}/${episode}`;
            }
        }
        if (selectedServer === 'PRO') {
            url += '?&autoplay=1&theme=ff2222';
        }
        return url;
    };

    useEffect(() => {
        const pathSegments = location.pathname.split('/');
        const seasonParam = pathSegments[4];
        const episodeParam = pathSegments[5];

        setSeason(seasonParam ? parseInt(seasonParam, 10) : null);
        setEpisode(episodeParam ? parseInt(episodeParam, 10) : null);

        const fetchData = async () => {
            try {
                const response = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}`);
                const data = await response.json();

                if (type === 'tv') {
                    setTotalSeasons(data.number_of_seasons);

                    if (seasonParam && episodeParam) {
                        const seasonResponse = await fetch(`https://api.themoviedb.org/3/${type}/${id}/season/${seasonParam}?api_key=${apiKey}`);
                        const seasonData = await seasonResponse.json();
                        setTotalEpisodes(seasonData.episodes.length);

                        const continueWatchingItem = {
                            id: id,
                            item: data,
                            season: parseInt(seasonParam, 10),
                            episode: parseInt(episodeParam, 10),
                            type: type
                        };
                        updateContinueWatching(continueWatchingItem);
                    }
                } else {
                    const continueWatchingItem = {
                        id: id,
                        item: data,
                        type: type
                    };
                    updateContinueWatching(continueWatchingItem);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [id, type, location.pathname, apiKey]);

    const updateContinueWatching = (item) => {
        let continueWatching = [];
        try {
            continueWatching = JSON.parse(localStorage.getItem('continueWatching')) || [];
        } catch (e) {
            console.error('Error parsing continueWatching from localStorage:', e);
            continueWatching = [];
        }

        if (!Array.isArray(continueWatching)) {
            continueWatching = [];
        }

        continueWatching = continueWatching.filter(watch => watch.id !== item.id);
        continueWatching.unshift(item);

        if (continueWatching.length > 10) {
            continueWatching = continueWatching.slice(0, 10);
        }

        localStorage.setItem('continueWatching', JSON.stringify(continueWatching));
    };

    const nextEpisode = episode ? episode + 1 : null;
    const nextSeason = season ? season + 1 : null;

    const nextEpisodeLink = episode && season
        ? nextEpisode > totalEpisodes
            ? nextSeason > totalSeasons
                ? `/info/${type}/${id}`
                : `/watch/${type}/${id}/${nextSeason}/1`
            : `/watch/${type}/${id}/${season}/${nextEpisode}`
        : `/info/${type}/${id}`;

    return (
        <>
            <div id="iframe-container">
                <iframe 
                    src={getServerURL()} 
                    allowFullScreen={true}
                    style={{ width: "100%", height: "100%", border: '0' }}
                ></iframe>
            </div>
            <div id="button-grid">
                <Link to={`/info/${type}/${id}`} id="player-button"><i className="fa-solid fa-arrow-left" alt="Back" style={{fontSize: "26px"}} /></Link>
                
                <div id="player-button-grid">
                    <select 
                        name="servers" 
                        value={selectedServer} 
                        onChange={(e) => setSelectedServer(e.target.value)} 
                        id="server-select"
                    >
                        <option value="PRO">NETFLIX</option>
                        <option value="TO">APPLE TV</option>
                        <option value="MULTI">HOTSTAR</option>
                        <option value="CLUB">AMAZON PRIME</option>
                    </select>
                    {type === 'tv' && season && episode && (
                        <Link to={nextEpisodeLink} id="player-button"><i className="fa-solid fa-arrow-right" style={{fontSize: "26px"}} alt="Next" /></Link>
                    )}
                </div>
            </div>
        </>
    );
}