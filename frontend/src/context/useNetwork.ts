import { useContext } from 'react';
import { NetworkContext } from './NetworkContext';

export const useNetwork = () => useContext(NetworkContext);
