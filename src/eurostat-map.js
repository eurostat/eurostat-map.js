import * as mapch from './maptypes/map-choropleth';
import * as mapps from './maptypes/map-proportional-symbols';
import * as mapct from './maptypes/map-categorical';
import * as mt from './core/stat-map-template';

/**
 * Function returning a eurostat-map object.
 */
export const map = function (type) {

	//choropleth map
	if(type == "ch") return mapch.map();
	//categorical map
	if(type == "ct") return mapct.map();
	//proportionnal symbols map
	if(type == "ps") return mapps.map();

	console.log("Unexpected map type: " + type);
	return mt.mapTemplate(true);
};
