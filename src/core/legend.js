import { select } from "d3-selection";

/**
 * A eurostat-map legend. This is an abstract method.
*/
export const legend = function (map, config) {
	config = config || {};

	//build legend object
	const out = {};

	//link map to legend
	out.map = map;

	//the SVG where to make the legend
	out.svgId_ = config.svgId || "legend_" + Math.round(10e15 * Math.random());
	out.svg_ = undefined;

	//the legend element dimension
	out.width = config.width;
	out.height = config.height;
	//the legend element position, in case it is embeded within the map SVG
	out.x = config.x;
	out.y = config.y;

	//the legend box
	out.boxMargin = config.boxMargin || 10;
	out.boxPadding = config.boxPadding || 7;
	out.boxCornerRad = config.boxCornerRad || 7;
	out.boxFill = config.boxFill || "#eeeeee";
	out.boxOpacity = config.boxOpacity == undefined? 0.5 : config.boxOpacity;

	out.fontFamily = config.fontFamily || "Helvetica, Arial, sans-serif";

	//legend title
	out.titleText = config.titleText == undefined? "" : config.titleText;
	out.titleFontSize = config.titleFontSize == undefined? 15 : config.titleFontSize;
	out.titleWidth = config.titleWidth || 140;

	//legeng element labels
	out.labelFontSize = config.labelFontSize || 12;
	out.labelDelim = config.labelDelim || " - ";
	out.labelWrap = config.labelWrap || 140;
	out.labelDecNb = config.labelDecNb == undefined ? 2 : config.labelDecNb;
	out.labelOffset = config.labelOffset || 5;

	//TODO: move those to the legends where it is used, only?
	out.ascending = (config.ascending == undefined)? true : config.ascending;
	out.shapeWidth = config.shapeWidth || 13;
	out.shapeHeight = config.shapeHeight || 15;
	out.shapePadding = config.shapePadding || 5;


	/**
	 * Build legend element.
	 */
	out.build = function () {

		//set SVG element
		out.svg_ = select("#" + out.svgId_);

		//set size
		if (!out.width) out.width = out.computeWidth();
		if (!out.height) out.height = out.computeHeight();
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
	 * Return a default value for the legend width.
	 * This is an abstract method.
	 */
	out.computeWidth = function () {
		console.log("Legend computeWidth not implemented")
		return 100;
	}

	/**
	 * Return a default value for the legend height.
	 * This is an abstract method.
	 */
	out.computeHeight = function () {
		console.log("Legend computeHeight not implemented")
		return 100;
	}

	return out;
}
