import { select } from "d3-selection";
import { legendColor } from "d3-svg-legend";
import { format } from "d3-format";
import * as lg from './legend';

/**
 * A legend for choropleth maps
 * 
 * @param {*} map 
 */
export const legendChoropleth = function (map) {

	const out = lg.legend(map);

	//@override
	out.update = function() {
		const m = out.map();
        const svgMap = select("#" + m.svgId());
        const g = out.g();

		//remove previous content
		g.selectAll("*").remove();

		//background rectangle
		g.append("rect").attr("id", "legendBR").attr("x", -out.boxPadding_).attr("y", -out.titleFontSize_ - out.boxPadding_ + 6)
			.attr("rx", out.boxCornerRadius_).attr("ry", out.boxCornerRadius_)
			.attr("width", out.width_).attr("height", out.height_)
			.style("fill", out.boxFill_).style("opacity", out.boxOpacity_);

		//define legend
		//see http://d3-legend.susielu.com/#color
		const d3Legend = legendColor()
			.title(out.titleText_)
			.titleWidth(out.titleWidth_)
			.useClass(true)
			.scale(m.classifier())
			.ascending(out.ascending_)
			.shapeWidth(out.shapeWidth_)
			.shapeHeight(out.shapeHeight_)
			.shapePadding(out.shapePadding_)
			.labelFormat(format(".0" + out.labelDecNb_ + "f"))
			//.labels(d3.legendHelpers.thresholdLabels)
			.labels( function (d) {
					if (d.i === 0)
						return "< " + d.generatedLabels[d.i].split(d.labelDelimiter)[1];
					else if (d.i === d.genLength - 1)
						return ">= " + d.generatedLabels[d.i].split(d.labelDelimiter)[0];
					else
						return d.generatedLabels[d.i]
					})
			.labelDelimiter(out.labelDelimiter_)
			.labelOffset(out.labelOffset_)
			.labelWrap(out.labelWrap_)
			//.labelAlign("end") //?
			//.classPrefix("from ")
			//.orient("vertical")
			//.shape("rect")
			.on("cellover", function (ecl) {
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", m.nutsrgSelectionFillStyle());
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
		g.select(".legendTitle").style("font-size", out.titleFontSize_);
		g.selectAll("text.label").style("font-size", out.labelFontSize_);
		g.style("font-family", out.fontFamily_);
	}

	//@override
	out.computeWidth = function() {
		return out.boxPadding_ * 2 + Math.max(out.titleWidth_, out.shapeWidth_ + out.labelOffset_ + out.labelWrap_);
	}
	//@override
	out.computeHeight = function() {
		return out.boxPadding_ * 2 + out.titleFontSize_ + (out.shapeHeight_ + out.shapePadding_ + 8) * (out.map().clnb());
	}

	return out;
}
