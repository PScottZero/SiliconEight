import { Filter } from "./pixel";

const ON_KEY = "on";
const OFF_KEY = "off";
const VOLUME_KEY = "volume";
const FILTER_KEY = "filter";

export const DEFAULT_ON = "#00ffc0";
export const DEFAULT_OFF = "#041640";
export const DEFAULT_VOLUME = 5;
export const DEFAULT_FILTER = Filter.None;

export function getColorStorage(on: boolean): string {
  return getLocalStorage(on ? ON_KEY : OFF_KEY, on ? DEFAULT_ON : DEFAULT_OFF);
}

export function setColorStorage(on: boolean, value: string) {
  setLocalStorage(on ? ON_KEY : OFF_KEY, value);
}

export function getVolumeStorage(): number {
  return parseInt(getLocalStorage(VOLUME_KEY, DEFAULT_VOLUME.toString()));
}

export function setVolumeStorage(volume: number) {
  setLocalStorage(VOLUME_KEY, volume.toString());
}

export function getFilterStorage(): Filter {
  return getLocalStorage(FILTER_KEY, DEFAULT_FILTER) as Filter;
}

export function setFilterStorage(filter: Filter) {
  setLocalStorage(FILTER_KEY, filter.toString());
}

function getLocalStorage(key: string, defaultValue: string): string {
  if (localStorage.getItem(key) === undefined) {
    localStorage.setItem(key, defaultValue);
  }
  return localStorage.getItem(key) ?? defaultValue;
}

function setLocalStorage(key: string, value: string) {
  localStorage.setItem(key, value);
}
