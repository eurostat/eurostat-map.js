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
	// user-define d3 format function
	out.format = undefined;


	//override attribute values with config values
	if(config) for (let key in config) out[key] = config[key];


	//@override
	out.update = function () {
		const m = out.map;
		//const svgMap = m.svg();
		const svg = out.svg;

		//remove previous content
		svg.selectAll("*").remove();

		//background rectangle
		svg.append("rect").attr("id", "legendBR").attr("x", -out.boxPadding).attr("y", -out.titleFontSize - out.boxPadding + 6)
			.attr("rx", out.boxCornerRad).attr("ry", out.boxCornerRad)
			.attr("width", out.width).attr("height", out.height)
			.style("fill", out.boxFill).style("opacity", out.boxOpacity);

		//TODO better choose circle sizes. Rounded values.
		//define legend
		//see http://d3-legend.susielu.com/#size

		const d3Legend = legendSize()
			.title(out.titleText)
			.titleWidth(out.titleWidth)
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
		svg.call(d3Legend);

		//apply style to legend elements
		svg.selectAll(".swatch")
			.style("fill", m.psFill())
			.style("fill-opacity", m.psFillOpacity())
			.style("stroke", m.psStroke())
			.style("stroke-width", m.psStrokeWidth());

		svg.select(".legendTitle").style("font-size", out.titleFontSize);
		svg.selectAll("text.label").style("font-size", out.labelFontSize);
		svg.style("font-family", out.fontFamily);
	}

	//@override
	out.computeWidth = function () {
		return out.boxPadding * 2 + Math.max(out.titleWidth, out.map.psMaxSize() + out.labelOffset + out.labelWrap);
	}
	//@override
	out.computeHeight = function () {
		return out.boxPadding * 2 + out.titleFontSize + (out.map.psMaxSize() * 0.7 + out.shapePadding) * (out.cellNb) + 35;
	}

	return out;
}
