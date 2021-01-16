import { select } from "d3-selection";
import { format } from "d3-format";
import * as lg from '../core/legend';

/**
 * A legend for choropleth maps
 * 
 * @param {*} map 
 */
export const legend = function (map, config) {

	//build generic legend object for the map
	const out = lg.legend(map);

	//the order of the legend elements. Set to false to invert.
	out.ascending = true;

	//the width of the legend box elements
	out.shapeWidth = 13;
	//the height of the legend box elements
	out.shapeHeight = 15;

	//show no data
	out.noData = true;
	//no data text label
	out.noDataText = "No data";

	//override attribute values with config values
	if(config) for (let key in config) out[key] = config[key];


	//@override
	out.update = function () {
		const m = out.map;
		const svgMap = m.svg();
		const lgg = out.lgg;

		//remove previous content
		lgg.selectAll("*").remove();

		//draw legend background box
		out.makeBackgroundBox();

		//draw title
		if(out.title)
			lgg.append("text").attr("x", out.boxPadding).attr("y", out.boxPadding + out.titleFontSize)
			.text(out.title)
			.style("font-size", out.titleFontSize).style("font-weight", out.titleFontWeight)
			.style("font-family", out.fontFamily).style("fill", out.fontFill)

		//set font family
		lgg.style("font-family", out.fontFamily);

        


		//set legend box dimensions
		out.setBoxDimension();
	}

	return out;
}
