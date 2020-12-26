import { legendSize } from "d3-svg-legend";
import { format } from "d3-format";
import * as lg from '../core/legend';

/**
 * A legend for proportional symbol map
 * 
 * @param {*} map 
 */
export const legendProportionalSymbols = function (map, config) {
	config = config || {};

	//build generic legend object for the map
	const out = lg.legend(map, config);

	//attributes
	out.cellNb_ = config.cellNb || 4;
	out.cellNb = function (v) { if (!arguments.length) return out["cellNb_"]; out["cellNb_"] = v; return out.map(); }

	// user-define d3 format function
	out.format_ = config.format || null
	out.format = function (v) { if (!arguments.length) return out["format_"]; out["format_"] = v; return out.map(); }

	//@override
	out.update = function () {
		const m = out.map;
		//const svgMap = m.svg();
		const g = out.g_;

		//remove previous content
		g.selectAll("*").remove();

		//background rectangle
		g.append("rect").attr("id", "legendBR").attr("x", -out.boxPadding).attr("y", -out.titleFontSize - out.boxPadding + 6)
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
		g.call(d3Legend);

		//apply style to legend elements
		g.selectAll(".swatch")
			.style("fill", m.psFill())
			.style("fill-opacity", m.psFillOpacity())
			.style("stroke", m.psStroke())
			.style("stroke-width", m.psStrokeWidth());

		g.select(".legendTitle").style("font-size", out.titleFontSize);
		g.selectAll("text.label").style("font-size", out.labelFontSize);
		g.style("font-family", out.fontFamily);
	}

	//@override
	out.computeWidth = function () {
		return out.boxPadding * 2 + Math.max(out.titleWidth, out.map.psMaxSize_ + out.labelOffset + out.labelWrap);
	}
	//@override
	out.computeHeight = function () {
		return out.boxPadding * 2 + out.titleFontSize + (out.map.psMaxSize_ * 0.7 + out.shapePadding) * (out.cellNb) + 35;
	}

	return out;
}
