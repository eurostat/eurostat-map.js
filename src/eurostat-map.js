import * as mapch from './style/eurostat-map-choropleth';
import * as mapps from './style/eurostat-map-proportionnal-symbols';
import * as mapct from './style/eurostat-map-categorical';

/**
 * Function returning a eurostat-map object.
 */
export const map = function (type) {

	//TODO: upgrade to d3 v6?

	if(type == "ch") return mapch.map();
	if(type == "ps") return mapps.map();
	if(type == "ct") return mapct.map();

	console.log("Unexpected map type: " + type);
	//TODO: show blank template?

};
