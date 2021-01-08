import { legendSize } from "d3-svg-legend";
import { format } from "d3-format";
import * as lg from '../core/legend';

/**
 * A legend for proportional symbol map
 * 
 * @param {*} map 
 */
export const legendProportionalSymbols = function (map, config) {

	//build generic legend object for the map
	const out = lg.legend(map, config);

	//number of elements in the legend
	out.cellNb = 4;
	//the order of the legend elements. Set to false to invert.
	out.ascending = true;
	//the distance between consecutive legend box elements
	out.shapePadding = 5;
	//the font size of the legend label
	out.labelFontSize = 12;
	// user-define d3 format function
	out.format = undefined;
	//the number of decimal for the legend labels
	out.labelDecNb = 2;
	//the distance between the legend box elements to the corresponding text label
	out.labelOffset = 5;

	//override attribute values with config values
	if(config) for (let key in config) out[key] = config[key];


	//@override
	out.update = function () {
		const m = out.map;
		//const svgMap = m.svg();
		const lgg = out.lgg;

		//remove previous content
		lgg.selectAll("*").remove();

		//? necessary. But should become obsolete when abandonning "d3-svg-legend"
		lgg.attr("transform", "translate(20,10)")

		//draw legend background box
		out.makeBackgroundBox();

		//TODO better choose circle sizes. Rounded values.
		//define legend
		//see http://d3-legend.susielu.com/#size

		const d3Legend = legendSize()
			.title(out.title)
			.scale(m.classifier())
			.cells(out.cellNb + 1)
			.cellFilter(function (d) { if (!d.data) return false; return true; })
			.orient("vertical")
			.ascending(out.ascending)
			.shape("circle") //"rect", "circle", or "line"
			.shapePadding(out.shapePadding)
			//.classPrefix("prefix")
			.labels(function (d) { return d.generatedLabels[d.i] })
			//.labelAlign("middle") //?
			.labelFormat(out.format || format("." + out.labelDecNb + "f"))
			.labelOffset(out.labelOffset)
			.labelWrap(out.labelWrap)
			;

		//make legend
		lgg.call(d3Legend);

		//apply style to legend elements
		lgg.selectAll(".swatch")
			.style("fill", m.psFill())
			.style("fill-opacity", m.psFillOpacity())
			.style("stroke", m.psStroke())
			.style("stroke-width", m.psStrokeWidth());

		lgg.select(".legendTitle").style("font-size", out.titleFontSize);
		lgg.selectAll("text.label").style("font-size", out.labelFontSize);
		lgg.style("font-family", out.fontFamily);

		//set legend box dimensions
		out.setBoxDimension();
	}

	return out;
}
