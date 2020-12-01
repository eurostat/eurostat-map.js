import { select } from "d3-selection";
import { legendColor } from "d3-svg-legend";
import * as lg from '../core/legend';

/**
 * A legend for categorical maps
 * 
 * @param {*} map 
 */
export const legendCategorical = function (map) {
	const legendConfig = lg.legend(map);

	//@override
	legendConfig.update = function () {
		const m = legendConfig.map_;
		const cla = m.classifier();
		const claInv = m.classifierInverse();
		const g = legendConfig.g_;

		const svgMap = m.svg();

		//remove previous content
		g.selectAll("*").remove();

		//background rectangle
		g.append("rect").attr("id", "legendBR").attr("x", -legendConfig.boxPadding).attr("y", -legendConfig.titleFontSize - legendConfig.boxPadding + 6)
			.attr("rx", legendConfig.boxCornerRad).attr("ry", legendConfig.boxCornerRad)
			.attr("width", legendConfig.width).attr("height", legendConfig.height)
			.style("fill", legendConfig.boxFill).style("opacity", legendConfig.boxOpacity);

		//define legend
		//see http://d3-legend.susielu.com/#color
		const d3Legend = legendColor()
			.title(legendConfig.titleText)
			.titleWidth(legendConfig.titleWidth)
			.useClass(true)
			.scale(cla)
			.ascending(legendConfig.ascending)
			.shapeWidth(legendConfig.shapeWidth)
			.shapeHeight(legendConfig.shapeHeight)
			.shapePadding(legendConfig.shapePadding)
			.labels(function (d) {
				return m.classToText() ? m.classToText()[claInv(d.i)] || claInv(d.i) : claInv(d.i);
			})
			.labelDelimiter(legendConfig.labelDelim)
			.labelOffset(legendConfig.labelOffset)
			.labelWrap(legendConfig.labelWrap)
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
		g.select(".legendTitle").style("font-size", legendConfig.titleFontSize);
		g.selectAll("text.label").style("font-size", legendConfig.labelFontSize);
		g.style("font-family", legendConfig.fontFamily);
	}

	//@override
	legendConfig.computeWidth = function () {
		return legendConfig.boxPadding * 2 + Math.max(legendConfig.titleWidth, legendConfig.shapeWidth + legendConfig.labelOffset + legendConfig.labelWrap);
	}
	//@override
	legendConfig.computeHeight = function () {
		return legendConfig.boxPadding * 2 + legendConfig.titleFontSize + legendConfig.shapeHeight + (1 + legendConfig.shapeHeight + legendConfig.shapePadding) * (legendConfig.map_.clnb_ - 1) + 12;
	}

	return legendConfig;
}
