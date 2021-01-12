import * as mapch from './maptypes/map-choropleth';
import * as mapps from './maptypes/map-proportional-symbols';
import * as mapct from './maptypes/map-categorical';
import * as mapvba from './maptypes/map-value-by-alpha';
import * as mt from './core/stat-map';

/**
 * Function returning a eurostat-map object.
 * 
 * @param {*} type The type of map ('ch' for choropleth, etc.)
 * @param {*} config The configuration object. Ex.: { title: "Map title", geoCenter: [233,654], ...}
 */
 export const map = function (type, config) {

	//choropleth map
	if(type == "ch") return mapch.map(config);
	//categorical map
	if(type == "ct") return mapct.map(config);
	//proportionnal symbols map
	if(type == "ps") return mapps.map(config);
	//value-by-alha map
	if(type == "vba") return mapvba.map(config);
	//add new map types here
	//if(type == "XX") return mapXX.map(config);

	console.log("Unexpected map type: " + type);
	return mt.statMap(config, true);
};




// fill pattern style


/**
 * Build a fill pattern legend object { nd:"white", 0:"url(#pattern_0)", 1:"url(#pattern_1)", ... }
 */
export const getFillPatternLegend = function () {
	return function (ecl) { return "url(#pattern_" + ecl + ")"; }
}


/**
 * Return a function which builds fill patterns style.
 * The returned function has for arguments the SVG element where to use the fill pattern, and the number of classes.
 * 
 * @param {*} opts Various parameters on the fill pattern.
 */
export const getFillPatternDefinitionFun = function (opts) {
	opts = opts || {};
	opts.shape = opts.shape || "circle";
	const ps = opts.patternSize || 5;
	const smin = opts.minSize || 1;
	const smax = opts.maxSize || 5.5;
	opts.bckColor = opts.bckColor || "white";
	opts.symbColor = opts.symbColor || "black";
	return function (svg, clnb) {
		for (let i = 0; i < clnb; i++) {
			const si = smin + (smax - smin) * i / (clnb - 1);
			const patt = svg.append("pattern").attr("id", "pattern_" + i).attr("x", "0").attr("y", "0").attr("width", ps).attr("height", ps).attr("patternUnits", "userSpaceOnUse");
			patt.append("rect").attr("x", 0).attr("y", 0).attr("width", ps).attr("height", ps).style("stroke", "none").style("fill", opts.bckColor)
			if (opts.shape == "square")
				patt.append("rect").attr("x", 0).attr("y", 0).attr("width", si).attr("height", si).style("stroke", "none").style("fill", opts.symbColor)
			else
				patt.append("circle").attr("cx", ps * 0.5).attr("cy", ps * 0.5).attr("r", si * 0.5).style("stroke", "none").style("fill", opts.symbColor)
		}
	};
};

