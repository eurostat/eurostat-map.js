import { select } from "d3-selection";
import { legendColor, legendSize } from "d3-svg-legend";
import { format } from "d3-format";


/**
 * A eurostat-map legend.
 * It is provided as an independant SVG image, which can be nested inside the map SVG.
*/
export const legend = function (map) {
	const out = {};

	//TODO should depend only on the map style and classification
	out.map_ = map;
	out.classifier = ()=>{ return out.map_.classifier() };
	out.classifierInverse = ()=>{ return out.map_.classifierInverse() };

	out.fontFamily_ = "Helvetica, Arial, sans-serif";
	out.titleText_ = "Legend";
	out.titleFontSize_ = 20;
	out.titleWidth_ = 140;
	out.boxWidth_ = 250;
	out.boxHeight_ = 350;
	out.boxMargin_ = 10;
	out.boxPadding_ = 10;
	out.boxCornerRadius_ = out.boxPadding_;
	out.boxFill_ = "white";
	out.boxOpacity_ = 0.5;
	out.ascending_ = true;
	out.shapeWidth_ = 20;
	out.shapeHeight_ = 16;
	out.shapePadding_ = 2;
	out.labelFontSize_ = 15;
	out.labelDelimiter_ = " - ";
	out.labelWrap_ = 140;
	out.labelDecNb_ = 2;
	out.labelOffset_ = 5;

	out.cellNb_ = 4; // for ps maps only

	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	for (let att in out)
		(function () {
			var att_ = att;
			out[att_.substring(0, att_.length - 1)] = function (v) { if (!arguments.length) return out[att_]; out[att_] = v; return out; };
		})();



	/**
	 * Update the legend element.
	 */
	out.update = function () {
		//TODO change that - use own SVG element instead
		const svg = select("#" + out.map_.svgId());
		const lgg = svg.select("#legendg");

		//remove previous content
		lgg.selectAll("*").remove();

		const type = out.map_.type();
		if (type === "ch")
			updateLegendCommonCH_CT(svg,lgg);
		else if (type == "ct")
			updateLegendCT(svg,lgg);
		else if (type == "ps")
			updateLegendPS(svg,lgg);
		else
			console.log("Unknown map type: " + type)

		return out;
	};


	const updateLegendCommonCH_CT = function(svg,lgg) {
			//locate
			out.boxWidth_ = out.boxWidth_ || out.boxPadding_ * 2 + Math.max(out.titleWidth_, out.shapeWidth_ + out.labelOffset_ + out.labelWrap_);
			out.boxHeight_ = out.boxHeight_ || out.boxPadding_ * 2 + out.titleFontSize_ + out.shapeHeight_ + (1 + out.shapeHeight_ + out.shapePadding_) * (out.clnb_ - 1) + 12;
			//TODO should be moved
			lgg.attr("transform", "translate(" + (out.map_.width() - out.boxWidth_ - out.boxMargin_ + out.boxPadding_) + "," + (out.titleFontSize_ + out.boxMargin_ + out.boxPadding_ - 6) + ")");

			//background rectangle
			var lggBR = lgg.append("rect").attr("id", "legendBR").attr("x", -out.boxPadding_).attr("y", -out.titleFontSize_ - out.boxPadding_ + 6)
				.attr("rx", out.boxCornerRadius_).attr("ry", out.boxCornerRadius_)
				.attr("width", out.boxWidth_).attr("height", out.boxHeight_)
				.style("fill", out.boxFill_).style("opacity", out.boxOpacity_);

			//define legend
			//see http://d3-legend.susielu.com/#color
			var d3Legend = legendColor()
				.title(out.titleText_)
				.titleWidth(out.titleWidth_)
				.useClass(true)
				.scale(out.classifier())
				.ascending(out.ascending_)
				.shapeWidth(out.shapeWidth_)
				.shapeHeight(out.shapeHeight_)
				.shapePadding(out.shapePadding_)
				.labelFormat(format(".0" + out.labelDecNb_ + "f"))
				//.labels(d3.legendHelpers.thresholdLabels)
				.labels(
					out.map_.type() === "ch" ? function (d) {
						if (d.i === 0)
							return "< " + d.generatedLabels[d.i].split(d.labelDelimiter)[1];
						else if (d.i === d.genLength - 1)
							return ">=" + d.generatedLabels[d.i].split(d.labelDelimiter)[0];
						else
							return d.generatedLabels[d.i]

					}
						: function (d) {
							return out.map_.classToText_ ? out.map_.classToText_[out.classifierInverse_(d.i)] || out.classifierInverse_(d.i) : out.classifierInverse_(d.i);
						}
				)
				.labelDelimiter(out.labelDelimiter_)
				.labelOffset(out.labelOffset_)
				.labelWrap(out.labelWrap_)
				//.labelAlign("end") //?
				//.classPrefix("from ")
				//.orient("vertical")
				//.shape("rect")
				.on("cellover", function (ecl) {
					if (out.map_.type() === "ct") ecl = out.classifier(ecl);
					var sel = svg.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
					sel.style("fill", out.map_.nutsrgSelectionFillStyle_);
					sel.attr("fill___", function (d) { select(this).attr("fill"); });
				})
				.on("cellout", function (ecl) {
					if (out.map_.type() === "ct") ecl = out.classifier(ecl);
					var sel = svg.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
					sel.style("fill", function (d) { select(this).attr("fill___"); });
				});

			//make legend
			lgg.call(d3Legend);

			//apply style to legend elements
			svg.selectAll(".swatch")
				.attr("ecl", function () {
					var ecl = select(this).attr("class").replace("swatch ", "");
					if (!ecl || ecl === "nd") return "nd";
					return ecl;
				})
				.attr("fill", function () {
					var ecl = select(this).attr("class").replace("swatch ", "");
					if (!ecl || ecl === "nd") return out.map_.noDataFillStyle() || "gray";
					return out.map_.type() == "ch" ? out.map_.classToFillStyleCH()(ecl, out.map_.clnb()) : out.map_.classToFillStyleCT()[classifRec(ecl)];
				})
				//.attr("stroke", "black")
				//.attr("stroke-width", 0.5)
				;
			lgg.select(".legendTitle").style("font-size", out.titleFontSize_);
			lgg.selectAll("text.label").style("font-size", out.labelFontSize_);
			lgg.style("font-family", out.fontFamily_);
	}

	const updateLegendCT = function(svg,lgg) {
		updateLegendCommonCH_CT(svg,lgg);

		//define legend
		//see http://d3-legend.susielu.com/#color
		//http://d3-legend.susielu.com/#symbol ?
		var d3Legend = legendColor()
			.title(out.titleText_)
			.titleWidth(out.titleWidth_)
			.useClass(true)
			.scale(out.classifier())
			.ascending(out.ascending_)
			.shapeWidth(out.shapeWidth_)
			.shapeHeight(out.shapeHeight_)
			.shapePadding(out.shapePadding_)
			;

		//make legend
		lgg.call(d3Legend);
	}

	const updateLegendPS = function(svg,lgg) {
			//locate
			out.boxWidth_ = out.boxWidth_ || out.boxPadding_ * 2 + Math.max(out.titleWidth_, out.psMaxSize_ + out.labelOffset_ + out.labelWrap_);
			out.boxHeight_ = out.boxHeight_ || out.boxPadding_ * 2 + out.titleFontSize_ + (out.map_.psMaxSize_ * 0.7 + out.shapePadding_) * (out.cellNb_) + 35;
			lgg.attr("transform", "translate(" + (out.map_.width() - out.boxWidth_ - out.boxMargin_ + out.boxPadding_) + "," + (out.titleFontSize_ + out.boxMargin_ + out.boxPadding_ - 6) + ")");

			//background rectangle
			var lggBR = lgg.append("rect").attr("id", "legendBR").attr("x", -out.boxPadding_).attr("y", -out.titleFontSize_ - out.boxPadding_ + 6)
				.attr("rx", out.boxCornerRadius_).attr("ry", out.boxCornerRadius_)
				.attr("width", out.boxWidth_).attr("height", out.boxHeight_)
				.style("fill", out.boxFill_).style("opacity", out.boxOpacity_);

			//define legend
			//see http://d3-legend.susielu.com/#size
			var d3Legend = legendSize()
				.title(out.titleText_)
				.titleWidth(out.titleWidth_)
				.scale(out.classifier())
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
			lgg.call(d3Legend);

			//apply style to legend elements
			svg.selectAll(".swatch")
				.style("fill", out.map_.psFill())
				.style("fill-opacity", out.map_.psFillOpacity())
				.style("stroke", out.map_.psStroke())
				.style("stroke-width", out.map_.psStrokeWidth());

			lgg.select(".legendTitle").style("font-size", out.titleFontSize_);
			lgg.selectAll("text.label").style("font-size", out.labelFontSize_);
			lgg.style("font-family", out.fontFamily_);
	}

	return out;
}

