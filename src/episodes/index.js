import {createEpisodeRegistry} from './registry.js';
import {BURIED_NETWORK} from './buried-network.js';
import {SYNTHETIC_CITY} from './synthetic-city.js';
import {BLACK_FREQUENCY} from './black-frequency.js';

export const EPISODES = createEpisodeRegistry([BURIED_NETWORK,SYNTHETIC_CITY,BLACK_FREQUENCY]);
