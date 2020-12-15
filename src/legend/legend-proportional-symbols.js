import { legendSize } from "d3-svg-legend";
import { format } from "d3-format";
import * as lg from '../core/legend';

/**
 * A legend for proportional symbol map
 * 
 * @param {*} map 
 */
export const legendProportionalSymbols = function (map) {
	const legendConfig = lg.legend(map);

	//attributes
	legendConfig.cellNb_ = 4;
	legendConfig.cellNb = function (v) { if (!arguments.length) return legendConfig["cellNb_"]; legendConfig["cellNb_"] = v; return legendConfig.map(); }

	// user-define d3 format function
	legendConfig.format_ = null
	legendConfig.format = function (v) { if (!arguments.length) return legendConfig["format_"]; legendConfig["format_"] = v; return legendConfig.map(); }

	//@override
	legendConfig.update = function () {
		const m = legendConfig.map_;
		//const svgMap = m.svg();
		const g = legendConfig.g_;

		//remove previous content
		g.selectAll("*").remove();

		//background rectangle
		g.append("rect").attr("id", "legendBR").attr("x", -legendConfig.boxPadding).attr("y", -legendConfig.titleFontSize - legendConfig.boxPadding + 6)
			.attr("rx", legendConfig.boxCornerRad).attr("ry", legendConfig.boxCornerRad)
			.attr("width", legendConfig.width).attr("height", legendConfig.height)
			.style("fill", legendConfig.boxFill).style("opacity", legendConfig.boxOpacity);

		//TODO better choose circle sizes. Rounded values.
		//define legend
		//see http://d3-legend.susielu.com/#size

		const d3Legend = legendSize()
			.title(legendConfig.titleText)
			.titleWidth(legendConfig.titleWidth)
			.scale(m.classifier())
			.cells(legendConfig.cellNb + 1)
			.cellFilter(function (d) { if (!d.data) return false; return true; })
			.orient("vertical")
			.ascending(legendConfig.ascending)
			.shape("circle") //"rect", "circle", or "line"
			.shapePadding(legendConfig.shapePadding)
			//.classPrefix("prefix")
			.labels(function (d) { return d.generatedLabels[d.i] })
			//.labelAlign("middle") //?
			.labelFormat(legendConfig.format || format("." + legendConfig.labelDecNb + "f"))
			.labelOffset(legendConfig.labelOffset)
			.labelWrap(legendConfig.labelWrap)
			;

		//make legend
		g.call(d3Legend);

		//apply style to legend elements
		g.selectAll(".swatch")
			.style("fill", m.psFill())
			.style("fill-opacity", m.psFillOpacity())
			.style("stroke", m.psStroke())
			.style("stroke-width", m.psStrokeWidth());

		g.select(".legendTitle").style("font-size", legendConfig.titleFontSize);
		g.selectAll("text.label").style("font-size", legendConfig.labelFontSize);
		g.style("font-family", legendConfig.fontFamily);
	}

	//@override
	legendConfig.computeWidth = function () {
		return legendConfig.boxPadding * 2 + Math.max(legendConfig.titleWidth, legendConfig.map_.psMaxSize_ + legendConfig.labelOffset + legendConfig.labelWrap);
	}
	//@override
	legendConfig.computeHeight = function () {
		return legendConfig.boxPadding * 2 + legendConfig.titleFontSize + (legendConfig.map_.psMaxSize_ * 0.7 + legendConfig.shapePadding) * (legendConfig.cellNb) + 35;
	}

	return legendConfig;
}
