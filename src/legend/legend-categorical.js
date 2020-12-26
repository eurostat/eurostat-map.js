import { select } from "d3-selection";
import { legendColor } from "d3-svg-legend";
import * as lg from '../core/legend';

/**
 * A legend for categorical maps
 * 
 * @param {*} map 
 */
export const legendCategorical = function (map, config) {
	config = config || {};

	//build generic legend object for the map
	const out = lg.legend(map, config);

	//@override
	out.update = function () {
		const m = out.map;
		const cla = m.classifier();
		const claInv = m.classifierInverse();
		const g = out.g_;

		const svgMap = m.svg();

		//remove previous content
		g.selectAll("*").remove();

		//background rectangle
		g.append("rect").attr("id", "legendBR").attr("x", -out.boxPadding).attr("y", -out.titleFontSize - out.boxPadding + 6)
			.attr("rx", out.boxCornerRad).attr("ry", out.boxCornerRad)
			.attr("width", out.width).attr("height", out.height)
			.style("fill", out.boxFill).style("opacity", out.boxOpacity);

		//define legend
		//see http://d3-legend.susielu.com/#color
		const d3Legend = legendColor()
			.title(out.titleText)
			.titleWidth(out.titleWidth)
			.useClass(true)
			.scale(cla)
			.ascending(out.ascending)
			.shapeWidth(out.shapeWidth)
			.shapeHeight(out.shapeHeight)
			.shapePadding(out.shapePadding)
			.labels(function (d) {
				return m.classToText() ? m.classToText()[claInv(d.i)] || claInv(d.i) : claInv(d.i);
			})
			.labelDelimiter(out.labelDelim)
			.labelOffset(out.labelOffset)
			.labelWrap(out.labelWrap)
			.on("cellover", function (ecl) {
				ecl = cla(ecl);
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", m.nutsrgSelFillSty());
				sel.attr("fill___", function (d) { select(this).attr("fill"); });
			})
			.on("cellout", function (ecl) {
				ecl = cla(ecl);
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", function (d) { select(this).attr("fill___"); });
			});

		//make legend
		g.call(d3Legend);

		//apply style to legend elements
		g.selectAll(".swatch")
			.attr("ecl", function () {
				const ecl = select(this).attr("class").replace("swatch ", "");
				if (!ecl || ecl === "nd") return "nd";
				return ecl;
			})
			.attr("fill", function () {
				const ecl = select(this).attr("class").replace("swatch ", "");
				if (!ecl || ecl === "nd") return m.noDataFillStyle() || "gray";
				return m.classToFillStyleCT()[claInv(ecl)];
			});
		g.select(".legendTitle").style("font-size", out.titleFontSize);
		g.selectAll("text.label").style("font-size", out.labelFontSize);
		g.style("font-family", out.fontFamily);
	}

	//@override
	out.computeWidth = function () {
		return out.boxPadding * 2 + Math.max(out.titleWidth, out.shapeWidth + out.labelOffset + out.labelWrap);
	}
	//@override
	out.computeHeight = function () {
		return out.boxPadding * 2 + out.titleFontSize + out.shapeHeight + (1 + out.shapeHeight + out.shapePadding) * (out.map.clnb_ - 1) + 12;
	}

	return out;
}
