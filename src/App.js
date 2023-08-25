import { useState, useMemo, useEffect } from 'react';
import {
    fetchAllPokemon,
    fetchPokemonDetailsByName,
    fetchEvolutionChainById,
    fetchPokemonSpeciesByName,
} from './api';

function App() {
    const [pokemon, setPokemon] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [pokemonDetails, setPokemonDetails] = useState();
    const [isLoading, setIsLoading] = useState(false);

    // fetch initial list of all pokemon only once
    useEffect(() => {
        const fetchPokemon = async () => {
            setIsLoading(true);
            const { results: pokemonList } = await fetchAllPokemon();

            setPokemon(pokemonList);
        };

        fetchPokemon().finally(() => setIsLoading(false));
    }, []);

    const pokemonList = useMemo(() => {
        if (searchValue && pokemon.length) {
            return pokemon.filter(({ name }) => name.includes(searchValue.toLowerCase()));
        }

        return pokemon;
    }, [searchValue, pokemon]);

    const onSearchValueChange = (event) => {
        const value = event.target.value;
        setSearchValue(value);
    };

    const getPokemonEvolutions = async (evolutionChainId) => {
        const { chain } = await fetchEvolutionChainById(evolutionChainId);
        const evolutionNames = [];

        //recursively add evolution names to array
        const compileEvolutionNames = (pokemonEvolutionChain, isFirstEvolution = true) => {
            if (pokemonEvolutionChain.species && isFirstEvolution) {
                evolutionNames.push(pokemonEvolutionChain.species.name);
            }

            if (pokemonEvolutionChain.evolves_to.length) {
                const evolution = pokemonEvolutionChain.evolves_to[0];
                evolutionNames.push(evolution.species.name);

                if (evolution.evolves_to.length) {
                    compileEvolutionNames(evolution, false);
                }
            }
        };

        compileEvolutionNames(chain);

        return evolutionNames;
    };

    const fetchPokemonInfo = async (name) => {
        const { moves, types, name: pokemonName } = await fetchPokemonDetailsByName(name);
        const { evolution_chain } = await fetchPokemonSpeciesByName(pokemonName);
        //have to get evolution chain id off of url as api doesn't have a property for it as far as I can find
        const evolutionChainSplitUrl = evolution_chain.url.slice(0, -1).split('/');
        const evolutionChainId = evolutionChainSplitUrl[evolutionChainSplitUrl.length - 1];
        const evolutions = await getPokemonEvolutions(evolutionChainId);

        return {
            evolutions,
            pokemonName,
            moves: moves.map(({ move }) => move.name),
            types: types.map(({ type }) => type.name),
        };
    };

    const onGetDetails = (name) => async () => {
        setPokemonDetails(null);

        const { evolutions, pokemonName, moves, types } = await fetchPokemonInfo(name);

        setPokemonDetails({
            evolutions,
            pokemonName,
            moves,
            types,
        });
    };

    const renderPokemonStats = (pokedexColumnType) => {
        const columnTypeMap = {
            types: {
                title: 'Types',
                statList: pokemonDetails[pokedexColumnType],
            },
            moves: {
                title: 'Moves',
                statList: pokemonDetails[pokedexColumnType],
            },
        };

        const { title, statList } = columnTypeMap[pokedexColumnType];

        return (
            <div>
                <p className='bold'>{title}</p>
                <ul className='pokedex__types-moves-list-container'>
                    {statList.map((pokemonStat) => {
                        return <li key={pokemonStat}>{pokemonStat}</li>;
                    })}
                </ul>
            </div>
        );
    };

    return (
        <div className={'pokedex__container'}>
            <div className={'pokedex__search-input'}>
                <input value={searchValue} onChange={onSearchValueChange} placeholder={'Search Pokemon'} />
            </div>
            <div className={'pokedex__content'}>
                {pokemonList.length > 0 ? (
                    <div className={'pokedex__search-results'}>
                        {pokemonList.map((monster) => {
                            return (
                                <div className={'pokedex__list-item'} key={monster.name}>
                                    <div>{monster.name}</div>
                                    <button onClick={onGetDetails(monster.name)}>Get Details</button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p>{isLoading ? 'Loading...' : 'No Results Found'}</p>
                )}
                {pokemonDetails && (
                    <div className={'pokedex__details'}>
                        <p className='bold'>{pokemonDetails.pokemonName}</p>
                        <div className={'pokedex__types-moves'}>
                            {renderPokemonStats('types')}
                            {renderPokemonStats('moves')}
                        </div>
                        <p className='bold'>Evolutions</p>
                        <div className='pokedex__evolution-list'>
                            {pokemonDetails.evolutions.map((evolutionName) => (
                                <p key={evolutionName}>{evolutionName}</p>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
