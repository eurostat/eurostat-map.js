import { format } from "d3-format";
import { select } from "d3-selection";
import * as lg from '../core/legend';

/**
 * A legend for proportional symbol map
 * 
 * @param {*} map 
 */
export const legend = function (map, config) {

	//build generic legend object for the map
	const out = lg.legend(map);

	out.ascending = false; //the order of the legend elements. Set to false to invert.
	out.legendSpacing = 35; //spacing between color & size legends (if applicable)
	out.labelFontSize = 12; //the font size of the legend labels

	//size legend config (legend illustrating the values of different symbol sizes)
	out.sizeLegend = {
		title: null,
		titlePadding: 10,//padding between title and legend body
		cellNb: 4, //number of elements in the legend
		shapePadding: 10, //the y distance between consecutive legend shape elements
		shapeOffset:{x:0, y:0},
		shapeFill: "white",
		labelOffset: 25, //the distance between the legend box elements to the corresponding text label
		labelDecNb: 0, //the number of decimal for the legend labels
		labelFormat: undefined
	}

	// color legend config (legend illustrating the data-driven colour classes)
	out.colorLegend = {
		title: null,
		titlePadding: 10, //padding between title and legend body
		shapeWidth: 13, //the width of the legend box elements
		shapeHeight: 15, //the height of the legend box elements
		shapePadding: 1, //the distance between consecutive legend shape elements in the color legend
		labelOffset: 25, //distance (x) between label text and its corresponding shape element
		labelDecNb: 0, //the number of decimal for the legend labels
		labelFormat: undefined, // user-defined d3 format function	
		noData: true, //show no data
		noDataText: "No data", //no data text label
		sepLineLength: 17,// //the separation line length
		sepLineStroke: "black", //the separation line color
		sepLineStrokeWidth: 1, //the separation line width
	}

	//override attribute values with config values
	if (config) for (let key in config) {
		if (key == "colorLegend" || key == "sizeLegend") {
			for (let p in out[key]) {
				//override each property in size and color legend configs
				if (config[key][p]) {
					out[key][p] = config[key][p]
				}
			}
		} else {
			out[key] = config[key];
		}
	}


	//@override
	out.update = function () {
		const m = out.map;
		const lgg = out.lgg;

		//remove previous content
		lgg.selectAll("*").remove();

		//draw legend background box
		out.makeBackgroundBox();

		//set font family
		lgg.style("font-family", out.fontFamily);

		// legend for 
		if (m.classifierSize_) {
			buildSizeLegend(m, lgg, out.sizeLegend)
		}
		// legend for ps color values
		if (m.classifierColor_) {
			buildColorLegend(m, lgg, out.colorLegend)
		}

		//set legend box dimensions
		out.setBoxDimension();
	}

	/**
	 * Builds a legend which illustrates the statistical values of different pie chart sizes
	 * 
	 * @param {*} m map 
	 * @param {*} lgg parent legend object from core/legend.js 
	 * @param {*} config size legend config object (sizeLegend object specified as property of legend() config object)
	 */
	function buildSizeLegend(m, lgg, config) {

	}


	/**
 * Builds a legend illustrating the statistical values of the pie charts' different colours
 * 
 * @param {*} m map 
 * @param {*} lgg parent legend object from core/legend.js 
 * @param {*} config color legend config object (colorLegend object specified as property of legend config parameter)
 */
	function buildColorLegend(m, lgg, config) {

	}

	return out;
}
