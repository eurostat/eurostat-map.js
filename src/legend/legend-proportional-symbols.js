import { legendSize, legendSymbol } from "d3-svg-legend";
import { format } from "d3-format";
import { scaleOrdinal } from "d3-scale";
import * as lg from '../core/legend';
import { getSymbolType } from "../maptypes/map-proportional-symbols";
import { symbol } from 'd3-shape';

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

		let d3Legend

		if (legendConfig.map_.psShape_ !== "circle") {
			// use legendSize() with custom scale for d3 shapes
			let domain = m.classifier_.domain();
			let shape;
			let cells = legendConfig.cellNb + 1;

			if (legendConfig.map_.psShape_ == "custom") {
				shape = legendConfig.map_.psCustomShape_;
			} else {
				let symbolType = getSymbolType(legendConfig.map_.psShape_);
				shape = symbol().type(symbolType);
			}

			let values = [
				domain[1] / 10,
				domain[1] / 2,
				domain[1]
			];
			let sizes = [
				m.classifier_(values[0]),
				m.classifier_(values[1]),
				m.classifier_(values[2])
			];
			var symbolScale = scaleOrdinal()
				.domain(values)
				.range([
					shape.size(sizes[0] * sizes[0])(),
					shape.size(sizes[1] * sizes[1])(),
					shape.size(sizes[2] * sizes[2])()
				]);


			d3Legend = legendSymbol()
				.scale(symbolScale)
				.labelFormat(".,2r")
				;

		} else {
			// for standard circle legend
			d3Legend = legendSize()
				.shape("circle")
				.scale(m.classifier());
		}

		//common methods between all ps legends:
		d3Legend
			.title(legendConfig.titleText)
			.titleWidth(legendConfig.titleWidth)
			//.scale(m.classifier())
			.cells(legendConfig.cellNb + 1)
			.cellFilter(function (d) { if (!d.data) return false; return true; })
			.orient("vertical")
			.ascending(legendConfig.ascending)
			//.shape("circle") //"rect", "circle", or "line"
			.shapePadding(legendConfig.shapePadding)
			//.classPrefix("prefix")
			.labels(function (d) { return d.generatedLabels[d.i] })
			//.labelAlign("middle") //?
			.labelFormat(legendConfig.format || format(",." + legendConfig.labelDecNb + "r"))
			.labelOffset(legendConfig.labelOffset)
			.labelWrap(legendConfig.labelWrap)

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
