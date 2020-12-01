import { select } from "d3-selection";
import { legendColor } from "d3-svg-legend";
import { format } from "d3-format";
import * as lg from '../core/legend';

/**
 * A legend for choropleth maps
 * 
 * @param {*} map 
 */
export const legendChoropleth = function (map) {

	const legendConfig = lg.legend(map);

	//@override
	legendConfig.update = function () {
		const m = legendConfig.map_;
		const svgMap = m.svg();
		const g = legendConfig.g_;

		//remove previous content
		g.selectAll("*").remove();

		//background rectangle
		g.append("rect")
			.attr("id", "legendBR")
			.attr("x", -legendConfig.boxPadding)
			.attr("y", -legendConfig.titleFontSize - legendConfig.boxPadding + 6)
			.attr("rx", legendConfig.boxCornerRad)
			.attr("ry", legendConfig.boxCornerRad)
			.attr("width", legendConfig.width)
			.attr("height", legendConfig.height)
			.style("fill", legendConfig.boxFill)
			.style("opacity", legendConfig.boxOpacity);

		//define legend
		//see http://d3-legend.susielu.com/#color
		const d3Legend = legendColor()
			.title(legendConfig.titleText)
			.titleWidth(legendConfig.titleWidth)
			.useClass(true)
			.scale(m.classifier())
			.ascending(legendConfig.ascending)
			.shapeWidth(legendConfig.shapeWidth)
			.shapeHeight(legendConfig.shapeHeight)
			.shapePadding(legendConfig.shapePadding)
			.labelFormat(format(".0" + legendConfig.labelDecNb + "f"))
			//.labels(d3.legendHelpers.thresholdLabels)
			.labels(function (d) {
				if (d.i === 0)
					return "< " + d.generatedLabels[d.i].split(d.labelDelimiter)[1];
				else if (d.i === d.genLength - 1)
					return ">= " + d.generatedLabels[d.i].split(d.labelDelimiter)[0];
				else
					return d.generatedLabels[d.i]
			})
			.labelDelimiter(legendConfig.labelDelim)
			.labelOffset(legendConfig.labelOffset)
			.labelWrap(legendConfig.labelWrap)
			//.labelAlign("end") //?
			//.classPrefix("from ")
			//.orient("vertical")
			//.shape("rect")
			.on("cellover", function (ecl) {
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", m.nutsrgSelFillSty());
				sel.attr("fill___", function (d) { select(this).attr("fill"); });
			})
			.on("cellout", function (ecl) {
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
				return m.classToFillStyleCH()(ecl, m.clnb());
			})
			//.attr("stroke", "black")
			//.attr("stroke-width", 0.5)
			;
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
		return legendConfig.boxPadding * 2 + legendConfig.titleFontSize + (legendConfig.shapeHeight + legendConfig.shapePadding + 8) * (legendConfig.map_.clnb_);
	}

	return legendConfig;
}
