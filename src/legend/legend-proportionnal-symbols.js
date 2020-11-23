import { legendSize } from "d3-svg-legend";
import { format } from "d3-format";
import * as lg from './legend';

/**
 * A legend for proportionnal symbol map
 * 
 * @param {*} map 
 */
export const legendProportionnalSymbols = function (map) {
	const out = lg.legend(map);

	//attributes
	out.cellNb_ = 4;
	out.cellNb = function (v) { if (!arguments.length) return out["cellNb_"]; out["cellNb_"] = v; return out.map(); }



	out.update = function() {
		const m = out.map();
		//const svgMap = select("#" + m.svgId());

		//remove previous content
		out._lgg.selectAll("*").remove();

		//background rectangle
		out._lgg.append("rect").attr("id", "legendBR").attr("x", -out.boxPadding_).attr("y", -out.titleFontSize_ - out.boxPadding_ + 6)
			.attr("rx", out.boxCornerRadius_).attr("ry", out.boxCornerRadius_)
			.attr("width", out.width_).attr("height", out.height_)
			.style("fill", out.boxFill_).style("opacity", out.boxOpacity_);

		//TODO better choose circle sizes. Rounded values.
		//define legend
		//see http://d3-legend.susielu.com/#size
		const d3Legend = legendSize()
			.title(out.titleText_)
			.titleWidth(out.titleWidth_)
			.scale(m.classifier())
			.cells(out.cellNb_ + 1)
			.cellFilter(function (d) { if (!d.data) return false; return true; })
			.orient("vertical")
			.ascending(out.ascending_)
			.shape("circle") //"rect", "circle", or "line"
			.shapePadding(out.shapePadding_)
			//.classPrefix("prefix")
			.labels(function (d) { return d.generatedLabels[d.i] })
			//.labelAlign("middle") //?
			.labelFormat(format("." + out.labelDecNb_ + "f"))
			.labelOffset(out.labelOffset_)
			.labelWrap(out.labelWrap_)
			;

		//make legend
		out._lgg.call(d3Legend);

		//apply style to legend elements
		out._lgg.selectAll(".swatch")
			.style("fill", m.psFill())
			.style("fill-opacity", m.psFillOpacity())
			.style("stroke", m.psStroke())
			.style("stroke-width", m.psStrokeWidth());

		out._lgg.select(".legendTitle").style("font-size", out.titleFontSize_);
		out._lgg.selectAll("text.label").style("font-size", out.labelFontSize_);
		out._lgg.style("font-family", out.fontFamily_);
	}

	out.computeWidth = function() {
		return out.boxPadding_ * 2 + Math.max(out.titleWidth_, out.psMaxSize_ + out.labelOffset_ + out.labelWrap_);
	}
	out.computeHeight = function() {
		return out.boxPadding_ * 2 + out.titleFontSize_ + (m.psMaxSize() * 0.7 + out.shapePadding_) * (out.cellNb_) + 35;
	}
	out.computePosition = function() {
		const x = out.boxPadding_;
		const y = out.boxPadding_ + out.titleFontSize_;
		return [x,y];
	}

	return out;
}
