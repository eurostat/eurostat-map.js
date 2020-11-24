import { select } from "d3-selection";
import { legendColor } from "d3-svg-legend";
import * as lg from './legend';

/**
 * A legend for categorical maps
 * 
 * @param {*} map 
 */
export const legendCategorical = function (map) {
	const out = lg.legend(map);

	//@override
	out.update = function() {
		const m = out.map();
		const cla = m.classifier();
		const claInv = m.classifierInverse();
        const g = out.g();

		const svgMap = select("#" + m.svgId());

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
			.scale(cla)
			.ascending(out.ascending_)
			.shapeWidth(out.shapeWidth_)
			.shapeHeight(out.shapeHeight_)
			.shapePadding(out.shapePadding_)
			.labels( function (d) {
				return m.classToText() ? m.classToText()[claInv(d.i)] || claInv(d.i) : claInv(d.i);
			})
			.labelDelimiter(out.labelDelimiter_)
			.labelOffset(out.labelOffset_)
			.labelWrap(out.labelWrap_)
			.on("cellover", function (ecl) {
				ecl = cla(ecl);
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", m.nutsrgSelectionFillStyle());
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
		return out.boxPadding_ * 2 + out.titleFontSize_ + out.shapeHeight_ + (1 + out.shapeHeight_ + out.shapePadding_) * (out.map().clnb() - 1) + 12;
	}
	//@override
	out.computePosition = function() {
		const x = out.boxPadding_;
		const y = out.boxPadding_ + out.titleFontSize_;
		return [x,y];
	}

	return out;
}
