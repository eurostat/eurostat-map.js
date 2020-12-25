import { select } from "d3-selection";
import { legendColor } from "d3-svg-legend";
import { format } from "d3-format";
import * as lg from '../core/legend';

/**
 * A legend for choropleth maps
 * 
 * @param {*} map 
 */
export const legendChoropleth = function (map, config) {
	config = config || {};

	//build generic legend object for the map
	const out = lg.legend(map, config);

	//@override
	out.update = function () {
		const m = out.map_;
		const svgMap = m.svg();
		const g = out.g_;

		//remove previous content
		g.selectAll("*").remove();

		//background rectangle
		g.append("rect")
			.attr("id", "legendBR")
			.attr("x", -out.boxPadding)
			.attr("y", -out.titleFontSize - out.boxPadding + 6)
			.attr("rx", out.boxCornerRad)
			.attr("ry", out.boxCornerRad)
			.attr("width", out.width)
			.attr("height", out.height)
			.style("fill", out.boxFill)
			.style("opacity", out.boxOpacity);

		//define legend
		//see http://d3-legend.susielu.com/#color
		const d3Legend = legendColor()
			.title(out.titleText)
			.titleWidth(out.titleWidth)
			.useClass(true)
			.scale(m.classifier())
			.ascending(out.ascending)
			.shapeWidth(out.shapeWidth)
			.shapeHeight(out.shapeHeight)
			.shapePadding(out.shapePadding)
			.labelFormat(format(".0" + out.labelDecNb + "f"))
			//.labels(d3.legendHelpers.thresholdLabels)
			.labels(function (d) {
				if (d.i === 0)
					return "< " + d.generatedLabels[d.i].split(d.labelDelimiter)[1];
				else if (d.i === d.genLength - 1)
					return ">= " + d.generatedLabels[d.i].split(d.labelDelimiter)[0];
				else
					return d.generatedLabels[d.i]
			})
			.labelDelimiter(out.labelDelim)
			.labelOffset(out.labelOffset)
			.labelWrap(out.labelWrap)
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
		return out.boxPadding * 2 + out.titleFontSize + (out.shapeHeight + out.shapePadding + 8) * (out.map_.clnb_);
	}

	return out;
}
