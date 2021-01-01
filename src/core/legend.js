import { select } from "d3-selection";

/**
 * A eurostat-map legend. This is an abstract method.
*/
export const legend = function (map, config) {

	//build legend object
	const out = {};

	//link map to legend
	out.map = map;

	//the SVG where to make the legend
	out.svgId = "legend_" + Math.round(10e15 * Math.random());
	out.svg = undefined;
	out.lgg = undefined;

	//the legend element dimension
	//out.width = undefined;
	//out.height = undefined;
	//the legend element position, in case it is embeded within the map SVG
	out.x = undefined;
	out.y = undefined;

	//the legend box
	//TODO: move legend box drawing to generic build function ?
	out.boxMargin = 10;
	out.boxPadding = 7;
	out.boxCornerRad = 7;
	out.boxFill = "#eeeeee";
	out.boxOpacity = 0.5;

	//font
	out.fontFamily = "Helvetica, Arial, sans-serif";

	//legend title
	out.title = "";
	out.titleFontSize = 15;
	out.titleWidth = 140;

	//legend element labels
	out.labelFontSize = 12;
	out.labelDelim = " - "; //TODO still needed ?
	out.labelWrap = 140; //TODO still needed?
	out.labelDecNb = 2;
	out.labelOffset = 5;

	//TODO: move those to the legends where it is used, only?
	out.ascending = true;
	out.shapeWidth = 13;
	out.shapeHeight = 15;
	out.shapePadding = 5;

	//override attribute values with config values
	if(config) for (let key in config) out[key] = config[key];

	/**
	 * Build legend element.
	 */
	out.build = function () {

		//set SVG element
		out.svg = select("#" + out.svgId);
		out.lgg = out.svg.append("g").attr("id", "g_" + out.svgId);
	}

	/**
	 * Update the legend element.
	 * This is an abstract method.
	 */
	out.update = function () {
		console.log("Legend update function not implemented")
		return out;
	};

	/**
	 * Ensure the legend box has suitable dimensions to fit to all legend graphic elements
	 */
	out.setBoxDimension = function() {
		//get legend bounding box
		const bb = out.lgg.node().getBBox({stroke:true});
		//apply legend bounding box to legend box
		const p = out.boxPadding;
		out.svg.select("#legendBR")
			.attr("x",bb.x-p).attr("y",bb.y-p).attr("width", bb.width+2*p).attr("height", bb.height+2*p)
	}

	return out;
}
